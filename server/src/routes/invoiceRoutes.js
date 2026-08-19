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

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);
router.post('/', protect, authorize('admin'), createInvoice);
router.post('/generate-monthly', protect, authorize('admin'), generateMonthlyInvoices);
router.patch('/:id/pay', protect, recordPayment);
router.delete('/:id', protect, authorize('admin'), deleteInvoice);

export default router;
