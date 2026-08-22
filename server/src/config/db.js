import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  const uri = config.mongoUri;
  
  if (!uri || uri.trim() === '') {
    const errorMsg = 'FATAL: MONGO_URI is not defined. Please configure MONGO_URI in your environment.';
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ FATAL MongoDB Connection Error: ${error.message}`);
    console.error(`👉 Please ensure MongoDB is running and MONGO_URI is correct.`);
    throw error;
  }
};
