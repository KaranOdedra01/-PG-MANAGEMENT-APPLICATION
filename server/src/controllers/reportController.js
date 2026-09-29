import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Complaint from '../models/Complaint.js';
import Tenant from '../models/Tenant.js';
import Visitor from '../models/Visitor.js';
import { handleControllerError } from '../utils/sanitize.js';

// @desc    Get Consolidated Executive Summary (Pure MongoDB Aggregations)
// @route   GET /api/reports/summary
// @access  Private (Admin Only)
export const getExecutiveSummary = async (req, res) => {
  try {
    // 1. Room Occupancy Aggregation Pipeline
    const [roomAgg] = await Room.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          totalBeds: { $sum: '$capacity' },
          occupiedBeds: { $sum: '$occupiedBeds' }
        }
      }
    ]);

    const totalRooms = roomAgg?.totalRooms || 0;
    const totalBeds = roomAgg?.totalBeds || 0;
    const occupiedBeds = roomAgg?.occupiedBeds || 0;
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    // 2. Invoices Financial Aggregation Pipeline
    const invoiceAgg = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    let totalRevenue = 0;
    let pendingDues = 0;
    invoiceAgg.forEach(item => {
      if (item._id === 'paid') {
        totalRevenue += item.totalAmount;
      } else {
        pendingDues += item.totalAmount;
      }
    });

    // 3. Expenses Aggregation Pipeline
    const [expenseAgg] = await Expense.aggregate([
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: '$amount' }
        }
      }
    ]);

    const totalExpenses = expenseAgg?.totalExpenses || 0;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    // 4. Complaints Aggregation Pipeline
    const complaintAgg = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    let totalComplaints = 0;
    let resolvedComplaints = 0;
    complaintAgg.forEach(c => {
      totalComplaints += c.count;
      if (c._id === 'resolved' || c._id === 'closed') {
        resolvedComplaints += c.count;
      }
    });
    const resolutionRate = totalComplaints > 0 ? Number(((resolvedComplaints / totalComplaints) * 100).toFixed(1)) : 100;

    // 5. Operations Count
    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const totalVisitorsLogged = await Visitor.countDocuments();

    return res.json({
      success: true,
      data: {
        occupancy: {
          totalRooms,
          totalBeds,
          occupiedBeds,
          availableBeds,
          occupancyRate
        },
        financials: {
          totalRevenue,
          pendingDues,
          totalExpenses,
          netProfit,
          profitMargin
        },
        operations: {
          activeTenants,
          totalComplaints,
          resolvedComplaints,
          resolutionRate,
          totalVisitorsLogged
        }
      }
    });
  } catch (error) {
    return handleControllerError(res, error, 'generating executive summary');
  }
};

// @desc    Get Detailed Financial P&L Statement (MongoDB Aggregations)
// @route   GET /api/reports/financial
// @access  Private (Admin Only)
export const getFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    const invDateFilter = {};
    const expDateFilter = {};

    if (startDate || endDate) {
      let start, end;
      if (startDate) {
        if (/^\d{4}-\d{2}$/.test(startDate)) {
          const [y, m] = startDate.split('-').map(Number);
          start = new Date(y, m - 1, 1, 0, 0, 0);
        } else {
          start = new Date(startDate);
        }
      }
      if (endDate) {
        if (/^\d{4}-\d{2}$/.test(endDate)) {
          const [y, m] = endDate.split('-').map(Number);
          end = new Date(y, m, 0, 23, 59, 59, 999);
        } else {
          end = new Date(endDate);
        }
      }

      if (start) {
        invDateFilter.$gte = start;
        expDateFilter.$gte = start;
      }
      if (end) {
        invDateFilter.$lte = end;
        expDateFilter.$lte = end;
      }
    }

    const invoiceMatch = { status: 'paid' };
    if (Object.keys(invDateFilter).length > 0) {
      invoiceMatch.createdAt = invDateFilter;
    }

    const expenseMatch = {};
    if (Object.keys(expDateFilter).length > 0) {
      expenseMatch.date = expDateFilter;
    }

    // 1. Revenue by Month Aggregation
    const monthlyRevenue = await Invoice.aggregate([
      { $match: invoiceMatch },
      {
        $group: {
          _id: '$month',
          revenue: { $sum: '$totalAmount' },
          invoiceCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // 2. Expenses by Category Aggregation
    const expensesByCategory = await Expense.aggregate([
      ...(Object.keys(expenseMatch).length > 0 ? [{ $match: expenseMatch }] : []),
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    // 3. Totals
    const [revTotal] = await Invoice.aggregate([
      { $match: invoiceMatch },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const [expTotal] = await Expense.aggregate([
      ...(Object.keys(expenseMatch).length > 0 ? [{ $match: expenseMatch }] : []),
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalRevenue = revTotal?.total || 0;
    const totalExpenses = expTotal?.total || 0;
    const netProfit = totalRevenue - totalExpenses;

    const dataLimit = Math.min(500, Math.max(1, parseInt(limit, 10) || 200));
    const invQuery = Object.keys(invDateFilter).length > 0 ? { createdAt: invDateFilter } : {};
    const expQuery = Object.keys(expDateFilter).length > 0 ? { date: expDateFilter } : {};

    const invoices = await Invoice.find(invQuery).sort({ createdAt: -1 }).limit(dataLimit);
    const expenses = await Expense.find(expQuery).sort({ date: -1 }).limit(dataLimit);

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        monthlyRevenue,
        expensesByCategory,
        invoices,
        expenses
      }
    });
  } catch (error) {
    return handleControllerError(res, error, 'generating financial report');
  }
};

// @desc    Get Occupancy & Bed Utilization Audit (MongoDB Aggregations)
// @route   GET /api/reports/occupancy
// @access  Private (Admin Only)
export const getOccupancyReport = async (req, res) => {
  try {
    // Floor-wise Occupancy Pipeline
    const floorOccupancy = await Room.aggregate([
      {
        $group: {
          _id: '$floor',
          totalRooms: { $sum: 1 },
          totalCapacity: { $sum: '$capacity' },
          occupiedBeds: { $sum: '$occupiedBeds' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
    const tenants = await Tenant.find({ status: 'active' }).populate('roomId', 'roomNumber type');

    const roomBreakdown = rooms.map(r => {
      const rate = r.capacity > 0 ? Math.round(((r.occupiedBeds || 0) / r.capacity) * 100) : 0;
      return {
        roomNumber: r.roomNumber,
        floor: r.floor,
        type: r.type,
        capacity: r.capacity,
        occupiedBeds: r.occupiedBeds || 0,
        availableBeds: Math.max(0, r.capacity - (r.occupiedBeds || 0)),
        occupancyRate: rate,
        rent: r.rent,
        status: r.status
      };
    });

    return res.json({
      success: true,
      data: {
        floorOccupancy,
        rooms: roomBreakdown,
        tenants
      }
    });
  } catch (error) {
    return handleControllerError(res, error, 'generating occupancy report');
  }
};
