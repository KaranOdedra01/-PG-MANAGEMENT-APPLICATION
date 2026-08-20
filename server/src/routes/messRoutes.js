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
import { validate } from '../middleware/validate.js';
import { 
  updateMessMenuSchema, 
  toggleMealAttendanceSchema, 
  updateMealPlanSchema 
} from '../validators/index.js';

const router = express.Router();

router.get('/menu', protect, getWeeklyMenu);
router.put('/menu', protect, authorize('admin', 'staff'), validate(updateMessMenuSchema), updateWeeklyMenu);
router.get('/headcount', protect, getMealHeadcount);
router.get('/my-subscription', protect, getMySubscription);
router.patch('/attendance', protect, validate(toggleMealAttendanceSchema), toggleMealAttendance);
router.patch('/plan', protect, validate(updateMealPlanSchema), updateMealPlan);

export default router;
