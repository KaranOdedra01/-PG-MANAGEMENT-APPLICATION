import express from 'express';
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
