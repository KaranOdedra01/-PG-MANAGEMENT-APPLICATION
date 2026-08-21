import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'],
    index: true 
  },
  roomId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Room', 
    required: [true, 'Room ID is required'],
    index: true 
  },
  roomNumber: { 
    type: String, 
    required: [true, 'Room number is required'],
    trim: true 
  },
  bedNumber: {
    type: String,
    default: 'Bed A',
    trim: true
  },
  name: { 
    type: String, 
    required: [true, 'Tenant name is required'],
    trim: true 
  },
  email: { 
    type: String, 
    required: [true, 'Tenant email is required'],
    lowercase: true,
    trim: true,
    index: true 
  },
  phone: { 
    type: String, 
    required: [true, 'Tenant phone number is required'],
    trim: true 
  },
  checkInDate: { 
    type: Date, 
    default: Date.now 
  },
  checkOutDate: { 
    type: Date, 
    default: null 
  },
  securityDeposit: { 
    type: Number, 
    default: 10000,
    min: [0, 'Security deposit cannot be negative'] 
  },
  monthlyRent: { 
    type: Number, 
    required: [true, 'Monthly rent is required'],
    min: [0, 'Monthly rent cannot be negative'] 
  },
  idProofType: { 
    type: String, 
    enum: ['Aadhaar', 'Passport', 'Driving License', 'College ID', 'Voter ID', 'Other'], 
    default: 'Aadhaar' 
  },
  idProofNumber: { 
    type: String, 
    default: '',
    trim: true 
  },
  emergencyContact: {
    name: { type: String, default: '', trim: true },
    phone: { type: String, default: '', trim: true },
    relation: { type: String, default: '', trim: true }
  },
  status: { 
    type: String, 
    enum: ['active', 'notice-period', 'checked-out'], 
    default: 'active',
    index: true 
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

export default mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
