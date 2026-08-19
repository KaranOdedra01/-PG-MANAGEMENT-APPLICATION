import mongoose from 'mongoose';
import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import { inMemoryInvoices, inMemoryUsers, inMemoryRooms } from '../utils/inMemoryStore.js';
import { inMemoryTenants } from './tenantController.js';

// @desc    Get Invoices (Admin/Staff gets all with filters, Tenant gets only own)
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id ? req.user._id.toString() : '';
    const { status, month, search } = req.query;

    let results = [...inMemoryInvoices];

    // If Tenant, only show their own invoices
    if (role === 'tenant') {
      results = results.filter(i => i.tenantId === userId);
    }

    if (status && status !== 'all') {
      results = results.filter(i => i.status === status);
    }
    if (month && month !== 'all') {
      results = results.filter(i => i.month.toLowerCase().includes(month.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(i => 
        (i.tenantName && i.tenantName.toLowerCase().includes(q)) || 
        (i.roomNumber && i.roomNumber.toLowerCase().includes(q))
      );
    }

    // Sort by dueDate descending
    results.sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Invoice
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = inMemoryInvoices.find(i => i._id.toString() === id.toString());
    if (!invoice) return res.status(404).json({ success: false, message: 'Invoice not found' });
    res.json({ success: true, data: invoice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create Single Invoice
// @route   POST /api/invoices
// @access  Private (Admin Only)
export const createInvoice = async (req, res) => {
  try {
    const { tenantId, month, baseRent, electricityCharge = 0, maintenanceFee = 0, dueDate } = req.body;

    if (!tenantId || !month || !baseRent || !dueDate) {
      return res.status(400).json({ success: false, message: 'Please provide tenantId, month, baseRent, and dueDate' });
    }

    const tenantUser = inMemoryUsers.find(u => u._id.toString() === tenantId.toString()) ||
                       inMemoryTenants.find(t => t.userId.toString() === tenantId.toString() || t._id.toString() === tenantId.toString());

    const totalAmount = Number(baseRent) + Number(electricityCharge) + Number(maintenanceFee);

    const newInvoice = {
      _id: 'inv_' + Date.now(),
      tenantId: tenantUser?.userId || tenantId,
      tenantName: tenantUser?.name || 'Tenant Resident',
      roomNumber: tenantUser?.roomNumber || '101',
      month,
      baseRent: Number(baseRent),
      electricityCharge: Number(electricityCharge),
      maintenanceFee: Number(maintenanceFee),
      totalAmount,
      status: 'pending',
      dueDate: new Date(dueDate),
      paidDate: null,
      paymentMode: 'Pending',
      createdAt: new Date()
    };

    inMemoryInvoices.unshift(newInvoice);

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: newInvoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Generate Invoices for All Active Tenants for a Month
// @route   POST /api/invoices/generate-monthly
// @access  Private (Admin Only)
export const generateMonthlyInvoices = async (req, res) => {
  try {
    const { month = 'September 2026', electricityCharge = 500, maintenanceFee = 200, dueDate } = req.body;

    const activeTenants = inMemoryTenants.filter(t => t.status === 'active');
    if (activeTenants.length === 0) {
      return res.status(400).json({ success: false, message: 'No active tenants found to bill' });
    }

    const generated = [];
    const defaultDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    for (const tenant of activeTenants) {
      // Check if invoice already exists for this tenant & month
      const exists = inMemoryInvoices.find(i => i.tenantId === tenant.userId && i.month.toLowerCase() === month.toLowerCase());
      if (!exists) {
        const baseRent = Number(tenant.monthlyRent) || 7500;
        const totalAmount = baseRent + Number(electricityCharge) + Number(maintenanceFee);

        const inv = {
          _id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          tenantId: tenant.userId,
          tenantName: tenant.name,
          roomNumber: tenant.roomNumber,
          month,
          baseRent,
          electricityCharge: Number(electricityCharge),
          maintenanceFee: Number(maintenanceFee),
          totalAmount,
          status: 'pending',
          dueDate: defaultDueDate,
          paidDate: null,
          paymentMode: 'Pending',
          createdAt: new Date()
        };
        inMemoryInvoices.unshift(inv);
        generated.push(inv);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Generated ' + generated.length + ' monthly invoices for ' + month,
      data: generated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Invoice Payment
// @route   PATCH /api/invoices/:id/pay
// @access  Private (Admin, Staff, or Tenant paying)
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode = 'UPI', transactionId = '' } = req.body;

    const invoice = inMemoryInvoices.find(i => i._id.toString() === id.toString());
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    invoice.paymentMode = paymentMode;
    invoice.transactionId = transactionId || ('TXN_' + Date.now());

    res.json({
      success: true,
      message: 'Payment of ₹' + invoice.totalAmount + ' recorded successfully via ' + paymentMode,
      data: invoice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin Only)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryInvoices.findIndex(i => i._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    inMemoryInvoices.splice(index, 1);
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
