import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  ticketNumber: { 
    type: String, 
    unique: true, 
    sparse: true,
    index: true 
  },
  tenantId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Tenant ID is required'],
    index: true 
  },
  tenantName: { 
    type: String, 
    required: [true, 'Tenant name is required'],
    trim: true 
  },
  roomNumber: { 
    type: String, 
    required: [true, 'Room number is required'],
    trim: true 
  },
  title: { 
    type: String, 
    required: [true, 'Complaint title is required'],
    trim: true 
  },
  description: { 
    type: String, 
    required: [true, 'Complaint description is required'],
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['plumbing', 'electrical', 'cleaning', 'internet', 'security', 'carpentry', 'appliance', 'other'], 
    default: 'other',
    index: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium',
    index: true 
  },
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'in-progress', 'waiting-for-parts', 'resolved', 'closed'], 
    default: 'open',
    index: true 
  },
  assignedTo: { 
    type: String, 
    default: 'Unassigned',
    trim: true 
  },
  assignedStaffId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedAt: { type: Date, default: null },
  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
  resolutionNote: { type: String, default: '', trim: true },
  estimatedCost: { type: Number, default: 0, min: 0 },
  actualCost: { type: Number, default: 0, min: 0 },
  tenantConfirmed: { type: Boolean, default: false },
  attachments: [{ type: String }]
}, { timestamps: true });

complaintSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = `TKT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);

