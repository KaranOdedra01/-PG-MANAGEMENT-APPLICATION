import express from 'express';
import {
  getInvoices,
  getInvoiceById,
  createInvoice,
  generateMonthlyInvoices,
  recordPayment,
  deleteInvoice
} from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createInvoiceSchema, generateMonthlyInvoicesSchema, recordPaymentSchema } from '../validators/index.js';

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/', protect, authorize('admin'), validate(createInvoiceSchema), createInvoice);
router.post('/generate-monthly', protect, authorize('admin'), validate(generateMonthlyInvoicesSchema), generateMonthlyInvoices);
router.patch('/:id/pay', protect, validate(recordPaymentSchema), recordPayment);
router.delete('/:id', protect, authorize('admin'), deleteInvoice);

export default router;
