import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { 
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
  month: { 
    type: String, 
    required: [true, 'Billing month is required'],
    trim: true,
    index: true 
  },
  year: {
    type: Number,
    default: () => new Date().getFullYear()
  },
  baseRent: { 
    type: Number, 
    required: [true, 'Base rent is required'],
    min: [0, 'Base rent cannot be negative'] 
  },
  electricityCharge: { 
    type: Number, 
    default: 0,
    min: [0, 'Electricity charge cannot be negative'] 
  },
  maintenanceFee: { 
    type: Number, 
    default: 0,
    min: [0, 'Maintenance fee cannot be negative'] 
  },
  messFee: { 
    type: Number, 
    default: 0,
    min: [0, 'Mess fee cannot be negative'] 
  },
  lateFee: { 
    type: Number, 
    default: 0,
    min: [0, 'Late fee cannot be negative'] 
  },
  discount: { 
    type: Number, 
    default: 0,
    min: [0, 'Discount cannot be negative'] 
  },
  totalAmount: { 
    type: Number, 
    required: [true, 'Total amount is required'],
    min: [0, 'Total amount cannot be negative'] 
  },
  status: { 
    type: String, 
    enum: ['pending', 'paid', 'partially_paid', 'overdue', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  dueDate: { 
    type: Date, 
    required: [true, 'Due date is required'],
    index: true 
  },
  paidDate: { 
    type: Date, 
    default: null 
  },
  paymentMode: { 
    type: String, 
    enum: ['UPI', 'Bank Transfer', 'Cash', 'Cheque', 'Card', 'Pending'],
    default: 'Pending' 
  },
  transactionId: {
    type: String,
    default: '',
    trim: true
  },
  notes: {
    type: String,
    default: '',
    trim: true
  }
}, { timestamps: true });

invoiceSchema.pre('save', function(next) {
  // Always enforce server-side calculation
  const calculated = (this.baseRent || 0) + 
                     (this.electricityCharge || 0) + 
                     (this.maintenanceFee || 0) + 
                     (this.messFee || 0) + 
                     (this.lateFee || 0) - 
                     (this.discount || 0);
  this.totalAmount = Math.max(0, calculated);

  // Auto-generate invoice number if missing
  if (!this.invoiceNumber) {
    this.invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  }
  next();
});

export default mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

