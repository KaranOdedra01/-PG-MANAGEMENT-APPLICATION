const fs = require('fs');
const path = require('path');

const reportController = `import { inMemoryRooms, inMemoryUsers, inMemoryInvoices, inMemoryExpenses, inMemoryComplaints, inMemoryNotices } from '../utils/inMemoryStore.js';
import { inMemoryVisitors } from './visitorController.js';
import { inMemoryTenants } from './tenantController.js';

// @desc    Get Consolidated Executive Summary
// @route   GET /api/reports/summary
// @access  Private (Admin Only)
export const getExecutiveSummary = async (req, res) => {
  try {
    const totalBeds = inMemoryRooms.reduce((sum, r) => sum + r.capacity, 0);
    const occupiedBeds = inMemoryRooms.reduce((sum, r) => sum + (r.occupiedBeds || 0), 0);
    const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

    const totalRevenue = inMemoryInvoices
      .filter(i => i.status === 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const pendingDues = inMemoryInvoices
      .filter(i => i.status !== 'paid')
      .reduce((sum, i) => sum + (i.totalAmount || 0), 0);

    const totalExpenses = inMemoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;

    const totalComplaints = inMemoryComplaints.length;
    const resolvedComplaints = inMemoryComplaints.filter(c => c.status === 'resolved').length;
    const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 100;

    res.json({
      success: true,
      data: {
        occupancy: {
          totalRooms: inMemoryRooms.length,
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
          occupancyRate: Number(occupancyRate)
        },
        financials: {
          totalRevenue,
          pendingDues,
          totalExpenses,
          netProfit,
          profitMargin: totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0
        },
        operations: {
          activeTenants: inMemoryTenants.filter(t => t.status === 'active').length,
          totalComplaints,
          resolvedComplaints,
          resolutionRate: Number(resolutionRate),
          totalVisitorsLogged: inMemoryVisitors.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Detailed Financial P&L Statement
// @route   GET /api/reports/financial
// @access  Private (Admin Only)
export const getFinancialReport = async (req, res) => {
  try {
    const paidInvoices = inMemoryInvoices.filter(i => i.status === 'paid');
    const unpaidInvoices = inMemoryInvoices.filter(i => i.status !== 'paid');

    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    const totalExpenses = inMemoryExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        invoices: inMemoryInvoices,
        expenses: inMemoryExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Occupancy & Bed Utilization Audit
// @route   GET /api/reports/occupancy
// @access  Private (Admin Only)
export const getOccupancyReport = async (req, res) => {
  try {
    const roomBreakdown = inMemoryRooms.map(r => {
      const rate = r.capacity > 0 ? Math.round(((r.occupiedBeds || 0) / r.capacity) * 100) : 0;
      return {
        roomNumber: r.roomNumber,
        floor: r.floor,
        type: r.type,
        capacity: r.capacity,
        occupiedBeds: r.occupiedBeds || 0,
        availableBeds: r.capacity - (r.occupiedBeds || 0),
        occupancyRate: rate,
        rent: r.rent,
        status: r.status
      };
    });

    res.json({
      success: true,
      data: {
        rooms: roomBreakdown,
        tenants: inMemoryTenants
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
`;

const reportRoutes = `import express from 'express';
import {
  getExecutiveSummary,
  getFinancialReport,
  getOccupancyReport
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, authorize('admin'), getExecutiveSummary);
router.get('/financial', protect, authorize('admin'), getFinancialReport);
router.get('/occupancy', protect, authorize('admin'), getOccupancyReport);

export default router;
`;

fs.writeFileSync(path.join(__dirname, 'src/controllers/reportController.js'), reportController, 'utf8');
fs.writeFileSync(path.join(__dirname, 'src/routes/reportRoutes.js'), reportRoutes, 'utf8');
console.log('Successfully generated Report & Analytics backend files!');
