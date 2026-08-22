import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverEnvPath = path.resolve(__dirname, '../../.env');

// Load from server/.env or root .env
dotenv.config({ path: serverEnvPath });
dotenv.config();

// Auto-detect test runner if not explicitly set
if (!process.env.NODE_ENV && process.argv.some(arg => arg.includes('--test') || arg.includes('test'))) {
  process.env.NODE_ENV = 'test';
}

if (process.env.NODE_ENV === 'test' && !process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'unit_testing_secure_jwt_secret_key_32_characters_long_2026';
}

/**
 * Centralized Environment Validation and Configuration
 */
export const validateEnv = () => {
  const missing = [];

  if (!process.env.JWT_SECRET) {
    missing.push('JWT_SECRET');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!process.env.MONGO_URI) {
      missing.push('MONGO_URI');
    }
    if (!process.env.CLIENT_URL) {
      missing.push('CLIENT_URL');
    }
  }

  if (missing.length > 0) {
    const errorMsg = `FATAL: Missing required environment variable(s): ${missing.join(', ')}`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }
};

export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() === '') {
    throw new Error('JWT_SECRET environment variable is missing. Authentication cannot proceed safely.');
  }
  return secret;
};

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/pg_management',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  demoMode: process.env.DEMO_MODE === 'true' || (process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE !== 'false')
};
