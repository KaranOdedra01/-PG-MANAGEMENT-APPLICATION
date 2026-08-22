import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import Complaint from '../models/Complaint.js';
import Expense from '../models/Expense.js';
import Notice from '../models/Notice.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get Role-Tailored Dashboard Metrics (Optimized MongoDB Aggregations)
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'admin') {
      // 1. Rooms & Occupancy Pipeline
      const [roomAgg] = await Room.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            totalBeds: { $sum: '$capacity' },
            occupiedBeds: { $sum: '$occupiedBeds' },
            single: { $sum: { $cond: [{ $eq: ['$type', 'single'] }, 1, 0] } },
            double: { $sum: { $cond: [{ $eq: ['$type', 'double'] }, 1, 0] } },
            triple: { $sum: { $cond: [{ $eq: ['$type', 'triple'] }, 1, 0] } },
            dormitory: { $sum: { $cond: [{ $eq: ['$type', 'dormitory'] }, 1, 0] } }
          }
        }
      ]);

      const totalRooms = roomAgg?.totalRooms || 0;
      const totalBeds = roomAgg?.totalBeds || 0;
      const occupiedBeds = roomAgg?.occupiedBeds || 0;
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);
      const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

      const roomTypes = {
        single: roomAgg?.single || 0,
        double: roomAgg?.double || 0,
        triple: roomAgg?.triple || 0,
        dormitory: roomAgg?.dormitory || 0
      };

      // 2. Financials Pipelines
      const invoiceAgg = await Invoice.aggregate([
        {
          $group: {
            _id: '$status',
            total: { $sum: '$totalAmount' }
          }
        }
      ]);

      let totalRevenueCollected = 0;
      let totalPendingDues = 0;
      invoiceAgg.forEach(inv => {
        if (inv._id === 'paid') {
          totalRevenueCollected += inv.total;
        } else {
          totalPendingDues += inv.total;
        }
      });

      const [expenseAgg] = await Expense.aggregate([
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' }
          }
        }
      ]);
      const totalExpenses = expenseAgg?.totalExpenses || 0;
      const netProfit = totalRevenueCollected - totalExpenses;

      // 3. Complaints & Counts (Parallel countDocuments)
      const [
        totalComplaints,
        openComplaints,
        highPriorityComplaints,
        totalTenants,
        totalStaff
      ] = await Promise.all([
        Complaint.countDocuments(),
        Complaint.countDocuments({ status: { $nin: ['resolved', 'closed'] } }),
        Complaint.countDocuments({ priority: { $in: ['high', 'urgent'] }, status: { $nin: ['resolved', 'closed'] } }),
        Tenant.countDocuments({ status: 'active', isActive: true }),
        User.countDocuments({ role: 'staff', isActive: true })
      ]);

      return res.json({
        success: true,
        data: {
          role: 'admin',
          occupancy: {
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyRate
          },
          financials: {
            revenueCollected: totalRevenueCollected,
            pendingDues: totalPendingDues,
            totalExpenses,
            netProfit,
            currency: '₹'
          },
          complaints: {
            total: totalComplaints,
            open: openComplaints,
            highPriority: highPriorityComplaints
          },
          roomTypes,
          totalTenants,
          totalStaff
        }
      });
    }

    if (role === 'tenant') {
      const [tenant, myInvoices, myComplaints, latestNotices] = await Promise.all([
        Tenant.findOne({ userId, isActive: true }),
        Invoice.find({ tenantId: userId }).sort({ dueDate: -1 }).limit(10),
        Complaint.find({ tenantId: userId }).sort({ createdAt: -1 }).limit(10),
        Notice.find({ targetRoles: { $in: ['all', 'tenant'] } }).sort({ isPinned: -1, createdAt: -1 }).limit(3)
      ]);

      const latestInvoice = myInvoices[0] || null;
      const totalPending = myInvoices
        .filter(i => i.status !== 'paid')
        .reduce((s, i) => s + (i.totalAmount || 0), 0);

      const activeCount = myComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;

      let myRoom = null;
      const roomId = tenant?.roomId || req.user.roomId;
      if (roomId) {
        myRoom = await Room.findById(roomId).select('roomNumber type floor rent amenities');
      }

      return res.json({
        success: true,
        data: {
          role: 'tenant',
          room: myRoom ? {
            roomNumber: myRoom.roomNumber,
            type: myRoom.type,
            floor: myRoom.floor,
            rent: myRoom.rent,
            amenities: myRoom.amenities
          } : null,
          invoiceSummary: {
            latestInvoice,
            totalPending,
            allPaid: myInvoices.length > 0 && myInvoices.every(i => i.status === 'paid')
          },
          complaints: {
            totalRaised: myComplaints.length,
            activeCount
          },
          latestNotices
        }
      });
    }

    if (role === 'staff') {
      const [assignedComplaints, roomsUnderMaintenance, totalRooms] = await Promise.all([
        Complaint.find({
          $or: [
            { assignedStaffId: userId },
            { status: { $in: ['open', 'assigned', 'in-progress', 'waiting-for-parts'] } }
          ]
        }).sort({ priority: -1, createdAt: -1 }).limit(15),
        Room.countDocuments({ status: 'maintenance' }),
        Room.countDocuments()
      ]);

      return res.json({
        success: true,
        data: {
          role: 'staff',
          maintenance: {
            assignedTasks: assignedComplaints.length,
            highPriority: assignedComplaints.filter(c => c.priority === 'high' || c.priority === 'urgent').length,
            pendingTasks: assignedComplaints.slice(0, 5)
          },
          roomsUnderMaintenance,
          totalRooms
        }
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid user role' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Real Recent Activities from MongoDB ActivityLog
// @route   GET /api/dashboard/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ createdAt: -1 }).limit(10);

    if (logs && logs.length > 0) {
      const formatted = logs.map(l => {
        let tag = 'General';
        let type = 'system';

        if (l.action.includes('PAYMENT') || l.entity === 'Invoice') {
          tag = 'Finance';
          type = 'payment';
        } else if (l.entity === 'Complaint') {
          tag = 'Maintenance';
          type = 'complaint';
        } else if (l.entity === 'Notice') {
          tag = 'Announcement';
          type = 'notice';
        } else if (l.action.includes('ONBOARD') || l.action.includes('TENANT') || l.entity === 'Room') {
          tag = 'Occupancy';
          type = 'checkin';
        }

        return {
          id: l._id.toString(),
          type,
          title: l.description,
          description: `By ${l.actor?.name || 'System'} (${l.actor?.role || 'system'})`,
          timestamp: new Date(l.createdAt).toLocaleString(),
          tag
        };
      });

      return res.json({
        success: true,
        data: formatted
      });
    }

    return res.json({
      success: true,
      data: []
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
