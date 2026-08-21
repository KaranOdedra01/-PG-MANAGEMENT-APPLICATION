import Expense from '../models/Expense.js';
import Invoice from '../models/Invoice.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all expenses with Pagination, Filters & Search
// @route   GET /api/expenses
// @access  Private (Admin & Staff)
export const getExpenses = async (req, res) => {
  try {
    const { category, search, month } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

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
      const date = new Date(month);
      if (!isNaN(date.getTime())) {
        const start = new Date(date.getFullYear(), date.getMonth(), 1);
        const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
        query.date = { $gte: start, $lte: end };
      }
    }

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: expenses,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get P&L Financial Summary (MongoDB Aggregations)
// @route   GET /api/expenses/summary
// @access  Private (Admin Only)
export const getExpenseSummary = async (req, res) => {
  try {
    // 1. Revenue Aggregation
    const [revAgg] = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revAgg?.totalRevenue || 0;

    // 2. Expense Category Aggregation
    const categoryAgg = await Expense.aggregate([
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalExpenses = 0;
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

    categoryAgg.forEach(item => {
      const cat = item._id?.toLowerCase() || 'other';
      totalExpenses += item.totalAmount;
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += item.totalAmount;
      } else {
        categoryTotals.other = (categoryTotals.other || 0) + item.totalAmount;
      }
    });

    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
    const expenseCount = await Expense.countDocuments();

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        categoryTotals,
        expenseCount
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
