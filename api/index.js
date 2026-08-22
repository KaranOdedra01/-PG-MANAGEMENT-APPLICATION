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
    console.error('❌ Vercel Serverless Function DB Error:', error.message);
    
    let help = 'Please verify your MONGO_URI in Vercel settings.';
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      help = 'Authentication failed: Check your MongoDB Atlas username and password in MONGO_URI.';
    } else if (error.message.includes('whitelist') || error.message.includes('timed out') || error.message.includes('ServerSelectionError')) {
      help = 'Connection timed out: Ensure you allowed access from anywhere (0.0.0.0/0) in MongoDB Atlas Network Access.';
    }

    return res.status(500).json({
      success: false,
      message: 'Database connection failed.',
      detail: error.message,
      help
    });
  }
}
