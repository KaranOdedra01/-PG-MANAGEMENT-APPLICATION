const fs = require('fs');
const path = require('path');

const messModel = `import mongoose from 'mongoose';

const messMenuSchema = new mongoose.Schema({
  day: { type: String, required: true, unique: true },
  breakfast: { type: String, required: true },
  lunch: { type: String, required: true },
  snacks: { type: String, required: true },
  dinner: { type: String, required: true },
  specialNote: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.models.MessMenu || mongoose.model('MessMenu', messMenuSchema);
`;

const messController = `import mongoose from 'mongoose';
import { inMemoryUsers } from '../utils/inMemoryStore.js';

export let inMemoryWeeklyMenu = [
  {
    day: 'Monday',
    breakfast: 'Poha, Boiled Eggs / Banana, Tea/Coffee',
    lunch: 'Dal Makhani, Mix Veg, Roti, Jeera Rice, Curd',
    snacks: 'Veg Sandwich & Ginger Chai',
    dinner: 'Aloo Gobi, Chana Dal, Chapati, Steamed Rice, Gulab Jamun',
    specialNote: 'Dessert Included'
  },
  {
    day: 'Tuesday',
    breakfast: 'Aloo Paratha with Curd & Pickle, Tea',
    lunch: 'Rajma Masala, Aloo Shimla Mirch, Roti, Basmati Rice, Salad',
    snacks: 'Samosa with Green & Tamarind Chutney',
    dinner: 'Kadhai Paneer / Egg Curry, Tarka Dal, Roti, Rice',
    specialNote: 'Special Paneer Day'
  },
  {
    day: 'Wednesday',
    breakfast: 'Idli Sambar & Coconut Chutney, Filter Coffee',
    lunch: 'Chole Masala, Bhature / Puri, Jeera Rice, Boondi Raita',
    snacks: 'White Sauce Pasta & Cold Coffee',
    dinner: 'Soyabean Curry, Moong Dal, Roti, Rice, Kheer',
    specialNote: 'South Indian Breakfast'
  },
  {
    day: 'Thursday',
    breakfast: 'Methi Thepla, Chhundo / Pickle, Masala Chai',
    lunch: 'Kadhi Pakoda, Aloo Bhindi Fry, Steamed Rice, Roti',
    snacks: 'Bhel Puri & Lemon Iced Tea',
    dinner: 'Matar Paneer, Yellow Dal Tadka, Butter Roti, Pulao',
    specialNote: 'Light Gujarati Lunch'
  },
  {
    day: 'Friday',
    breakfast: 'Bread Omelette / Veg Cheese Toast, Tea/Coffee',
    lunch: 'Dal Fry, Sev Tameta Nu Shaak, Rice, Phulka Roti, Salad',
    snacks: 'Vada Pav with Fried Green Chillies',
    dinner: 'Veg Biryani / Chicken Biryani, Veg Raita, Salan, Ice Cream',
    specialNote: 'Biryani Night'
  },
  {
    day: 'Saturday',
    breakfast: 'Masala Dosa with Sambhar & Red Chutney',
    lunch: 'Baingan Bharta, Gujarati Dal, Steamed Rice, Roti, Buttermilk',
    snacks: 'French Fries & Chai',
    dinner: 'Pav Bhaji with Extra Butter Pav, Pulav, Sweet Lassi',
    specialNote: 'Street Food Saturday'
  },
  {
    day: 'Sunday',
    breakfast: 'Poori Bhaji / Chana Poori, Halwa, Special Tea',
    lunch: 'Dum Aloo Kashmiri, Dal Tadka, Ghee Rice, Roti, Roasted Papad',
    snacks: 'Pakodas & Masala Chai',
    dinner: 'Paneer Butter Masala, Butter Naan, Veg Pulao, Rasgulla',
    specialNote: 'Sunday Feast'
  }
];

export let inMemoryMealAttendance = {
  breakfast: ['66c1a0010000000000000002', '66c1a0010000000000000004'],
  lunch: ['66c1a0010000000000000002', '66c1a0010000000000000004', '66c1a0010000000000000005'],
  dinner: ['66c1a0010000000000000002', '66c1a0010000000000000004', '66c1a0010000000000000005']
};

export let inMemoryTenantPlans = {
  '66c1a0010000000000000002': { plan: 'full', monthlyCharge: 3500, diet: 'Vegetarian' },
  '66c1a0010000000000000004': { plan: 'full', monthlyCharge: 3500, diet: 'Vegetarian' },
  '66c1a0010000000000000005': { plan: '2-meal', monthlyCharge: 2800, diet: 'Eggetarian' }
};

// @desc    Get Weekly Mess Timetable
// @route   GET /api/mess/menu
// @access  Private
export const getWeeklyMenu = async (req, res) => {
  try {
    res.json({
      success: true,
      data: inMemoryWeeklyMenu
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Day's Mess Menu
// @route   PUT /api/mess/menu
// @access  Private (Admin Only)
export const updateWeeklyMenu = async (req, res) => {
  try {
    const { day, breakfast, lunch, snacks, dinner, specialNote } = req.body;

    const index = inMemoryWeeklyMenu.findIndex(m => m.day.toLowerCase() === day.toLowerCase());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Day not found' });
    }

    inMemoryWeeklyMenu[index] = {
      ...inMemoryWeeklyMenu[index],
      breakfast: breakfast || inMemoryWeeklyMenu[index].breakfast,
      lunch: lunch || inMemoryWeeklyMenu[index].lunch,
      snacks: snacks || inMemoryWeeklyMenu[index].snacks,
      dinner: dinner || inMemoryWeeklyMenu[index].dinner,
      specialNote: specialNote !== undefined ? specialNote : inMemoryWeeklyMenu[index].specialNote
    };

    res.json({
      success: true,
      message: 'Mess menu for ' + day + ' updated successfully',
      data: inMemoryWeeklyMenu[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Today's Live Meal Headcount & Active Subscription Stats
// @route   GET /api/mess/headcount
// @access  Private
export const getMealHeadcount = async (req, res) => {
  try {
    const totalTenants = inMemoryUsers.filter(u => u.role === 'tenant').length;
    res.json({
      success: true,
      data: {
        totalSubscribedTenants: totalTenants,
        headcount: {
          breakfast: inMemoryMealAttendance.breakfast.length,
          lunch: inMemoryMealAttendance.lunch.length,
          dinner: inMemoryMealAttendance.dinner.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current Tenant's Meal Subscription & Attendance Status
// @route   GET /api/mess/my-subscription
// @access  Private (Tenant)
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id ? req.user._id.toString() : '66c1a0010000000000000002';
    const sub = inMemoryTenantPlans[userId] || { plan: 'full', monthlyCharge: 3500, diet: 'Vegetarian' };

    const todayAttendance = {
      breakfast: inMemoryMealAttendance.breakfast.includes(userId),
      lunch: inMemoryMealAttendance.lunch.includes(userId),
      dinner: inMemoryMealAttendance.dinner.includes(userId)
    };

    res.json({
      success: true,
      data: {
        subscription: sub,
        todayAttendance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Meal Attendance (Opt-In or Skip a Meal)
// @route   PATCH /api/mess/attendance
// @access  Private (Tenant)
export const toggleMealAttendance = async (req, res) => {
  try {
    const { mealType } = req.body; // 'breakfast' | 'lunch' | 'dinner'
    const userId = req.user._id ? req.user._id.toString() : '66c1a0010000000000000002';

    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ success: false, message: 'Invalid meal type' });
    }

    let isAttending = false;
    if (inMemoryMealAttendance[mealType].includes(userId)) {
      // Remove (skipping meal)
      inMemoryMealAttendance[mealType] = inMemoryMealAttendance[mealType].filter(id => id !== userId);
      isAttending = false;
    } else {
      // Add (opting in)
      inMemoryMealAttendance[mealType].push(userId);
      isAttending = true;
    }

    res.json({
      success: true,
      message: isAttending ? 'Opted in for ' + mealType : 'Marked skipping ' + mealType,
      data: {
        mealType,
        isAttending,
        currentHeadcount: inMemoryMealAttendance[mealType].length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Tenant Meal Plan
// @route   PATCH /api/mess/plan
// @access  Private (Tenant & Admin)
export const updateMealPlan = async (req, res) => {
  try {
    const { plan, diet } = req.body;
    const userId = req.user._id ? req.user._id.toString() : '66c1a0010000000000000002';

    let charge = 3500;
    if (plan === '2-meal') charge = 2800;
    if (plan === 'none') charge = 0;

    inMemoryTenantPlans[userId] = {
      plan: plan || 'full',
      monthlyCharge: charge,
      diet: diet || 'Vegetarian'
    };

    res.json({
      success: true,
      message: 'Meal subscription plan updated to ' + plan,
      data: inMemoryTenantPlans[userId]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
`;

const messRoutes = `import express from 'express';
import {
  getWeeklyMenu,
  updateWeeklyMenu,
  getMealHeadcount,
  getMySubscription,
  toggleMealAttendance,
  updateMealPlan
} from '../controllers/messController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/menu', protect, getWeeklyMenu);
router.put('/menu', protect, authorize('admin'), updateWeeklyMenu);
router.get('/headcount', protect, getMealHeadcount);
router.get('/my-subscription', protect, getMySubscription);
router.patch('/attendance', protect, toggleMealAttendance);
router.patch('/plan', protect, updateMealPlan);

export default router;
`;

fs.writeFileSync(path.join(__dirname, 'src/models/Mess.js'), messModel, 'utf8');
fs.writeFileSync(path.join(__dirname, 'src/controllers/messController.js'), messController, 'utf8');
fs.writeFileSync(path.join(__dirname, 'src/routes/messRoutes.js'), messRoutes, 'utf8');
console.log('Successfully generated Mess Management backend files!');
