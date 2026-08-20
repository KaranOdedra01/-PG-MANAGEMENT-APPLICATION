import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  category: { 
    type: String, 
    enum: {
      values: ['electricity', 'water', 'salary', 'maintenance', 'internet', 'groceries', 'cleaning', 'repairs', 'other'],
      message: '{VALUE} is not a valid expense category'
    }, 
    required: [true, 'Expense category is required'],
    index: true 
  },
  amount: { 
    type: Number, 
    required: [true, 'Expense amount is required'],
    min: [0, 'Expense amount cannot be negative'] 
  },
  description: { 
    type: String, 
    required: [true, 'Expense description is required'],
    trim: true 
  },
  date: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  paymentMode: { 
    type: String, 
    enum: ['Bank Transfer', 'UPI', 'Cash', 'Cheque', 'Card'], 
    default: 'Bank Transfer' 
  },
  receiptRef: { 
    type: String, 
    default: '',
    trim: true 
  },
  addedBy: { 
    type: String, 
    default: 'Admin',
    trim: true 
  }
}, { timestamps: true });

export default mongoose.models.Expense || mongoose.model('Expense', expenseSchema);

