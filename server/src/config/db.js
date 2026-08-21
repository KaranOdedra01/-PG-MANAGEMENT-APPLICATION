import mongoose from 'mongoose';
import { config } from './env.js';

export const connectDB = async () => {
  const uri = config.mongoUri;
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ FATAL MongoDB Connection Error: ${error.message}`);
    console.error(`👉 Please ensure MongoDB is running or provide a valid MONGO_URI environment variable.`);
    throw error;
  }
};
