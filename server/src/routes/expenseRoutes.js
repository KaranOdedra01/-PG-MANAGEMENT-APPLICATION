import express from 'express';
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, authorize('admin'), getExpenses);
router.get('/summary', protect, authorize('admin'), getExpenseSummary);
router.post('/', protect, authorize('admin'), createExpense);
router.put('/:id', protect, authorize('admin'), updateExpense);
router.delete('/:id', protect, authorize('admin'), deleteExpense);

export default router;
