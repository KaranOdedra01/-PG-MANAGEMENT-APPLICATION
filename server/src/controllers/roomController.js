import Room from '../models/Room.js';
import { logActivity } from '../utils/activityLogger.js';
import { escapeRegex, isValidObjectId, handleControllerError } from '../utils/sanitize.js';

// @desc    Get all rooms with search & filters
// @route   GET /api/rooms
// @access  Private
export const getRooms = async (req, res) => {
  try {
    const { floor, status, type, search } = req.query;
    const query = {};

    if (floor) {
      query.floor = Number(floor);
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.type = type;
    }
    if (search) {
      query.roomNumber = { $regex: escapeRegex(search), $options: 'i' };
    }

    // Privacy Guard: Tenants cannot see contact info (email/phone) of other tenants
    const tenantSelect = req.user.role === 'tenant' ? 'name avatar' : 'name email phone avatar';
    const rooms = await Room.find(query)
      .populate('tenants', tenantSelect)
      .sort({ floor: 1, roomNumber: 1 });

    return res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch rooms');
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Privacy Guard: Tenants cannot see contact info (email/phone) of other tenants
    const tenantSelect = req.user.role === 'tenant' ? 'name avatar' : 'name email phone avatar';
    const room = await Room.findById(id).populate('tenants', tenantSelect);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    return res.json({
      success: true,
      data: room
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch room');
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private (Admin Only)
export const createRoom = async (req, res) => {
  try {
    const { roomNumber, floor, type, capacity, rent, amenities = [] } = req.body;
    const normalizedRoomNumber = roomNumber.trim().toUpperCase();

    const exists = await Room.findOne({ roomNumber: normalizedRoomNumber });
    if (exists) {
      return res.status(400).json({ 
        success: false, 
        message: `Room number ${normalizedRoomNumber} already exists` 
      });
    }

    // Initialize bed slots based on capacity
    const beds = [];
    const capacityNum = Number(capacity);
    for (let i = 1; i <= capacityNum; i++) {
      const char = String.fromCharCode(64 + i); // 'A', 'B', 'C'...
      beds.push({
        bedNumber: `Bed ${char}`,
        isOccupied: false,
        tenantId: null
      });
    }

    const room = await Room.create({
      roomNumber: normalizedRoomNumber,
      floor: Number(floor),
      type,
      capacity: capacityNum,
      occupiedBeds: 0,
      rent: Number(rent),
      status: 'available',
      amenities: Array.isArray(amenities) ? amenities : [],
      beds,
      tenants: []
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_ROOM',
      entity: 'Room',
      entityId: room._id,
      description: `Created Room ${room.roomNumber} (${room.type}, capacity: ${room.capacity}, rent: ₹${room.rent})`
    });

    return res.status(201).json({
      success: true,
      message: `Room ${room.roomNumber} created successfully`,
      data: room
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Admin Only)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const { roomNumber, floor, type, capacity, rent, status, amenities } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (roomNumber && roomNumber.trim().toUpperCase() !== room.roomNumber) {
      const exists = await Room.findOne({ roomNumber: roomNumber.trim().toUpperCase() });
      if (exists) {
        return res.status(400).json({ 
          success: false, 
          message: `Room number ${roomNumber} is already in use` 
        });
      }
      room.roomNumber = roomNumber.trim().toUpperCase();
    }

    if (floor !== undefined) room.floor = Number(floor);
    if (type) room.type = type;
    if (rent !== undefined) room.rent = Number(rent);

    // Maintenance Safety Guard: Occupied rooms cannot be set to maintenance via PUT or PATCH
    if (status) {
      if (status === 'maintenance' && room.occupiedBeds > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot put room under maintenance while tenants are occupied. Please reallocate tenants first.'
        });
      }
      room.status = status;
    }

    if (amenities) room.amenities = Array.isArray(amenities) ? amenities : [];

    // Capacity & Bed Consistency Synchronization
    if (capacity !== undefined) {
      const newCapacity = Number(capacity);
      if (newCapacity < room.occupiedBeds) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${newCapacity} because ${room.occupiedBeds} beds are currently occupied.`
        });
      }

      if (newCapacity !== room.capacity) {
        if (!Array.isArray(room.beds)) room.beds = [];

        if (newCapacity > room.beds.length) {
          const existingLabels = new Set(room.beds.map(b => b.bedNumber));
          let charCode = 65; // 'A'
          while (room.beds.length < newCapacity) {
            const candidate = `Bed ${String.fromCharCode(charCode)}`;
            charCode++;
            if (!existingLabels.has(candidate)) {
              room.beds.push({
                bedNumber: candidate,
                isOccupied: false,
                tenantId: null
              });
              existingLabels.add(candidate);
            }
          }
        } else if (newCapacity < room.beds.length) {
          // Safely prune unoccupied beds from the tail
          for (let i = room.beds.length - 1; i >= 0 && room.beds.length > newCapacity; i--) {
            if (!room.beds[i].isOccupied) {
              room.beds.splice(i, 1);
            }
          }
        }
        room.capacity = newCapacity;
      }
    }

    await room.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_ROOM',
      entity: 'Room',
      entityId: room._id,
      description: `Updated details for Room ${room.roomNumber}`
    });

    return res.json({
      success: true,
      message: `Room ${room.roomNumber} updated successfully`,
      data: room
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to update room');
  }
};

// @desc    Toggle room status (available / maintenance)
// @route   PATCH /api/rooms/:id/status
// @access  Private (Admin & Staff)
export const toggleRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const { status } = req.body;

    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (status === 'maintenance' && room.occupiedBeds > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot put room under maintenance while tenants are occupied. Please reallocate tenants first.'
      });
    }

    room.status = status;
    await room.save();

    await logActivity({
      user: req.user,
      action: 'TOGGLE_ROOM_STATUS',
      entity: 'Room',
      entityId: room._id,
      description: `Changed Room ${room.roomNumber} status to ${status}`
    });

    return res.json({
      success: true,
      message: `Room ${room.roomNumber} status set to ${status}`,
      data: room
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to update room status');
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin Only)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.occupiedBeds > 0 || (room.tenants && room.tenants.length > 0)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied room! Please checkout or reallocate tenants first.'
      });
    }

    await room.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_ROOM',
      entity: 'Room',
      entityId: id,
      description: `Deleted Room ${room.roomNumber}`
    });

    return res.json({
      success: true,
      message: `Room ${room.roomNumber} deleted successfully`
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete room');
  }
};
