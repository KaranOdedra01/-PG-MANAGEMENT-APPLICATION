import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  type: { 
    type: String, 
    enum: ['invoice', 'payment', 'complaint', 'notice', 'visitor', 'room', 'system'], 
    default: 'system',
    index: true 
  },
  title: { 
    type: String, 
    required: true,
    trim: true 
  },
  message: { 
    type: String, 
    required: true,
    trim: true 
  },
  link: { 
    type: String, 
    default: '' 
  },
  isRead: { 
    type: Boolean, 
    default: false,
    index: true 
  }
}, { timestamps: true });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
