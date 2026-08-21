import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';
import { withTransaction } from '../utils/transaction.js';

// @desc    Get all tenants with search, pagination & filters
// @route   GET /api/tenants
// @access  Private (Admin & Staff)
export const getTenants = async (req, res) => {
  try {
    const { status, roomNumber, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = { isActive: { $ne: false } };

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

    const total = await Tenant.countDocuments(query);
    const tenants = await Tenant.find(query)
      .populate('roomId', 'roomNumber floor type rent status')
      .populate('userId', 'name email phone avatar isActive mustChangePassword')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: tenants,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
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
        .populate('userId', 'name email phone avatar isActive');
    }

    if (!tenant) {
      // Fallback search by userId
      tenant = await Tenant.findOne({ userId: id })
        .populate('roomId', 'roomNumber floor type rent amenities')
        .populate('userId', 'name email phone avatar isActive');
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

// @desc    Onboard a new tenant to a room (Transactional & Secure Password)
// @route   POST /api/tenants/onboard
// @access  Private (Admin & Staff)
export const onboardTenant = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      roomId, 
      securityDeposit = 10000, 
      idProofType = 'Aadhaar',
      idProofNumber = '',
      checkInDate,
      emergencyContact 
    } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Generate secure temporary password if none supplied
    const isGeneratedPassword = !password;
    const initialPassword = password || `Temp@${crypto.randomBytes(4).toString('hex')}`;

    const result = await withTransaction(async (session) => {
      // 1. Verify Target Room
      const roomQuery = Room.findById(roomId);
      if (session) roomQuery.session(session);
      const room = await roomQuery;

      if (!room) {
        throw new Error('Target room not found');
      }

      if (room.status === 'maintenance') {
        throw new Error(`Room ${room.roomNumber} is currently under maintenance.`);
      }

      if (room.occupiedBeds >= room.capacity) {
        throw new Error(`Room ${room.roomNumber} is at full capacity (${room.capacity}/${room.capacity} beds occupied)`);
      }

      // 2. Find or Create User Account
      const userQuery = User.findOne({ email: normalizedEmail });
      if (session) userQuery.session(session);
      let user = await userQuery;

      if (user) {
        // Check if user is already an active tenant
        const activeTenantQuery = Tenant.findOne({ userId: user._id, status: 'active', isActive: true });
        if (session) activeTenantQuery.session(session);
        const activeTenant = await activeTenantQuery;

        if (activeTenant) {
          throw new Error(`User with email ${normalizedEmail} is already active in Room #${activeTenant.roomNumber}`);
        }
        user.roomId = room._id;
        user.roomNumber = room.roomNumber;
        user.phone = phone || user.phone;
        user.isActive = true;
        if (isGeneratedPassword) user.mustChangePassword = true;
        if (emergencyContact) user.emergencyContact = emergencyContact;
        await user.save({ session });
      } else {
        const createdUsers = await User.create([{
          name: name.trim(),
          email: normalizedEmail,
          password: initialPassword,
          role: 'tenant',
          phone: phone.trim(),
          roomId: room._id,
          roomNumber: room.roomNumber,
          isActive: true,
          mustChangePassword: isGeneratedPassword,
          emergencyContact: emergencyContact || { name: '', phone: '', relation: '' }
        }], { session });
        user = createdUsers[0];
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
      } else {
        // Auto initialize beds if empty
        room.beds = [{
          bedNumber: 'Bed A',
          isOccupied: true,
          tenantId: user._id
        }];
      }

      // 4. Create Tenant Document
      const createdTenants = await Tenant.create([{
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
        status: 'active',
        isActive: true
      }], { session });
      const newTenant = createdTenants[0];

      // 5. Update Room occupancy & bed links (pre-save syncs occupiedBeds and status)
      await room.save({ session });

      // 6. Create in-app Notification
      await Notification.create([{
        recipient: user._id,
        type: 'room',
        title: 'Welcome to your PG accommodation!',
        message: `You have been assigned to Room #${room.roomNumber} (${assignedBed}). Monthly rent: ₹${room.rent.toLocaleString()}.`,
        link: '/dashboard'
      }], { session });

      return { newTenant, room, assignedBed, user, temporaryPassword: isGeneratedPassword ? initialPassword : null };
    });

    await logActivity({
      user: req.user,
      action: 'ONBOARD_TENANT',
      entity: 'Tenant',
      entityId: result.newTenant._id,
      description: `Onboarded tenant ${result.newTenant.name} into Room ${result.room.roomNumber} (${result.assignedBed})`
    });

    return res.status(201).json({
      success: true,
      message: `Tenant ${name} onboarded successfully to Room #${result.room.roomNumber} (${result.assignedBed})`,
      data: {
        ...result.newTenant.toObject(),
        temporaryPassword: result.temporaryPassword
      }
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
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
    if (!tenant || tenant.isActive === false) {
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

// @desc    Check-out tenant and free room bed (Transactional)
// @route   POST /api/tenants/:id/checkout
// @access  Private (Admin & Staff)
export const checkoutTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = await withTransaction(async (session) => {
      const tenantQuery = Tenant.findById(id);
      if (session) tenantQuery.session(session);
      const t = await tenantQuery;

      if (!t) {
        throw new Error('Tenant not found');
      }

      if (t.status === 'checked-out') {
        throw new Error('Tenant is already checked out');
      }

      t.status = 'checked-out';
      t.checkOutDate = new Date();
      await t.save({ session });

      // Free Room bed
      const roomQuery = Room.findById(t.roomId);
      if (session) roomQuery.session(session);
      const room = await roomQuery;

      if (room) {
        if (room.beds) {
          const tenantBed = room.beds.find(b => b.tenantId && b.tenantId.toString() === t.userId.toString());
          if (tenantBed) {
            tenantBed.isOccupied = false;
            tenantBed.tenantId = null;
          }
        }
        await room.save({ session });
      }

      // Update User room association
      await User.findByIdAndUpdate(t.userId, {
        roomId: null,
        roomNumber: ''
      }, { session });

      return t;
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
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Soft Delete Tenant Record (Preserves Financial & Historical Records)
// @route   DELETE /api/tenants/:id
// @access  Private (Admin Only)
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);

    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    await withTransaction(async (session) => {
      // If active, free room bed before soft deleting
      if (tenant.status === 'active') {
        const roomQuery = Room.findById(tenant.roomId);
        if (session) roomQuery.session(session);
        const room = await roomQuery;

        if (room && room.beds) {
          const tenantBed = room.beds.find(b => b.tenantId && b.tenantId.toString() === tenant.userId.toString());
          if (tenantBed) {
            tenantBed.isOccupied = false;
            tenantBed.tenantId = null;
          }
          await room.save({ session });
        }
      }

      // Soft delete
      tenant.isActive = false;
      tenant.deletedAt = new Date();
      tenant.status = 'checked-out';
      await tenant.save({ session });

      await User.findByIdAndUpdate(tenant.userId, {
        isActive: false,
        roomId: null,
        roomNumber: ''
      }, { session });
    });

    await logActivity({
      user: req.user,
      action: 'SOFT_DELETE_TENANT',
      entity: 'Tenant',
      entityId: id,
      description: `Archived/soft-deleted tenant record for ${tenant.name}`
    });

    return res.json({
      success: true,
      message: `Tenant record for ${tenant.name} archived successfully`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
