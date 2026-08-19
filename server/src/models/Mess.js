import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  breakfast: { type: String, required: true },
  lunch: { type: String, required: true },
  snacks: { type: String, required: true },
  dinner: { type: String, required: true },
  specialNote: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.MessMenu || mongoose.model('MessMenu', messMenuSchema);
