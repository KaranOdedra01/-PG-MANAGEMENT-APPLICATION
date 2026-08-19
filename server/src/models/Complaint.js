import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantName: { type: String },
  roomNumber: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['plumbing', 'electrical', 'cleaning', 'internet', 'security', 'other'], default: 'other' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
  assignedTo: { type: String, default: 'Unassigned' },
  attachments: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);
