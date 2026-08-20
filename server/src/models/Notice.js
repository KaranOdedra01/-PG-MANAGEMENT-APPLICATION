import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Notice title is required'],
    trim: true 
  },
  content: { 
    type: String, 
    required: [true, 'Notice content is required'],
    trim: true 
  },
  category: { 
    type: String, 
    enum: ['maintenance', 'rules', 'events', 'emergency', 'general'], 
    default: 'general',
    index: true 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  targetRoles: [{ 
    type: String, 
    enum: ['all', 'tenant', 'staff', 'admin'], 
    default: 'all' 
  }],
  postedBy: { 
    type: String, 
    default: 'Admin',
    trim: true 
  },
  isPinned: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  readBy: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }]
}, { timestamps: true });

export default mongoose.models.Notice || mongoose.model('Notice', noticeSchema);

