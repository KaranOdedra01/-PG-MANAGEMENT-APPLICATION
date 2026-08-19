import express from 'express';
import {
  getVisitors,
  getActiveVisitors,
  checkinVisitor,
  checkoutVisitor,
  deleteVisitor
} from '../controllers/visitorController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'staff'), getVisitors);
router.get('/active', protect, authorize('admin', 'staff'), getActiveVisitors);
router.post('/', protect, authorize('admin', 'staff'), checkinVisitor);
router.patch('/:id/checkout', protect, authorize('admin', 'staff'), checkoutVisitor);
router.delete('/:id', protect, authorize('admin'), deleteVisitor);

export default router;
