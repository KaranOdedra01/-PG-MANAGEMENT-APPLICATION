import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';
import { withTransaction } from '../utils/transaction.js';
import { escapeRegex, isValidObjectId, handleControllerError } from '../utils/sanitize.js';

// @desc    Get Invoices with Pagination, Search & Role Protection
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const role = req.user.role;
    const { status, month, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    // Auto-flag overdue invoices: any pending invoice past due date becomes overdue
    if (role !== 'tenant') {
      await Invoice.updateMany(
        { status: 'pending', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } }
      );
    } else {
      // For tenant, only flag their own
      await Invoice.updateMany(
        { tenantId: req.user._id, status: 'pending', dueDate: { $lt: new Date() } },
        { $set: { status: 'overdue' } }
      );
    }

    const query = {};

    // IDOR Protection: Tenants can ONLY see their own invoices
    if (role === 'tenant') {
      query.tenantId = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (month && month !== 'all') {
      query.month = { $regex: escapeRegex(month), $options: 'i' };
    }

    if (search) {
      const q = escapeRegex(search);
      query.$or = [
        { tenantName: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } },
        { invoiceNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ dueDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch invoices');
  }
};


// @desc    Get Single Invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // IDOR Protection: Tenants can only view their own invoice
    if (req.user.role === 'tenant' && invoice.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own invoices'
      });
    }

    return res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to fetch invoice');
  }
};

// @desc    Create Single Invoice (Server-calculated totalAmount)
// @route   POST /api/invoices
// @access  Private (Admin Only)
export const createInvoice = async (req, res) => {
  try {
    const { 
      tenantId, 
      month, 
      baseRent, 
      electricityCharge = 0, 
      maintenanceFee = 0, 
      messFee = 0,
      lateFee = 0,
      discount = 0,
      dueDate 
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    // Find tenant details authoritatively without fake defaults
    let tenantUser = null;
    let tRecord = null;

    if (isValidObjectId(tenantId)) {
      tenantUser = await User.findById(tenantId);
      if (!tenantUser) {
        tRecord = await Tenant.findById(tenantId);
      }
      if (!tenantUser && !tRecord) {
        tRecord = await Tenant.findOne({ userId: tenantId });
      }
    }

    if (!tenantUser && !tRecord) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    let tenantName = '';
    let roomNumber = '';
    let targetUserId = null;

    if (tenantUser) {
      tenantName = tenantUser.name;
      roomNumber = tenantUser.roomNumber;
      targetUserId = tenantUser._id;
    } else if (tRecord) {
      tenantName = tRecord.name;
      roomNumber = tRecord.roomNumber;
      targetUserId = tRecord.userId;
    }

    if (!roomNumber && targetUserId) {
      const activeTenant = await Tenant.findOne({ userId: targetUserId, status: 'active' });
      if (activeTenant) {
        roomNumber = activeTenant.roomNumber;
      }
    }

    if (!roomNumber) {
      return res.status(400).json({ success: false, message: 'Cannot create invoice: Tenant has no assigned room' });
    }

    const calculatedTotal = Math.max(0, 
      Number(baseRent) + 
      Number(electricityCharge) + 
      Number(maintenanceFee) + 
      Number(messFee) + 
      Number(lateFee) - 
      Number(discount)
    );

    const invoice = await Invoice.create({
      tenantId: targetUserId,
      tenantName,
      roomNumber,
      month: month.trim(),
      baseRent: Number(baseRent),
      electricityCharge: Number(electricityCharge),
      maintenanceFee: Number(maintenanceFee),
      messFee: Number(messFee),
      lateFee: Number(lateFee),
      discount: Number(discount),
      totalAmount: calculatedTotal,
      status: 'pending',
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      paidDate: null,
      paymentMode: 'Pending'
    });

    await Notification.create({
      recipient: targetUserId,
      type: 'invoice',
      title: `New Rent Invoice: ${month}`,
      message: `Rent invoice #${invoice.invoiceNumber || invoice._id} for ${month} of ₹${calculatedTotal.toLocaleString()} has been generated. Due date: ${new Date(invoice.dueDate).toLocaleDateString()}.`,
      link: '/invoices'
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      description: `Created invoice ${invoice.invoiceNumber || invoice._id} for ${tenantName} (₹${calculatedTotal})`
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create invoice');
  }
};

// @desc    Generate Invoices for All Active Tenants for a Month
// @route   POST /api/invoices/generate-monthly
// @access  Private (Admin Only)
export const generateMonthlyInvoices = async (req, res) => {
  try {
    const { 
      month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), 
      electricityCharge = 500, 
      maintenanceFee = 200, 
      messFee = 0,
      dueDate 
    } = req.body;

    const activeTenants = await Tenant.find({ status: 'active', isActive: true });
    if (activeTenants.length === 0) {
      return res.status(400).json({ success: false, message: 'No active tenants found to bill' });
    }

    const generated = [];
    const defaultDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

    for (const tenant of activeTenants) {
      // Check if invoice already exists for this tenant & month
      const exists = await Invoice.findOne({
        tenantId: tenant.userId,
        month: { $regex: new RegExp(`^${month.trim()}$`, 'i') }
      });

      if (!exists) {
        const baseRent = Number(tenant.monthlyRent) || 7500;
        const totalAmount = Math.max(0, baseRent + Number(electricityCharge) + Number(maintenanceFee) + Number(messFee));

        const inv = await Invoice.create({
          tenantId: tenant.userId,
          tenantName: tenant.name,
          roomNumber: tenant.roomNumber,
          month: month.trim(),
          baseRent,
          electricityCharge: Number(electricityCharge),
          maintenanceFee: Number(maintenanceFee),
          messFee: Number(messFee),
          totalAmount,
          status: 'pending',
          dueDate: defaultDueDate,
          paidDate: null,
          paymentMode: 'Pending'
        });

        await Notification.create({
          recipient: tenant.userId,
          type: 'invoice',
          title: `Monthly Invoice: ${month}`,
          message: `Rent invoice of ₹${totalAmount.toLocaleString()} generated for ${month}. Due on ${defaultDueDate.toLocaleDateString()}.`,
          link: '/invoices'
        });

        generated.push(inv);
      }
    }

    await logActivity({
      user: req.user,
      action: 'GENERATE_MONTHLY_INVOICES',
      entity: 'Invoice',
      description: `Generated ${generated.length} monthly invoices for ${month}`
    });

    return res.status(201).json({
      success: true,
      message: `Generated ${generated.length} monthly invoices for ${month}`,
      data: generated
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to generate monthly invoices');
  }
};

// @desc    Record Invoice Payment (Offline, UPI, Cash, Bank Transfer)
// @route   PATCH /api/invoices/:id/pay
// @access  Private (Admin & Staff Only)
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode = 'UPI', transactionId = '', amountPaid } = req.body;

    // Strict Authorization: Tenants cannot record payment
    if (req.user.role === 'tenant') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Only admin and staff can record invoice payments'
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (invoice.status === 'paid') {
      return res.status(400).json({ success: false, message: 'This invoice has already been fully paid' });
    }

    // Payment status calculation
    const paidAmount = amountPaid !== undefined ? Number(amountPaid) : invoice.totalAmount;
    if (paidAmount < 0) {
      return res.status(400).json({ success: false, message: 'Payment amount cannot be negative' });
    }

    if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partially_paid';
    }

    invoice.paidDate = new Date();
    invoice.paymentMode = paymentMode;
    invoice.transactionId = transactionId || (`TXN-${Date.now()}`);
    await invoice.save();

    await Notification.create({
      recipient: invoice.tenantId,
      type: 'payment',
      title: 'Payment Recorded!',
      message: `Your payment of ₹${paidAmount.toLocaleString()} for ${invoice.month} was recorded via ${paymentMode}. Status: ${invoice.status.toUpperCase()}.`,
      link: '/invoices'
    });

    await logActivity({
      user: req.user,
      action: 'RECORD_PAYMENT',
      entity: 'Invoice',
      entityId: invoice._id,
      description: `Payment of ₹${paidAmount} recorded for ${invoice.tenantName} (${paymentMode})`
    });

    return res.json({
      success: true,
      message: `Payment of ₹${paidAmount.toLocaleString()} recorded successfully via ${paymentMode}`,
      data: invoice
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to record payment');
  }
};

// @desc    Delete Invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin Only)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const invoice = await Invoice.findById(id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    await invoice.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_INVOICE',
      entity: 'Invoice',
      entityId: id,
      description: `Deleted invoice ${invoice.invoiceNumber || id} for ${invoice.tenantName}`
    });

    return res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete invoice');
  }
};
