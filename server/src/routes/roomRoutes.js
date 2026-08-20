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
import { validate } from '../middleware/validate.js';
import { createRoomSchema, updateRoomSchema, toggleRoomStatusSchema } from '../validators/index.js';

const router = express.Router();

// Read operations for all authenticated users
router.get('/', protect, getRooms);
router.get('/:id', protect, getRoomById);

// Admin-only mutation operations
router.post('/', protect, authorize('admin'), validate(createRoomSchema), createRoom);
router.put('/:id', protect, authorize('admin'), validate(updateRoomSchema), updateRoom);
router.delete('/:id', protect, authorize('admin'), deleteRoom);

// Status toggle accessible to Admin & Staff
router.patch('/:id/status', protect, authorize('admin', 'staff'), validate(toggleRoomStatusSchema), toggleRoomStatus);

export default router;
