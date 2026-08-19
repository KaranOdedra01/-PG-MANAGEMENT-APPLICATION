import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  visitorType: { 
    type: String, 
    enum: ['Family', 'Friend', 'Delivery', 'Maintenance', 'Other'], 
    default: 'Friend' 
  },
  tenantName: { type: String, required: true },
  roomNumber: { type: String, required: true },
  purpose: { type: String, default: 'Casual Visit' },
  vehicleNumber: { type: String, default: '' },
  entryTime: { type: Date, default: Date.now },
  exitTime: { type: Date, default: null },
  status: { type: String, enum: ['inside', 'checked-out'], default: 'inside' },
  isLateNight: { type: Boolean, default: false },
  loggedBy: { type: String, default: 'Security Guard' }
}, { timestamps: true });

export default mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);
