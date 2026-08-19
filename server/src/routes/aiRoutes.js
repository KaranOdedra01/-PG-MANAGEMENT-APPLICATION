import express from 'express';
import {
  chatWithAI,
  classifyComplaint,
  composeRentReminder
} from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/chat', protect, chatWithAI);
router.post('/classify-complaint', protect, classifyComplaint);
router.post('/compose-reminder', protect, authorize('admin'), composeRentReminder);

export default router;