import mongoose from 'mongoose';
import Room from '../models/Room.js';
import { inMemoryRooms } from '../utils/inMemoryStore.js';

// @desc    Get all rooms with search & filters
// @route   GET /api/rooms
// @access  Private (Admin, Staff, Tenant)
export const getRooms = async (req, res) => {
  try {
    const { floor, status, type, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (floor) query.floor = Number(floor);
      if (status && status !== 'all') query.status = status;
      if (type && type !== 'all') query.type = type;
      if (search) {
        query.roomNumber = { $regex: search, $options: 'i' };
      }
      const rooms = await Room.find(query).sort({ roomNumber: 1 });
      return res.json({ success: true, count: rooms.length, data: rooms });
    }

    // In-memory filter
    let results = [...inMemoryRooms];

    if (floor) {
      results = results.filter(r => r.floor === Number(floor));
    }
    if (status && status !== 'all') {
      results = results.filter(r => r.status === status);
    }
    if (type && type !== 'all') {
      results = results.filter(r => r.type === type);
    }
    if (search) {
      results = results.filter(r => r.roomNumber.toLowerCase().includes(search.toLowerCase()));
    }

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const room = await Room.findById(id);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
      return res.json({ success: true, data: room });
    }

    const room = inMemoryRooms.find(r => r._id.toString() === id.toString());
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private (Admin Only)
export const createRoom = async (req, res) => {
  try {
    const { roomNumber, floor, type, capacity, rent, amenities = [] } = req.body;

    if (!roomNumber || !floor || !type || !capacity || !rent) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roomNumber, floor, type, capacity, and rent'
      });
    }

    if (mongoose.connection.readyState === 1) {
      const exists = await Room.findOne({ roomNumber });
      if (exists) {
        return res.status(400).json({ success: false, message: `Room number ${roomNumber} already exists` });
      }

      const room = await Room.create({
        roomNumber,
        floor: Number(floor),
        type,
        capacity: Number(capacity),
        occupiedBeds: 0,
        rent: Number(rent),
        status: 'available',
        amenities,
        tenants: []
      });

      return res.status(201).json({ success: true, message: 'Room created successfully', data: room });
    }

    // In-memory create
    const exists = inMemoryRooms.find(r => r.roomNumber.toLowerCase() === roomNumber.toString().toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, message: `Room number ${roomNumber} already exists` });
    }

    const newRoom = {
      _id: `room_${Date.now()}`,
      roomNumber: roomNumber.toString(),
      floor: Number(floor),
      type,
      capacity: Number(capacity),
      occupiedBeds: 0,
      rent: Number(rent),
      status: 'available',
      amenities: Array.isArray(amenities) ? amenities : [],
      tenants: []
    };

    inMemoryRooms.push(newRoom);
    res.status(201).json({ success: true, message: 'Room created successfully', data: newRoom });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update room details
// @route   PUT /api/rooms/:id
// @access  Private (Admin Only)
export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, floor, type, capacity, rent, status, amenities } = req.body;

    if (mongoose.connection.readyState === 1) {
      const room = await Room.findById(id);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

      if (roomNumber) room.roomNumber = roomNumber;
      if (floor) room.floor = Number(floor);
      if (type) room.type = type;
      if (capacity) room.capacity = Number(capacity);
      if (rent) room.rent = Number(rent);
      if (status) room.status = status;
      if (amenities) room.amenities = amenities;

      await room.save();
      return res.json({ success: true, message: 'Room updated successfully', data: room });
    }

    const index = inMemoryRooms.findIndex(r => r._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const target = inMemoryRooms[index];
    inMemoryRooms[index] = {
      ...target,
      roomNumber: roomNumber !== undefined ? roomNumber.toString() : target.roomNumber,
      floor: floor !== undefined ? Number(floor) : target.floor,
      type: type || target.type,
      capacity: capacity !== undefined ? Number(capacity) : target.capacity,
      rent: rent !== undefined ? Number(rent) : target.rent,
      status: status || target.status,
      amenities: amenities || target.amenities
    };

    res.json({ success: true, message: 'Room updated successfully', data: inMemoryRooms[index] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle room status (available / maintenance)
// @route   PATCH /api/rooms/:id/status
// @access  Private (Admin & Staff)
export const toggleRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['available', 'occupied', 'maintenance'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const room = inMemoryRooms.find(r => r._id.toString() === id.toString());
    if (!room) return res.status(404).json({ success: false, message: 'Room not found' });

    room.status = status;
    res.json({ success: true, message: `Room status updated to ${status}`, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a room
// @route   DELETE /api/rooms/:id
// @access  Private (Admin Only)
export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;

    if (mongoose.connection.readyState === 1) {
      const room = await Room.findById(id);
      if (!room) return res.status(404).json({ success: false, message: 'Room not found' });
      if (room.occupiedBeds > 0 || room.tenants?.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete an occupied room! Please reallocate tenants first.'
        });
      }
      await room.deleteOne();
      return res.json({ success: true, message: 'Room deleted successfully' });
    }

    const index = inMemoryRooms.findIndex(r => r._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const room = inMemoryRooms[index];
    if (room.occupiedBeds > 0 || room.tenants?.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an occupied room! Please reallocate tenants first.'
      });
    }

    inMemoryRooms.splice(index, 1);
    res.json({ success: true, message: 'Room deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
