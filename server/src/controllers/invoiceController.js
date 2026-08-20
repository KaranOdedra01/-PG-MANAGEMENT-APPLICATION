import Invoice from '../models/Invoice.js';
import Tenant from '../models/Tenant.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get Invoices (Admin/Staff gets all with filters, Tenant gets only own)
// @route   GET /api/invoices
// @access  Private
export const getInvoices = async (req, res) => {
  try {
    const role = req.user.role;
    const { status, month, search } = req.query;
    const query = {};

    // IDOR Protection: Tenants can ONLY see their own invoices
    if (role === 'tenant') {
      query.tenantId = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }

    if (month && month !== 'all') {
      query.month = { $regex: month.trim(), $options: 'i' };
    }

    if (search) {
      const q = search.trim();
      query.$or = [
        { tenantName: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } },
        { invoiceNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const invoices = await Invoice.find(query).sort({ dueDate: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: invoices.length,
      data: invoices
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Invoice by ID
// @route   GET /api/invoices/:id
// @access  Private
export const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
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
    return res.status(500).json({ success: false, message: error.message });
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

    // Find tenant details
    const tenantUser = await User.findById(tenantId) || await Tenant.findOne({ userId: tenantId });
    let tenantName = 'Tenant Resident';
    let roomNumber = '101';
    let targetUserId = tenantId;

    if (tenantUser) {
      tenantName = tenantUser.name;
      roomNumber = tenantUser.roomNumber || '101';
      targetUserId = tenantUser._id || tenantUser.userId;
    }

    // Server-side calculation
    const totalAmount = Math.max(0, 
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
      totalAmount,
      status: 'pending',
      dueDate: new Date(dueDate),
      paidDate: null,
      paymentMode: 'Pending'
    });

    // In-app Notification for tenant
    await Notification.create({
      recipient: targetUserId,
      type: 'invoice',
      title: `New Rent Invoice for ${month}`,
      message: `Invoice of ₹${totalAmount.toLocaleString()} generated for Room #${roomNumber}. Due date: ${new Date(dueDate).toLocaleDateString()}.`,
      link: '/invoices'
    });

    await logActivity({
      user: req.user,
      action: 'CREATE_INVOICE',
      entity: 'Invoice',
      entityId: invoice._id,
      description: `Created invoice ${invoice.invoiceNumber || invoice._id} for ${tenantName} (₹${totalAmount})`
    });

    return res.status(201).json({
      success: true,
      message: 'Invoice generated successfully',
      data: invoice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
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

    const activeTenants = await Tenant.find({ status: 'active' });
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Record Invoice Payment
// @route   PATCH /api/invoices/:id/pay
// @access  Private (Admin, Staff, or Tenant)
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMode = 'UPI', transactionId = '' } = req.body;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    if (req.user.role === 'tenant' && invoice.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot record payment for another tenant\'s invoice' });
    }

    invoice.status = 'paid';
    invoice.paidDate = new Date();
    invoice.paymentMode = paymentMode;
    invoice.transactionId = transactionId || (`TXN-${Date.now()}`);
    await invoice.save();

    await Notification.create({
      recipient: invoice.tenantId,
      type: 'payment',
      title: 'Payment Received!',
      message: `Your payment of ₹${invoice.totalAmount.toLocaleString()} for ${invoice.month} was successfully recorded via ${paymentMode}.`,
      link: '/invoices'
    });

    await logActivity({
      user: req.user,
      action: 'RECORD_PAYMENT',
      entity: 'Invoice',
      entityId: invoice._id,
      description: `Payment of ₹${invoice.totalAmount} recorded for ${invoice.tenantName} (${paymentMode})`
    });

    return res.json({
      success: true,
      message: `Payment of ₹${invoice.totalAmount.toLocaleString()} recorded successfully via ${paymentMode}`,
      data: invoice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin Only)
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
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
    return res.status(500).json({ success: false, message: error.message });
  }
};
