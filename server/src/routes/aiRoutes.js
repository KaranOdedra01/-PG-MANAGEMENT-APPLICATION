import express from 'express';
import {
  chatWithAI,
  classifyComplaint,
  composeRentReminder
} from '../controllers/aiController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { 
  aiChatSchema, 
  aiClassifyComplaintSchema, 
  aiComposeReminderSchema 
} from '../validators/index.js';

const router = express.Router();

router.post('/chat', protect, validate(aiChatSchema), chatWithAI);
router.post('/classify-complaint', protect, validate(aiClassifyComplaintSchema), classifyComplaint);
router.post('/compose-reminder', protect, authorize('admin', 'staff'), validate(aiComposeReminderSchema), composeRentReminder);

export default router;