import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category: { 
    type: String, 
    enum: ['electricity', 'water', 'salary', 'maintenance', 'internet', 'groceries', 'other'], 
    required: true 
  },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  paymentMode: { type: String, enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque'], default: 'Bank Transfer' },
  receiptRef: { type: String, default: '' },
  addedBy: { type: String, default: 'Admin' }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
