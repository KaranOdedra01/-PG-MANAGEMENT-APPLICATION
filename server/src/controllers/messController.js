import { MessMenu, MealSubscription } from '../models/Mess.js';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

// Default 7-day template if database is freshly seeded
const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// @desc    Get Weekly Mess Timetable
// @route   GET /api/mess/menu
// @access  Private
export const getWeeklyMenu = async (req, res) => {
  try {
    let menu = await MessMenu.find();

    // Sort in standard weekly order
    menu.sort((a, b) => defaultDays.indexOf(a.day) - defaultDays.indexOf(b.day));

    return res.json({
      success: true,
      data: menu
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Day's Mess Menu
// @route   PUT /api/mess/menu
// @access  Private (Admin Only)
export const updateWeeklyMenu = async (req, res) => {
  try {
    const { day, breakfast, lunch, snacks, dinner, specialNote } = req.body;

    let menuItem = await MessMenu.findOne({ day });
    if (!menuItem) {
      menuItem = new MessMenu({ day });
    }

    if (breakfast) menuItem.breakfast = breakfast.trim();
    if (lunch) menuItem.lunch = lunch.trim();
    if (snacks) menuItem.snacks = snacks.trim();
    if (dinner) menuItem.dinner = dinner.trim();
    if (specialNote !== undefined) menuItem.specialNote = specialNote.trim();

    await menuItem.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_MESS_MENU',
      entity: 'MessMenu',
      entityId: menuItem._id,
      description: `Updated mess menu for ${day}`
    });

    return res.json({
      success: true,
      message: `Mess menu for ${day} updated successfully`,
      data: menuItem
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Today's Live Meal Headcount & Subscription Stats
// @route   GET /api/mess/headcount
// @access  Private
export const getMealHeadcount = async (req, res) => {
  try {
    const totalTenants = await User.countDocuments({ role: 'tenant', isActive: true });
    const subscriptions = await MealSubscription.find({ plan: { $ne: 'none' } });

    const breakfastCount = subscriptions.filter(s => s.attendance?.breakfast).length;
    const lunchCount = subscriptions.filter(s => s.attendance?.lunch).length;
    const dinnerCount = subscriptions.filter(s => s.attendance?.dinner).length;

    return res.json({
      success: true,
      data: {
        totalSubscribedTenants: subscriptions.length || totalTenants,
        headcount: {
          breakfast: breakfastCount,
          lunch: lunchCount,
          dinner: dinnerCount
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Current Tenant's Meal Subscription & Attendance Status
// @route   GET /api/mess/my-subscription
// @access  Private (Tenant)
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;

    let sub = await MealSubscription.findOne({ userId });
    if (!sub) {
      sub = await MealSubscription.create({
        userId,
        plan: 'full',
        monthlyCharge: 3500,
        diet: 'Vegetarian',
        attendance: { breakfast: true, lunch: true, dinner: true }
      });
    }

    return res.json({
      success: true,
      data: {
        subscription: {
          plan: sub.plan,
          monthlyCharge: sub.monthlyCharge,
          diet: sub.diet
        },
        todayAttendance: sub.attendance
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Meal Attendance (Opt-In or Skip a Meal)
// @route   PATCH /api/mess/attendance
// @access  Private (Tenant)
export const toggleMealAttendance = async (req, res) => {
  try {
    const { mealType } = req.body; // 'breakfast' | 'lunch' | 'dinner'
    const userId = req.user._id;

    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ success: false, message: 'Invalid meal type' });
    }

    let sub = await MealSubscription.findOne({ userId });
    if (!sub) {
      sub = new MealSubscription({
        userId,
        plan: 'full',
        monthlyCharge: 3500,
        diet: 'Vegetarian',
        attendance: { breakfast: true, lunch: true, dinner: true }
      });
    }

    const currentVal = sub.attendance[mealType];
    sub.attendance[mealType] = !currentVal;
    await sub.save();

    return res.json({
      success: true,
      message: sub.attendance[mealType] ? `Opted in for ${mealType}` : `Marked skipping ${mealType}`,
      data: {
        mealType,
        isAttending: sub.attendance[mealType]
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Tenant Meal Plan
// @route   PATCH /api/mess/plan
// @access  Private (Tenant & Admin)
export const updateMealPlan = async (req, res) => {
  try {
    const { plan, diet } = req.body;
    const userId = req.user._id;

    let charge = 3500;
    if (plan === '2-meal') charge = 2800;
    if (plan === 'none') charge = 0;

    let sub = await MealSubscription.findOne({ userId });
    if (!sub) {
      sub = new MealSubscription({ userId });
    }

    if (plan) {
      sub.plan = plan;
      sub.monthlyCharge = charge;
    }
    if (diet) sub.diet = diet;

    await sub.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_MEAL_PLAN',
      entity: 'MealSubscription',
      entityId: sub._id,
      description: `Updated meal plan to ${sub.plan} (${sub.diet})`
    });

    return res.json({
      success: true,
      message: `Meal subscription plan updated to ${sub.plan}`,
      data: sub
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
