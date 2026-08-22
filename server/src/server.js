import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { validateEnv, config } from './config/env.js';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import tenantRoutes from './routes/tenantRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import messRoutes from './routes/messRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

const app = express();

// Security & Utility Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Strict Environment-Based CORS Allowlist
const rawOrigins = [
  config.clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

const allowedOrigins = rawOrigins
  .flatMap(url => (url ? url.split(',').map(s => s.trim().replace(/\/$/, '')) : []))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-side tests)
    if (!origin) {
      return callback(null, true);
    }
    const cleanOrigin = origin.replace(/\/$/, '');
    const isVercelDomain = /^https:\/\/[a-zA-Z0-9._-]+\.vercel\.app$/.test(cleanOrigin);
    if (allowedOrigins.includes(cleanOrigin) || isVercelDomain) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Error: Origin ${origin} not allowed by Access-Control-Allow-Origin policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 prompts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI query limit reached. Please wait a moment before sending another message.'
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/ai/chat', aiLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/mess', messRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);

// Health Check Endpoint (Real MongoDB Connection Verification)
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const status = isDbConnected ? 'healthy' : 'unhealthy';
  const httpStatus = isDbConnected ? 200 : 503;

  return res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    service: 'PG Management System API v2.0',
    environment: config.nodeEnv,
    database: {
      status: isDbConnected ? 'connected' : 'disconnected',
      host: mongoose.connection.host || 'unavailable',
      name: mongoose.connection.name || 'unavailable'
    },
    geminiEnabled: !!config.geminiApiKey
  });
});

// API Overview
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: '🏠 PG Management System Backend API v2.0',
    endpoints: {
      auth: '/api/auth',
      dashboard: '/api/dashboard',
      rooms: '/api/rooms',
      tenants: '/api/tenants',
      invoices: '/api/invoices',
      expenses: '/api/expenses',
      complaints: '/api/complaints',
      notices: '/api/notices',
      mess: '/api/mess',
      visitors: '/api/visitors',
      reports: '/api/reports',
      ai: '/api/ai',
      notifications: '/api/notifications'
    }
  });
});

// Root Route
app.get('/', (req, res) => {
  res.send('🏠 PG Management System Backend API is running.');
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  // Check for CORS error
  if (err.message && err.message.includes('CORS Error')) {
    return res.status(403).json({
      success: false,
      message: err.message
    });
  }

  const statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  
  if (config.nodeEnv !== 'production') {
    console.error('Unhandled Error:', err.stack || err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || undefined,
    ...(config.nodeEnv !== 'production' && { stack: err.stack })
  });
});

export const startServer = async () => {
  try {
    validateEnv();
    await connectDB();
    const server = app.listen(config.port, () => {
      console.log(`🚀 PG Management Server running on http://localhost:${config.port}`);
    });
    return server;
  } catch (error) {
    console.error('❌ Server startup aborted due to critical error:', error.message);
    process.exit(1);
  }
};

export default app;

if (process.env.NODE_ENV !== 'test' && config.nodeEnv !== 'test' && !process.env.VERCEL) {
  startServer();
}
