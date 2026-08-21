import { MessMenu, MealSubscription, MealAttendance } from '../models/Mess.js';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getTodayDateString = (dateObj = new Date()) => {
  const d = dateObj instanceof Date ? dateObj : new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// @desc    Get Weekly Mess Timetable
// @route   GET /api/mess/menu
// @access  Private
export const getWeeklyMenu = async (req, res) => {
  try {
    let menu = await MessMenu.find();
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
// @access  Private (Admin & Staff)
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

// @desc    Get Live Meal Headcount for Date (Defaults to Today)
// @route   GET /api/mess/headcount
// @access  Private
export const getMealHeadcount = async (req, res) => {
  try {
    const targetDate = req.query.date ? req.query.date.trim() : getTodayDateString();

    const activeSubscribers = await MealSubscription.find({ 
      plan: { $ne: 'none' }, 
      isActive: true 
    });

    const activeUserIds = activeSubscribers.map(s => s.userId);

    // Query date-specific attendance for active subscribers
    const attendances = await MealAttendance.find({
      date: targetDate,
      userId: { $in: activeUserIds }
    });

    const attendanceMap = new Map();
    attendances.forEach(a => {
      attendanceMap.set(a.userId.toString(), a);
    });

    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;

    activeSubscribers.forEach(sub => {
      const record = attendanceMap.get(sub.userId.toString());
      if (record) {
        if (record.breakfast) breakfastCount++;
        if (record.lunch) lunchCount++;
        if (record.dinner) dinnerCount++;
      } else {
        // Default: full subscriber attends all meals unless opted out
        if (sub.plan === 'full') {
          breakfastCount++;
          lunchCount++;
          dinnerCount++;
        } else if (sub.plan === '2-meal') {
          breakfastCount++;
          dinnerCount++;
        }
      }
    });

    return res.json({
      success: true,
      data: {
        date: targetDate,
        totalSubscribers: activeSubscribers.length,
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

// @desc    Get Current Tenant's Meal Subscription & Date-Specific Attendance
// @route   GET /api/mess/my-subscription
// @access  Private (Tenant)
export const getMySubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const targetDate = req.query.date ? req.query.date.trim() : getTodayDateString();

    let sub = await MealSubscription.findOne({ userId });
    if (!sub) {
      sub = await MealSubscription.create({
        userId,
        plan: 'full',
        monthlyCharge: 3500,
        diet: 'Vegetarian',
        isActive: true
      });
    }

    let attendanceRecord = await MealAttendance.findOne({ userId, date: targetDate });
    if (!attendanceRecord) {
      attendanceRecord = await MealAttendance.create({
        userId,
        date: targetDate,
        breakfast: true,
        lunch: sub.plan !== '2-meal',
        dinner: true
      });
    }

    return res.json({
      success: true,
      data: {
        date: targetDate,
        subscription: {
          plan: sub.plan,
          monthlyCharge: sub.monthlyCharge,
          diet: sub.diet
        },
        todayAttendance: {
          breakfast: attendanceRecord.breakfast,
          lunch: attendanceRecord.lunch,
          dinner: attendanceRecord.dinner
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle Date-Specific Meal Attendance (Opt-In or Skip a Meal)
// @route   PATCH /api/mess/attendance
// @access  Private (Tenant)
export const toggleMealAttendance = async (req, res) => {
  try {
    const { mealType, date } = req.body;
    const userId = req.user._id;
    const targetDate = date ? date.trim() : getTodayDateString();

    if (!['breakfast', 'lunch', 'dinner'].includes(mealType)) {
      return res.status(400).json({ success: false, message: 'Invalid meal type. Choose breakfast, lunch, or dinner.' });
    }

    let attendanceRecord = await MealAttendance.findOne({ userId, date: targetDate });
    if (!attendanceRecord) {
      attendanceRecord = new MealAttendance({
        userId,
        date: targetDate,
        breakfast: true,
        lunch: true,
        dinner: true
      });
    }

    const currentVal = attendanceRecord[mealType];
    attendanceRecord[mealType] = !currentVal;
    await attendanceRecord.save();

    return res.json({
      success: true,
      message: attendanceRecord[mealType] ? `Opted in for ${mealType} on ${targetDate}` : `Marked skipping ${mealType} on ${targetDate}`,
      data: {
        date: targetDate,
        mealType,
        isAttending: attendanceRecord[mealType],
        attendance: {
          breakfast: attendanceRecord.breakfast,
          lunch: attendanceRecord.lunch,
          dinner: attendanceRecord.dinner
        }
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
