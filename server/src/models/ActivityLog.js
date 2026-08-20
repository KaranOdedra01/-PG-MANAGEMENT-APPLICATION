import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actor: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, default: 'System', trim: true },
    role: { type: String, default: 'system', trim: true }
  },
  action: { 
    type: String, 
    required: true,
    index: true,
    trim: true 
  },
  entity: { 
    type: String, 
    required: true,
    index: true,
    trim: true 
  },
  entityId: { 
    type: String, 
    default: '' 
  },
  description: { 
    type: String, 
    required: true,
    trim: true 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  }
}, { 
  timestamps: true 
});

activityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);
