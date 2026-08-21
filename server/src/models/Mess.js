import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: [true, 'Day is required'], 
    unique: true,
    index: true 
  },
  breakfast: { type: String, required: [true, 'Breakfast menu is required'], trim: true },
  lunch: { type: String, required: [true, 'Lunch menu is required'], trim: true },
  snacks: { type: String, required: [true, 'Snacks menu is required'], trim: true },
  dinner: { type: String, required: [true, 'Dinner menu is required'], trim: true },
  specialNote: { type: String, default: '', trim: true }
}, { timestamps: true });

const mealSubscriptionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true, 
    unique: true,
    index: true 
  },
  plan: { 
    type: String, 
    enum: ['full', '2-meal', 'none'], 
    default: 'full' 
  },
  monthlyCharge: { 
    type: Number, 
    default: 3500,
    min: 0 
  },
  diet: { 
    type: String, 
    enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Jain'], 
    default: 'Vegetarian' 
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Date-Specific Meal Attendance Schema
const mealAttendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    index: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format']
  },
  breakfast: {
    type: Boolean,
    default: true
  },
  lunch: {
    type: Boolean,
    default: true
  },
  dinner: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound unique constraint to ensure 1 record per user per date
mealAttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const MessMenu = mongoose.models.MessMenu || mongoose.model('MessMenu', messMenuSchema);
export const MealSubscription = mongoose.models.MealSubscription || mongoose.model('MealSubscription', mealSubscriptionSchema);
export const MealAttendance = mongoose.models.MealAttendance || mongoose.model('MealAttendance', mealAttendanceSchema);

export default MessMenu;
