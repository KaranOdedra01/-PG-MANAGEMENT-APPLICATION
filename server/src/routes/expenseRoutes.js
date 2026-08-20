import express from 'express';
import {
  getExpenses,
  getExpenseSummary,
  createExpense,
  updateExpense,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createExpenseSchema, updateExpenseSchema } from '../validators/index.js';

const router = express.Router();

router.get('/', protect, authorize('admin', 'staff'), getExpenses);
router.get('/summary', protect, authorize('admin'), getExpenseSummary);
router.post('/', protect, authorize('admin'), validate(createExpenseSchema), createExpense);
router.put('/:id', protect, authorize('admin'), validate(updateExpenseSchema), updateExpense);
router.delete('/:id', protect, authorize('admin'), deleteExpense);

export default router;
