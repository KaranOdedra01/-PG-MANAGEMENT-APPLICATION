import express from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getComplaints);
router.get('/:id', protect, getComplaintById);
router.post('/', protect, createComplaint);
router.patch('/:id/status', protect, authorize('admin', 'staff'), updateComplaintStatus);
router.patch('/:id/assign', protect, authorize('admin'), assignComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

export default router;
