import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Visitor name is required'],
    trim: true 
  },
  phone: { 
    type: String, 
    required: [true, 'Visitor phone is required'],
    trim: true 
  },
  visitorType: { 
    type: String, 
    enum: ['Family', 'Friend', 'Delivery', 'Maintenance', 'Official', 'Other'], 
    default: 'Friend',
    index: true 
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  tenantName: { 
    type: String, 
    required: [true, 'Host tenant name is required'],
    trim: true 
  },
  roomNumber: { 
    type: String, 
    required: [true, 'Room number is required'],
    trim: true 
  },
  purpose: { 
    type: String, 
    default: 'Casual Visit',
    trim: true 
  },
  vehicleNumber: { 
    type: String, 
    default: '',
    trim: true 
  },
  entryTime: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  exitTime: { 
    type: Date, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['inside', 'checked-out'], 
    default: 'inside',
    index: true 
  },
  isLateNight: { 
    type: Boolean, 
    default: false 
  },
  loggedBy: { 
    type: String, 
    default: 'Security Guard',
    trim: true 
  }
}, { timestamps: true });

export default mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);

