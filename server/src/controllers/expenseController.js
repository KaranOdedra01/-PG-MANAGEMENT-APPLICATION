import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all expenses with filter & search
// @route   GET /api/expenses
// @access  Private (Admin & Staff)
export const getExpenses = async (req, res) => {
  try {
    const { category, search, month } = req.query;
    const query = {};

    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }

    if (search) {
      const q = search.trim();
      query.$or = [
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { receiptRef: { $regex: q, $options: 'i' } }
      ];
    }

    if (month && month !== 'all') {
      // Month could be e.g. "August" or "2026-08"
      const date = new Date(month);
      if (!isNaN(date.getTime())) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        query.date = { $gte: start, $lte: end };
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: expenses.length,
      data: expenses
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get P&L Financial Summary (Revenue vs Expenses)
// @route   GET /api/expenses/summary
// @access  Private (Admin Only)
export const getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.find();
    const paidInvoices = await Invoice.find({ status: 'paid' });

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const categoryTotals = {
      electricity: 0,
      water: 0,
      salary: 0,
      maintenance: 0,
      internet: 0,
      groceries: 0,
      cleaning: 0,
      repairs: 0,
      other: 0
    };

    expenses.forEach(e => {
      const cat = e.category?.toLowerCase() || 'other';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += e.amount;
      } else {
        categoryTotals.other = (categoryTotals.other || 0) + e.amount;
      }
    });

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        categoryTotals,
        expenseCount: expenses.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a new expense
// @route   POST /api/expenses
// @access  Private (Admin Only)
export const createExpense = async (req, res) => {
  try {
    const { category, amount, description, date, paymentMode, receiptRef } = req.body;

    const expense = await Expense.create({
      category: category.toLowerCase(),
      amount: Number(amount),
      description: description.trim(),
      date: date ? new Date(date) : new Date(),
      paymentMode: paymentMode || 'Bank Transfer',
      receiptRef: receiptRef ? receiptRef.trim() : '',
      addedBy: req.user?.name || 'Admin'
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expense._id,
      description: `Logged expense of ₹${expense.amount} for ${expense.category}: ${expense.description}`
    });

    return res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin Only)
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date, paymentMode, receiptRef } = req.body;

    const expense = await Expense.findById(id);
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (category) expense.category = category.toLowerCase();
    if (amount !== undefined) expense.amount = Number(amount);
    if (description) expense.description = description.trim();
    if (date) expense.date = new Date(date);
    if (paymentMode) expense.paymentMode = paymentMode;
    if (receiptRef !== undefined) expense.receiptRef = receiptRef.trim();

    await expense.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_EXPENSE',
      entity: 'Expense',
      entityId: expense._id,
      description: `Updated expense record #${expense._id}`
    });

    return res.json({
      success: true,
      message: 'Expense updated successfully',
      data: expense
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin Only)
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    await expense.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_EXPENSE',
      entity: 'Expense',
      entityId: id,
      description: `Deleted expense record of ₹${expense.amount} (${expense.category})`
    });

    return res.json({
      success: true,
      message: 'Expense record deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
