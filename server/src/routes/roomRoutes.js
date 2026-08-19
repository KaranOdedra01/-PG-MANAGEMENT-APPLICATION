import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  toggleRoomStatus,
  deleteRoom
} from '../controllers/roomController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Read operations for all authenticated users (Admin, Staff, Tenant)
router.get('/', protect, getRooms);
router.get('/:id', protect, getRoomById);

// Admin-only mutation operations
router.post('/', protect, authorize('admin'), createRoom);
router.put('/:id', protect, authorize('admin'), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);

// Status toggle accessible to Admin & Staff
router.patch('/:id/status', protect, authorize('admin', 'staff'), toggleRoomStatus);

export default router;
