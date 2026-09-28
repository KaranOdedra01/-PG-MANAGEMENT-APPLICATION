import express from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  assignComplaint,
  updateComplaintPriority,
  confirmComplaintResolution,
  reopenComplaint,
  getMyTasks,
  deleteComplaint
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { 
  createComplaintSchema, 
  updateComplaintStatusSchema, 
  assignComplaintSchema 
} from '../validators/index.js';

const router = express.Router();

router.get('/', protect, getComplaints);
router.get('/my-tasks', protect, authorize('admin', 'staff'), getMyTasks);
router.get('/:id', protect, getComplaintById);
router.post('/', protect, validate(createComplaintSchema), createComplaint);
router.patch('/:id/status', protect, authorize('admin', 'staff'), validate(updateComplaintStatusSchema), updateComplaintStatus);
router.patch('/:id/priority', protect, authorize('admin', 'staff'), updateComplaintPriority);
router.patch('/:id/assign', protect, authorize('admin', 'staff'), validate(assignComplaintSchema), assignComplaint);
router.patch('/:id/confirm', protect, authorize('tenant'), confirmComplaintResolution);
router.patch('/:id/reopen', protect, authorize('tenant'), reopenComplaint);
router.delete('/:id', protect, authorize('admin'), deleteComplaint);

export default router;

