import mongoose from 'mongoose';
import Expense from '../models/Expense.js';
import { inMemoryExpenses, inMemoryInvoices } from '../utils/inMemoryStore.js';

// @desc    Get all expenses with filter & search
// @route   GET /api/expenses
// @access  Private (Admin Only)
export const getExpenses = async (req, res) => {
  try {
    const { category, search, month } = req.query;
    let results = [...inMemoryExpenses];

    if (category && category !== 'all') {
      results = results.filter(e => e.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(e => 
        e.description.toLowerCase().includes(q) || 
        e.category.toLowerCase().includes(q)
      );
    }
    if (month && month !== 'all') {
      results = results.filter(e => {
        const d = new Date(e.date);
        const expMonth = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        return expMonth.toLowerCase().includes(month.toLowerCase());
      });
    }

    results.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get P&L Financial Summary (Revenue vs Expenses)
// @route   GET /api/expenses/summary
// @access  Private (Admin Only)
export const getExpenseSummary = async (req, res) => {
  try {
    const totalExpenses = inMemoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRevenue = inMemoryInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Category breakdown
    const categoryTotals = {
      electricity: 0,
      water: 0,
      salary: 0,
      maintenance: 0,
      internet: 0,
      groceries: 0,
      other: 0
    };

    inMemoryExpenses.forEach(e => {
      const cat = e.category?.toLowerCase() || 'other';
      if (categoryTotals[cat] !== undefined) {
        categoryTotals[cat] += e.amount;
      } else {
        categoryTotals.other += e.amount;
      }
    });

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Number(profitMargin),
        categoryTotals,
        expenseCount: inMemoryExpenses.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a new expense
// @route   POST /api/expenses
// @access  Private (Admin Only)
export const createExpense = async (req, res) => {
  try {
    const { category, amount, description, date = new Date(), paymentMode = 'Bank Transfer', receiptRef = '' } = req.body;

    if (!category || !amount || !description) {
      return res.status(400).json({ success: false, message: 'Please provide category, amount, and description' });
    }

    const newExpense = {
      _id: 'exp_' + Date.now(),
      category: category.toLowerCase(),
      amount: Number(amount),
      description,
      date: new Date(date),
      paymentMode,
      receiptRef,
      addedBy: req.user?.name || 'Admin',
      createdAt: new Date()
    };

    inMemoryExpenses.unshift(newExpense);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: newExpense
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an expense
// @route   PUT /api/expenses/:id
// @access  Private (Admin Only)
export const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, description, date, paymentMode, receiptRef } = req.body;

    const index = inMemoryExpenses.findIndex(e => e._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const current = inMemoryExpenses[index];
    inMemoryExpenses[index] = {
      ...current,
      category: category ? category.toLowerCase() : current.category,
      amount: amount !== undefined ? Number(amount) : current.amount,
      description: description || current.description,
      date: date ? new Date(date) : current.date,
      paymentMode: paymentMode || current.paymentMode,
      receiptRef: receiptRef !== undefined ? receiptRef : current.receiptRef
    };

    res.json({
      success: true,
      message: 'Expense updated successfully',
      data: inMemoryExpenses[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an expense
// @route   DELETE /api/expenses/:id
// @access  Private (Admin Only)
export const deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryExpenses.findIndex(e => e._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    inMemoryExpenses.splice(index, 1);
    res.json({ success: true, message: 'Expense record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
