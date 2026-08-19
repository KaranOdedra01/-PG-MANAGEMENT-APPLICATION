const fs = require('fs');
const path = require('path');

const authControllerCode = `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { inMemoryUsers } from '../utils/inMemoryStore.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_pg_jwt_key_2026_student_project', {
    expiresIn: '30d'
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'tenant', phone, emergencyContact } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (mongoose.connection.readyState === 1) {
      const userExists = await User.findOne({ email: email.toLowerCase() });
      if (userExists) {
        return res.status(400).json({ success: false, message: 'User with this email already exists' });
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role,
        phone: phone || '',
        emergencyContact: emergencyContact || {}
      });

      const token = generateToken(user._id, user.role);
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
          token
        }
      });
    }

    // In-memory fallback
    const exists = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      _id: \`mem_\${Date.now()}\`,
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone: phone || '',
      avatar: \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${encodeURIComponent(name)}\`,
      isActive: true,
      emergencyContact: emergencyContact || {},
      createdAt: new Date()
    };
    inMemoryUsers.push(newUser);

    const token = generateToken(newUser._id, newUser.role);
    const { password: _, ...userSafe } = newUser;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { ...userSafe, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    if (mongoose.connection.readyState === 1) {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (user) {
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
            token
          }
        });
      }
    }

    // In-memory fallback
    const memUser = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!memUser) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, memUser.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(memUser._id, memUser.role);
    const { password: _, ...userSafe } = memUser;

    return res.json({
      success: true,
      message: 'Login successful',
      data: { ...userSafe, token }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      data: req.user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDemoAccounts = async (req, res) => {
  res.json({
    success: true,
    data: [
      { role: 'admin', email: 'admin@pg.com', password: 'Password@123', label: 'Admin (Full Management)' },
      { role: 'tenant', email: 'tenant@pg.com', password: 'Password@123', label: 'Tenant (Student Resident)' },
      { role: 'staff', email: 'staff@pg.com', password: 'Password@123', label: 'Staff (Caretaker/Maintenance)' }
    ]
  });
};
`;

const authMiddlewareCode = `import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { inMemoryUsers } from '../utils/inMemoryStore.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_pg_jwt_key_2026_student_project');
      
      if (mongoose.connection.readyState === 1) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      }

      const memUser = inMemoryUsers.find(u => u._id.toString() === decoded.id.toString());
      if (memUser) {
        const { password, ...userWithoutPassword } = memUser;
        req.user = userWithoutPassword;
        return next();
      }

      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: \`User role '\${req.user ? req.user.role : 'none'}' is not authorized to access this route\`
      });
    }
    next();
  };
};
`;

fs.writeFileSync(path.join(__dirname, 'src/controllers/authController.js'), authControllerCode, 'utf8');
fs.writeFileSync(path.join(__dirname, 'src/middleware/authMiddleware.js'), authMiddlewareCode, 'utf8');
console.log('Updated auth controller and middleware.');
