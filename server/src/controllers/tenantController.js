import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all tenants with search & filters
// @route   GET /api/tenants
// @access  Private (Admin & Staff)
export const getTenants = async (req, res) => {
  try {
    const { status, roomNumber, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (roomNumber && roomNumber !== 'all') {
      query.roomNumber = roomNumber.trim();
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const tenants = await Tenant.find(query)
      .populate('roomId', 'roomNumber floor type rent status')
      .populate('userId', 'name email phone avatar isActive')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: tenants.length,
      data: tenants
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single tenant by ID (with IDOR protection)
// @route   GET /api/tenants/:id
// @access  Private
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    let tenant;

    if (mongoose.Types.ObjectId.isValid(id)) {
      tenant = await Tenant.findById(id)
        .populate('roomId', 'roomNumber floor type rent amenities')
        .populate('userId', 'name email phone avatar');
    }

    if (!tenant) {
      // Fallback search by userId
      tenant = await Tenant.findOne({ userId: id })
        .populate('roomId', 'roomNumber floor type rent amenities')
        .populate('userId', 'name email phone avatar');
    }

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant record not found' });
    }

    // IDOR Protection: Tenant can only view their own record
    if (req.user.role === 'tenant' && tenant.userId?._id?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own tenant profile'
      });
    }

    return res.json({
      success: true,
      data: tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Onboard a new tenant to a room
// @route   POST /api/tenants/onboard
// @access  Private (Admin & Staff)
export const onboardTenant = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password = 'Password@123', 
      roomId, 
      securityDeposit = 10000, 
      idProofType = 'Aadhaar',
      idProofNumber = '',
      checkInDate,
      emergencyContact 
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify Target Room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Target room not found' });
    }

    if (room.status === 'maintenance') {
      return res.status(400).json({ success: false, message: `Room ${room.roomNumber} is currently under maintenance.` });
    }

    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({ 
        success: false, 
        message: `Room ${room.roomNumber} is already at full capacity (${room.capacity}/${room.capacity} beds occupied)` 
      });
    }

    // 2. Find or Create User Account
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      // Check if user is already an active tenant
      const activeTenant = await Tenant.findOne({ userId: user._id, status: 'active' });
      if (activeTenant) {
        return res.status(400).json({
          success: false,
          message: `User with email ${normalizedEmail} is already active in Room #${activeTenant.roomNumber}`
        });
      }
      user.roomId = room._id;
      user.roomNumber = room.roomNumber;
      user.phone = phone || user.phone;
      if (emergencyContact) user.emergencyContact = emergencyContact;
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: 'tenant',
        phone: phone.trim(),
        roomId: room._id,
        roomNumber: room.roomNumber,
        emergencyContact: emergencyContact || { name: '', phone: '', relation: '' }
      });
    }

    // 3. Find available bed in room
    let assignedBed = 'Bed A';
    if (room.beds && room.beds.length > 0) {
      const freeBed = room.beds.find(b => !b.isOccupied);
      if (freeBed) {
        freeBed.isOccupied = true;
        freeBed.tenantId = user._id;
        assignedBed = freeBed.bedNumber;
      }
    }

    // 4. Create Tenant Document
    const newTenant = await Tenant.create({
      userId: user._id,
      roomId: room._id,
      roomNumber: room.roomNumber,
      bedNumber: assignedBed,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      checkInDate: checkInDate ? new Date(checkInDate) : new Date(),
      checkOutDate: null,
      securityDeposit: Number(securityDeposit),
      monthlyRent: Number(room.rent),
      idProofType,
      idProofNumber: idProofNumber || '',
      emergencyContact: emergencyContact || { name: 'Guardian', phone: phone, relation: 'Parent' },
      status: 'active'
    });

    // 5. Update Room occupancy
    room.occupiedBeds = (room.occupiedBeds || 0) + 1;
    if (!room.tenants) room.tenants = [];
    if (!room.tenants.includes(user._id)) {
      room.tenants.push(user._id);
    }
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'occupied';
    }
    await room.save();

    // 6. Create in-app Notification
    await Notification.create({
      recipient: user._id,
      type: 'room',
      title: 'Welcome to your PG accommodation!',
      message: `You have been assigned to Room #${room.roomNumber} (${assignedBed}). Monthly rent: ₹${room.rent}.`,
      link: '/dashboard'
    });

    // 7. Log Activity
    await logActivity({
      user: req.user,
      action: 'ONBOARD_TENANT',
      entity: 'Tenant',
      entityId: newTenant._id,
      description: `Onboarded tenant ${newTenant.name} into Room ${room.roomNumber} (${assignedBed})`
    });

    return res.status(201).json({
      success: true,
      message: `Tenant ${name} onboarded successfully to Room #${room.roomNumber} (${assignedBed})`,
      data: newTenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tenant details
// @route   PUT /api/tenants/:id
// @access  Private (Admin & Staff)
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, securityDeposit, emergencyContact, idProofType, idProofNumber, status } = req.body;

    const tenant = await Tenant.findById(id);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (phone) tenant.phone = phone.trim();
    if (securityDeposit !== undefined) tenant.securityDeposit = Number(securityDeposit);
    if (emergencyContact) tenant.emergencyContact = emergencyContact;
    if (idProofType) tenant.idProofType = idProofType;
    if (idProofNumber !== undefined) tenant.idProofNumber = idProofNumber.trim();
    if (status) tenant.status = status;

    await tenant.save();

    // Sync phone with User
    if (phone && tenant.userId) {
      await User.findByIdAndUpdate(tenant.userId, { phone: phone.trim() });
    }

    await logActivity({
      user: req.user,
      action: 'UPDATE_TENANT',
      entity: 'Tenant',
      entityId: tenant._id,
      description: `Updated profile details for tenant ${tenant.name}`
    });

    return res.json({
      success: true,
      message: 'Tenant details updated successfully',
      data: tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-out tenant and free room bed
// @route   POST /api/tenants/:id/checkout
// @access  Private (Admin & Staff)
export const checkoutTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status === 'checked-out') {
      return res.status(400).json({ success: false, message: 'Tenant is already checked out' });
    }

    tenant.status = 'checked-out';
    tenant.checkOutDate = new Date();
    await tenant.save();

    // Free Room bed
    const room = await Room.findById(tenant.roomId);
    if (room) {
      room.occupiedBeds = Math.max(0, (room.occupiedBeds || 1) - 1);
      if (room.status === 'occupied' && room.occupiedBeds < room.capacity) {
        room.status = 'available';
      }
      if (room.tenants) {
        room.tenants = room.tenants.filter(tid => tid.toString() !== tenant.userId.toString());
      }
      if (room.beds) {
        const tenantBed = room.beds.find(b => b.tenantId && b.tenantId.toString() === tenant.userId.toString());
        if (tenantBed) {
          tenantBed.isOccupied = false;
          tenantBed.tenantId = null;
        }
      }
      await room.save();
    }

    // Update User room association
    await User.findByIdAndUpdate(tenant.userId, {
      roomId: null,
      roomNumber: ''
    });

    await logActivity({
      user: req.user,
      action: 'CHECKOUT_TENANT',
      entity: 'Tenant',
      entityId: tenant._id,
      description: `Checked out tenant ${tenant.name} from Room #${tenant.roomNumber}`
    });

    return res.json({
      success: true,
      message: `Tenant ${tenant.name} checked out successfully. Room #${tenant.roomNumber} bed slot is now available.`,
      data: tenant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tenant record
// @route   DELETE /api/tenants/:id
// @access  Private (Admin Only)
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    // If active, free room bed before deleting
    if (tenant.status === 'active') {
      const room = await Room.findById(tenant.roomId);
      if (room) {
        room.occupiedBeds = Math.max(0, (room.occupiedBeds || 1) - 1);
        if (room.tenants) {
          room.tenants = room.tenants.filter(tid => tid.toString() !== tenant.userId.toString());
        }
        await room.save();
      }
    }

    await tenant.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_TENANT',
      entity: 'Tenant',
      entityId: id,
      description: `Deleted tenant record for ${tenant.name}`
    });

    return res.json({
      success: true,
      message: 'Tenant record removed successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
