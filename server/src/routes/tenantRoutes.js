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
import { validate } from '../middleware/validate.js';
import { onboardTenantSchema, updateTenantSchema } from '../validators/index.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'staff'), getTenants);
router.get('/:id', protect, getTenantById);
router.post('/onboard', protect, authorize('admin', 'staff'), validate(onboardTenantSchema), onboardTenant);
router.post('/', protect, authorize('admin', 'staff'), validate(onboardTenantSchema), onboardTenant);
router.put('/:id', protect, authorize('admin', 'staff'), validate(updateTenantSchema), updateTenant);
router.post('/:id/checkout', protect, authorize('admin', 'staff'), checkoutTenant);
router.patch('/:id/checkout', protect, authorize('admin', 'staff'), checkoutTenant);
router.delete('/:id', protect, authorize('admin'), deleteTenant);

export default router;
