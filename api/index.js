import app from '../server/src/server.js';
import { connectDB } from '../server/src/config/db.js';
import { validateEnv, config } from '../server/src/config/env.js';
import { autoSeedIfEmpty } from '../server/src/utils/seed.js';

let isDbConnected = false;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  const isProd = config.nodeEnv === 'production' || process.env.NODE_ENV === 'production';
  const allowedOriginList = [
    config.clientUrl,
    process.env.CLIENT_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    'https://pg-management-application.vercel.app',
    !isProd ? 'http://localhost:5173' : null,
    !isProd ? 'http://127.0.0.1:5173' : null,
    !isProd ? 'http://localhost:3000' : null,
    !isProd ? 'http://127.0.0.1:3000' : null
  ].filter(Boolean).map(u => u.replace(/\/$/, ''));

  if (origin && allowedOriginList.includes(origin.replace(/\/$/, ''))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!isDbConnected) {
      validateEnv();
      await connectDB();
      if (config.demoMode) {
        await autoSeedIfEmpty();
      }
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
