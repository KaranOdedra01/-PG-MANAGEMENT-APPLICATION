import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true },
  isOccupied: { type: Boolean, default: false },
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { _id: false });

const roomSchema = new mongoose.Schema({
  roomNumber: { 
    type: String, 
    required: [true, 'Room number is required'], 
    unique: true, 
    trim: true,
    uppercase: true,
    index: true 
  },
  floor: { 
    type: Number, 
    required: [true, 'Floor number is required'],
    min: [0, 'Floor number cannot be negative'] 
  },
  type: { 
    type: String, 
    enum: {
      values: ['single', 'double', 'triple', 'dormitory'],
      message: '{VALUE} is not a valid room type'
    }, 
    required: [true, 'Room type is required'] 
  },
  capacity: { 
    type: Number, 
    required: [true, 'Room capacity is required'],
    min: [1, 'Capacity must be at least 1'] 
  },
  occupiedBeds: { 
    type: Number, 
    default: 0,
    min: [0, 'Occupied beds cannot be negative']
  },
  rent: { 
    type: Number, 
    required: [true, 'Monthly rent is required'],
    min: [0, 'Rent cannot be negative'] 
  },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance'], 
    default: 'available',
    index: true 
  },
  amenities: [{ type: String, trim: true }],
  beds: [bedSchema],
  tenants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual available beds
roomSchema.virtual('availableBeds').get(function() {
  return Math.max(0, this.capacity - (this.occupiedBeds || 0));
});

// Auto-sync status based on occupancy
roomSchema.pre('save', function(next) {
  if (this.status !== 'maintenance') {
    if (this.occupiedBeds >= this.capacity) {
      this.status = 'occupied';
    } else {
      this.status = 'available';
    }
  }
  next();
});

export default mongoose.models.Room || mongoose.model('Room', roomSchema);

