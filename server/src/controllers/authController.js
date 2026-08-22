import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getJwtSecret, config } from '../config/env.js';
import { logActivity } from '../utils/activityLogger.js';

const generateToken = (id, role) => {
  const secret = getJwtSecret();
  return jwt.sign({ id, role }, secret, {
    expiresIn: config.jwtExpiresIn || '7d'
  });
};

// @desc    Public Tenant Registration (Enforces tenant role)
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, emergencyContact } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email address is already registered' 
      });
    }

    // Security: Public registration always forces role = 'tenant'
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'tenant',
      phone: phone || '',
      emergencyContact: emergencyContact || {},
      mustChangePassword: false
    });

    const token = generateToken(user._id, user.role);

    await logActivity({
      user,
      action: 'REGISTER',
      entity: 'User',
      entityId: user._id,
      description: `New tenant registered: ${user.name} (${user.email})`
    });

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        mustChangePassword: user.mustChangePassword,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    User Login
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact administration.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        roomId: user.roomId,
        roomNumber: user.roomNumber,
        mustChangePassword: user.mustChangePassword || false,
        token
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Change Password (for mandatory password change or user preference)
// @route   POST /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password unless mandatory change was required and old password matched
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();

    await logActivity({
      user: req.user,
      action: 'PASSWORD_CHANGE',
      entity: 'User',
      entityId: user._id,
      description: `User ${user.name} changed their password`
    });

    return res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin Create Staff / Admin User
// @route   POST /api/auth/users
// @access  Private (Admin Only)
export const createPrivilegedUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, emergencyContact } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role || 'staff',
      phone: phone || '',
      emergencyContact: emergencyContact || {},
      mustChangePassword: false
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user._id,
      description: `Admin created ${user.role} account: ${user.name} (${user.email})`
    });

    return res.status(201).json({
      success: true,
      message: `${user.role.toUpperCase()} account created successfully`,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Demo Accounts Info (Disabled in Production unless DEMO_MODE=true)
// @route   GET /api/auth/demo-accounts
// @access  Public
export const getDemoAccounts = async (req, res) => {
  if (!config.demoMode) {
    return res.status(403).json({
      success: false,
      message: 'Demo accounts are disabled in production environment'
    });
  }

  res.json({
    success: true,
    data: [
      { role: 'admin', email: 'admin@pg.com', password: 'Password@123', label: 'Admin (Full Management)' },
      { role: 'tenant', email: 'tenant@pg.com', password: 'Password@123', label: 'Tenant (Resident Student)' },
      { role: 'staff', email: 'staff@pg.com', password: 'Password@123', label: 'Staff (Caretaker/Maintenance)' }
    ]
  });
};

// @desc    Get all active Staff and Admin users for assignment dropdowns
// @route   GET /api/auth/staff
// @access  Private
export const getStaffList = async (req, res) => {
  try {
    const staff = await User.find({ role: { $in: ['staff', 'admin'] }, isActive: true }).select('name email role phone');
    return res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
