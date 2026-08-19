import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tenantName: { type: String },
  roomNumber: { type: String },
  month: { type: String, required: true },
  baseRent: { type: Number, required: true },
  electricityCharge: { type: Number, default: 0 },
  maintenanceFee: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' },
  dueDate: { type: Date, required: true },
  paidDate: { type: Date, default: null },
  paymentMode: { type: String, default: 'Pending' }
}, { timestamps: true });

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
