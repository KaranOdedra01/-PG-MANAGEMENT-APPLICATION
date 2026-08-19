import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  roomNumber: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  checkInDate: { type: Date, default: Date.now },
  checkOutDate: { type: Date, default: null },
  securityDeposit: { type: Number, default: 10000 },
  monthlyRent: { type: Number, required: true },
  idProofType: { type: String, enum: ['Aadhaar', 'Passport', 'Driving License', 'College ID'], default: 'Aadhaar' },
  idProofNumber: { type: String, default: '' },
  emergencyContact: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    relation: { type: String, required: true }
  },
  status: { type: String, enum: ['active', 'checked-out'], default: 'active' }
}, { timestamps: true });

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
