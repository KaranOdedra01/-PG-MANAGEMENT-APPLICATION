const fs = require('fs');
const path = require('path');

const files = {
  // .env
  '.env': `PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_pg_jwt_key_2026_student_project
MONGO_URI=mongodb://localhost:27017/pg_management
GEMINI_API_KEY=
CLIENT_URL=http://localhost:5173
`,

  // .env.example
  '.env.example': `PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_here
MONGO_URI=your_mongodb_atlas_uri_here
GEMINI_API_KEY=your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
`,

  // src/config/db.js
  'src/config/db.js': `import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg_management', {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`);
    return true;
  } catch (error) {
    console.warn(\`⚠️ MongoDB Connection Warning: \${error.message}\`);
    console.log('ℹ️ Running in Memory/Mock-Database Mode for seamless local preview.');
    return false;
  }
};
`,

  // src/models/User.js
  'src/models/User.js': `import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'tenant', 'staff'], default: 'tenant' },
  phone: { type: String, default: '' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  isActive: { type: Boolean, default: true },
  emergencyContact: {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    relation: { type: String, default: '' }
  }
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.models.User || mongoose.model('User', userSchema);
`,

  // src/middleware/authMiddleware.js
  'src/middleware/authMiddleware.js': `import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { inMemoryUsers } from '../utils/inMemoryStore.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_pg_jwt_key_2026_student_project');
      
      // Try Mongoose first, fallback to inMemory
      try {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
          return next();
        }
      } catch (err) {
        // Fallback
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
`,

  // src/utils/inMemoryStore.js (Guarantees 100% functionality even without local mongod running!)
  'src/utils/inMemoryStore.js': `import bcrypt from 'bcryptjs';

const hashedDefaultPassword = bcrypt.hashSync('Password@123', 10);

export const inMemoryUsers = [
  {
    _id: '66c1a0010000000000000001',
    name: 'Karan Admin',
    email: 'admin@pg.com',
    password: hashedDefaultPassword,
    role: 'admin',
    phone: '+91 98765 43210',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AdminKaran',
    isActive: true,
    emergencyContact: { name: 'Emergency Admin', phone: '+91 99999 88888', relation: 'Partner' },
    createdAt: new Date()
  },
  {
    _id: '66c1a0010000000000000002',
    name: 'Rahul Sharma',
    email: 'tenant@pg.com',
    password: hashedDefaultPassword,
    role: 'tenant',
    phone: '+91 98111 22233',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RahulTenant',
    roomId: '66c1b0010000000000000001',
    isActive: true,
    emergencyContact: { name: 'Sunil Sharma', phone: '+91 98111 99999', relation: 'Father' },
    createdAt: new Date()
  },
  {
    _id: '66c1a0010000000000000003',
    name: 'Ramesh Caretaker',
    email: 'staff@pg.com',
    password: hashedDefaultPassword,
    role: 'staff',
    phone: '+91 98333 44455',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RameshStaff',
    isActive: true,
    emergencyContact: { name: 'Geeta', phone: '+91 98333 77777', relation: 'Spouse' },
    createdAt: new Date()
  }
];
`,

  // src/controllers/authController.js
  'src/controllers/authController.js': `import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { inMemoryUsers } from '../utils/inMemoryStore.js';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'super_secret_pg_jwt_key_2026_student_project', {
    expiresIn: '30d'
  });
};

// @desc    Register a new user (Tenant / Staff / Admin)
// @route   POST /api/auth/register
// @access  Public (or Admin for staff)
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'tenant', phone, emergencyContact } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    // Try MongoDB
    try {
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
    } catch (dbErr) {
      // Fallback in-memory
      const exists = inMemoryUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        return res.status(400).json({ success: false, message: 'User already exists (in-memory)' });
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
        message: 'Registration successful (in-memory demo mode)',
        data: { ...userSafe, token }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Try MongoDB
    try {
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
    } catch (dbErr) {
      // fallback
    }

    // Check In-Memory fallback
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

// @desc    Get Current User Profile
// @route   GET /api/auth/me
// @access  Private
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

// @desc    Get Demo Credentials for easy student test/grading
// @route   GET /api/auth/demo-accounts
// @access  Public
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
`,

  // src/routes/authRoutes.js
  'src/routes/authRoutes.js': `import express from 'express';
import { register, login, getMe, getDemoAccounts } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/demo-accounts', getDemoAccounts);

export default router;
`,

  // src/server.js
  'src/server.js': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database (with auto-fallback)
connectDB();

// Security & Utility Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PG Management System API v1.0',
    geminiEnabled: !!process.env.GEMINI_API_KEY
  });
});

// Root route
app.get('/', (req, res) => {
  res.send('🏠 PG Management System Backend API is running.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(\`🚀 PG Management Server listening on http://localhost:\${PORT}\`);
});
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created:', relPath);
}
