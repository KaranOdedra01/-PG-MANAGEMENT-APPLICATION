import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';
import { validateEnv } from '../server/src/config/env.js';

let isDbConnected = false;

export default async function handler(req, res) {
  try {
    if (!isDbConnected) {
      validateEnv();
      await connectDB();
      isDbConnected = true;
    }
    return app(req, res);
  } catch (error) {
    console.error('❌ Vercel Serverless Function Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed. Please ensure MONGO_URI is set in Vercel environment variables.',
      error: error.message
    });
  }
}
