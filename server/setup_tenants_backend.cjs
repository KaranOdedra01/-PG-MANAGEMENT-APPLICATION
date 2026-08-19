const fs = require('fs');
const path = require('path');

const files = {
  // src/models/Tenant.js
  'src/models/Tenant.js': `import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  checkInDate: { type: Date, default: Date.now },
  checkOutDate: { type: Date, default: null },
  securityDeposit: { type: Number, default: 10000 },
  monthlyRent: { type: Number, required: true },
  idProofType: { type: String, enum: ['Aadhaar', 'Passport', 'Driving License', 'College ID'], default: 'Aadhaar' },
  idProofNumber: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true }
  },
  status: { type: String, enum: ['active', 'checked-out'], default: 'active' }
}, { timestamps: true });

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
`,

  // src/controllers/tenantController.js
  'src/controllers/tenantController.js': `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Room from '../models/Room.js';
import Tenant from '../models/Tenant.js';
import { inMemoryUsers, inMemoryRooms } from '../utils/inMemoryStore.js';

// Pre-seeded tenants in memory for instant local demonstration
export let inMemoryTenants = [
  {
    _id: '66c1t0010000000000000001',
    userId: '66c1a0010000000000000002',
    roomId: '66c1b0010000000000000002',
    roomNumber: '102',
    name: 'Rahul Sharma',
    email: 'tenant@pg.com',
    phone: '+91 98111 22233',
    checkInDate: new Date('2026-02-10'),
    checkOutDate: null,
    securityDeposit: 15000,
    monthlyRent: 7500,
    idProofType: 'Aadhaar',
    idProofNumber: 'XXXX-XXXX-4812',
    emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' },
    status: 'active'
  },
  {
    _id: '66c1t0010000000000000002',
    userId: '66c1a0010000000000000004',
    roomId: '66c1b0010000000000000001',
    roomNumber: '101',
    name: 'Priya Patel',
    email: 'priya@gmail.com',
    phone: '+91 98222 33445',
    checkInDate: new Date('2026-03-01'),
    checkOutDate: null,
    securityDeposit: 19000,
    monthlyRent: 9500,
    idProofType: 'College ID',
    idProofNumber: 'GUJ-2024-889',
    emergencyContact: { name: 'Dinesh Patel', phone: '+91 98222 88888', relation: 'Father' },
    status: 'active'
  },
  {
    _id: '66c1t0010000000000000003',
    userId: '66c1a0010000000000000005',
    roomId: '66c1b0010000000000000002',
    roomNumber: '102',
    name: 'Aman Verma',
    email: 'aman@gmail.com',
    phone: '+91 98444 55667',
    checkInDate: new Date('2026-04-12'),
    checkOutDate: null,
    securityDeposit: 15000,
    monthlyRent: 7500,
    idProofType: 'Aadhaar',
    idProofNumber: 'XXXX-XXXX-9921',
    emergencyContact: { name: 'Sanjay Verma', phone: '+91 98444 99999', relation: 'Brother' },
    status: 'active'
  }
];

// @desc    Get all tenants with search & filter
// @route   GET /api/tenants
// @access  Private (Admin & Staff)
export const getTenants = async (req, res) => {
  try {
    const { status, roomNumber, search } = req.query;

    if (mongoose.connection.readyState === 1) {
      let query = {};
      if (status && status !== 'all') query.status = status;
      if (roomNumber && roomNumber !== 'all') query.roomNumber = roomNumber;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { roomNumber: { $regex: search, $options: 'i' } }
        ];
      }
      const tenants = await Tenant.find(query).sort({ checkInDate: -1 });
      return res.json({ success: true, count: tenants.length, data: tenants });
    }

    // In-memory filter
    let results = [...inMemoryTenants];
    if (status && status !== 'all') {
      results = results.filter(t => t.status === status);
    }
    if (roomNumber && roomNumber !== 'all') {
      results = results.filter(t => t.roomNumber === roomNumber);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(t => 
        t.name.toLowerCase().includes(q) || 
        t.email.toLowerCase().includes(q) || 
        t.phone.includes(q) ||
        t.roomNumber.includes(q)
      );
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

// @desc    Get tenant by ID
// @route   GET /api/tenants/:id
// @access  Private
export const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    if (mongoose.connection.readyState === 1) {
      const tenant = await Tenant.findById(id);
      if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
      return res.json({ success: true, data: tenant });
    }

    const tenant = inMemoryTenants.find(t => t._id.toString() === id.toString());
    if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Onboard a new tenant (creates User, links Room, updates bed occupancy)
// @route   POST /api/tenants/onboard
// @access  Private (Admin Only)
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
      emergencyContact 
    } = req.body;

    if (!name || !email || !phone || !roomId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, phone, and target roomId'
      });
    }

    // Check Room availability
    const room = inMemoryRooms.find(r => r._id.toString() === roomId.toString());
    if (!room) {
      return res.status(404).json({ success: false, message: 'Selected room not found' });
    }

    if (room.occupiedBeds >= room.capacity) {
      return res.status(400).json({ success: false, message: 'Selected room is already fully occupied!' });
    }

    // Check if email already exists
    const userExists = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user with this email is already registered' });
    }

    // Create User record
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = `usr_${Date.now()}`;
    const newUser = {
      _id: userId,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'tenant',
      phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      roomId: room._id,
      roomNumber: room.roomNumber,
      isActive: true,
      emergencyContact: emergencyContact || { name: '', phone: '', relation: '' },
      createdAt: new Date()
    };
    inMemoryUsers.push(newUser);

    // Create Tenant record
    const newTenant = {
      _id: `tnt_${Date.now()}`,
      userId,
      roomId: room._id,
      roomNumber: room.roomNumber,
      name,
      email: email.toLowerCase(),
      phone,
      checkInDate: new Date(),
      checkOutDate: null,
      securityDeposit: Number(securityDeposit),
      monthlyRent: room.rent,
      idProofType,
      idProofNumber,
      emergencyContact: emergencyContact || { name: 'Guardian', phone: phone, relation: 'Parent' },
      status: 'active'
    };
    inMemoryTenants.unshift(newTenant);

    // Update Room occupancy
    room.occupiedBeds += 1;
    if (room.occupiedBeds >= room.capacity) {
      room.status = 'occupied';
    }
    if (!room.tenants) room.tenants = [];
    room.tenants.push(userId);

    res.status(201).json({
      success: true,
      message: `Tenant ${name} onboarded successfully to Room #${room.roomNumber}`,
      data: newTenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update tenant details
// @route   PUT /api/tenants/:id
// @access  Private (Admin Only)
export const updateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { phone, securityDeposit, emergencyContact, idProofType, idProofNumber } = req.body;

    const index = inMemoryTenants.findIndex(t => t._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    const current = inMemoryTenants[index];
    inMemoryTenants[index] = {
      ...current,
      phone: phone || current.phone,
      securityDeposit: securityDeposit !== undefined ? Number(securityDeposit) : current.securityDeposit,
      emergencyContact: emergencyContact || current.emergencyContact,
      idProofType: idProofType || current.idProofType,
      idProofNumber: idProofNumber !== undefined ? idProofNumber : current.idProofNumber
    };

    res.json({
      success: true,
      message: 'Tenant details updated successfully',
      data: inMemoryTenants[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-out tenant (frees room bed slot, marks tenant status checked-out)
// @route   POST /api/tenants/:id/checkout
// @access  Private (Admin Only)
export const checkoutTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const tenant = inMemoryTenants.find(t => t._id.toString() === id.toString());
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    if (tenant.status === 'checked-out') {
      return res.status(400).json({ success: false, message: 'Tenant is already checked out' });
    }

    // Mark tenant as checked out
    tenant.status = 'checked-out';
    tenant.checkOutDate = new Date();

    // Free up room bed slot
    const room = inMemoryRooms.find(r => r._id.toString() === tenant.roomId.toString() || r.roomNumber === tenant.roomNumber);
    if (room) {
      room.occupiedBeds = Math.max(0, room.occupiedBeds - 1);
      if (room.status === 'occupied' && room.occupiedBeds < room.capacity) {
        room.status = 'available';
      }
      if (room.tenants) {
        room.tenants = room.tenants.filter(tid => tid.toString() !== tenant.userId.toString());
      }
    }

    res.json({
      success: true,
      message: `Tenant ${tenant.name} checked out successfully. Room #${tenant.roomNumber} bed slot is now available.`,
      data: tenant
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete tenant record
// @route   DELETE /api/tenants/:id
// @access  Private (Admin Only)
export const deleteTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryTenants.findIndex(t => t._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    inMemoryTenants.splice(index, 1);
    res.json({ success: true, message: 'Tenant record removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
`,

  // src/routes/tenantRoutes.js
  'src/routes/tenantRoutes.js': `import express from 'express';
import {
  getTenants,
  getTenantById,
  onboardTenant,
  updateTenant,
  checkoutTenant,
  deleteTenant
} from '../controllers/tenantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read operations for Admin & Staff
router.get('/', protect, authorize('admin', 'staff'), getTenants);
router.get('/:id', protect, authorize('admin', 'staff'), getTenantById);

// Admin-only mutation operations
router.post('/onboard', protect, authorize('admin'), onboardTenant);
router.put('/:id', protect, authorize('admin'), updateTenant);
router.post('/:id/checkout', protect, authorize('admin'), checkoutTenant);
router.delete('/:id', protect, authorize('admin'), deleteTenant);

export default router;
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relPath);
}
