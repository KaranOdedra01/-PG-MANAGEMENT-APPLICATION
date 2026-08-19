import express from 'express';
import { getDashboardStats, getRecentActivities } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.get('/activities', protect, getRecentActivities);

export default router;
