import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['single', 'double', 'triple', 'dormitory'], required: true },
  capacity: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  rent: { type: Number, required: true },
  status: { type: String, enum: ['available', 'occupied', 'maintenance'], default: 'available' },
  amenities: [{ type: String }],
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model('Room', roomSchema);
