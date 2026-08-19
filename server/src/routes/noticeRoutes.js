import express from 'express';
import {
  getNotices,
  getNoticeById,
  createNotice,
  updateNotice,
  acknowledgeNotice,
  deleteNotice
} from '../controllers/noticeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getNotices);
router.get('/:id', protect, getNoticeById);
router.post('/', protect, authorize('admin'), createNotice);
router.put('/:id', protect, authorize('admin'), updateNotice);
router.patch('/:id/acknowledge', protect, acknowledgeNotice);
router.delete('/:id', protect, authorize('admin'), deleteNotice);

export default router;
