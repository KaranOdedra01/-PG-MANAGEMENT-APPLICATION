import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['maintenance', 'rules', 'events', 'general'], 
    default: 'general' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  targetRoles: [{ type: String, enum: ['all', 'tenant', 'staff'], default: 'all' }],
  postedBy: { type: String, default: 'Admin' },
  isPinned: { type: Boolean, default: false },
  readBy: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema);
