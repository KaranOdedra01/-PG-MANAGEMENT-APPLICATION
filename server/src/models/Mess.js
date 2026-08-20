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
  attendance: {
    breakfast: { type: Boolean, default: true },
    lunch: { type: Boolean, default: true },
    dinner: { type: Boolean, default: true }
  }
}, { timestamps: true });

export const MessMenu = mongoose.models.MessMenu || mongoose.model('MessMenu', messMenuSchema);
export const MealSubscription = mongoose.models.MealSubscription || mongoose.model('MealSubscription', mealSubscriptionSchema);

export default MessMenu;

