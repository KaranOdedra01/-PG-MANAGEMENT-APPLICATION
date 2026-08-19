import express from 'express';
import {
  getExecutiveSummary,
  getFinancialReport,
  getOccupancyReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, authorize('admin'), getExecutiveSummary);
router.get('/financial', protect, authorize('admin'), getFinancialReport);
router.get('/occupancy', protect, authorize('admin'), getOccupancyReport);

export default router;
