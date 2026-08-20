import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import Expense from '../models/Expense.js';
import Complaint from '../models/Complaint.js';
import Tenant from '../models/Tenant.js';
import Visitor from '../models/Visitor.js';

// @desc    Get Consolidated Executive Summary (Pure MongoDB Aggregations)
// @route   GET /api/reports/summary
// @access  Private (Admin Only)
export const getExecutiveSummary = async (req, res) => {
  try {
    const rooms = await Room.find();
    const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
    const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedBeds || 0), 0);
    const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

    const invoices = await Invoice.find();
    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const pendingDues = invoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const expenses = await Expense.find();
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    const complaints = await Complaint.find();
    const totalComplaints = complaints.length;
    const resolvedComplaints = complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length;
    const resolutionRate = totalComplaints > 0 ? Number(((resolvedComplaints / totalComplaints) * 100).toFixed(1)) : 100;

    const activeTenants = await Tenant.countDocuments({ status: 'active' });
    const totalVisitorsLogged = await Visitor.countDocuments();

    return res.json({
      success: true,
      data: {
        occupancy: {
          totalRooms: rooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: Math.max(0, totalBeds - occupiedBeds),
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
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Financial P&L Statement
// @route   GET /api/reports/financial
// @access  Private (Admin Only)
export const getFinancialReport = async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    const expenses = await Expense.find().sort({ date: -1 });

    const totalRevenue = invoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    return res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        invoices,
        expenses
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Occupancy & Bed Utilization Audit
// @route   GET /api/reports/occupancy
// @access  Private (Admin Only)
export const getOccupancyReport = async (req, res) => {
  try {
    const rooms = await Room.find().sort({ floor: 1, roomNumber: 1 });
    const tenants = await Tenant.find({ status: 'active' });

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
        rooms: roomBreakdown,
        tenants
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
