import express from 'express';
import {
  getTenants,
  getTenantById,
  onboardTenant,
  updateTenant,
  checkoutTenant,
  deleteTenant
} from '../controllers/tenantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'staff'), getTenants);
router.get('/:id', protect, authorize('admin', 'staff'), getTenantById);
router.post('/onboard', protect, authorize('admin'), onboardTenant);
router.put('/:id', protect, authorize('admin'), updateTenant);
router.post('/:id/checkout', protect, authorize('admin'), checkoutTenant);
router.delete('/:id', protect, authorize('admin'), deleteTenant);

export default router;
