import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import Complaint from '../models/Complaint.js';
import Expense from '../models/Expense.js';
import Notice from '../models/Notice.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import ActivityLog from '../models/ActivityLog.js';

// @desc    Get Role-Tailored Dashboard Metrics (Pure MongoDB Aggregation)
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    if (role === 'admin') {
      // 1. Rooms & Occupancy
      const rooms = await Room.find();
      const totalRooms = rooms.length;
      const totalBeds = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0);
      const occupiedBeds = rooms.reduce((sum, r) => sum + (r.occupiedBeds || 0), 0);
      const availableBeds = Math.max(0, totalBeds - occupiedBeds);
      const occupancyRate = totalBeds > 0 ? Number(((occupiedBeds / totalBeds) * 100).toFixed(1)) : 0;

      const roomTypes = {
        single: rooms.filter(r => r.type === 'single').length,
        double: rooms.filter(r => r.type === 'double').length,
        triple: rooms.filter(r => r.type === 'triple').length,
        dormitory: rooms.filter(r => r.type === 'dormitory').length,
      };

      // 2. Financials
      const invoices = await Invoice.find();
      const totalRevenueCollected = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const totalPendingDues = invoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue' || inv.status === 'partially_paid')
        .reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);

      const expenses = await Expense.find();
      const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalRevenueCollected - totalExpenses;

      // 3. Complaints
      const complaints = await Complaint.find();
      const totalComplaints = complaints.length;
      const openComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;
      const highPriorityComplaints = complaints.filter(c => (c.priority === 'high' || c.priority === 'urgent') && c.status !== 'resolved' && c.status !== 'closed').length;

      // 4. Counts
      const totalTenants = await Tenant.countDocuments({ status: 'active' });
      const totalStaff = await User.countDocuments({ role: 'staff', isActive: true });

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
      const tenant = await Tenant.findOne({ userId });
      const myInvoices = await Invoice.find({ tenantId: userId }).sort({ dueDate: -1 });
      const latestInvoice = myInvoices[0] || null;
      const totalPending = myInvoices
        .filter(i => i.status !== 'paid')
        .reduce((s, i) => s + (i.totalAmount || 0), 0);

      const myComplaints = await Complaint.find({ tenantId: userId }).sort({ createdAt: -1 });
      const activeCount = myComplaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length;

      let myRoom = null;
      if (tenant?.roomId) {
        myRoom = await Room.findById(tenant.roomId);
      } else if (req.user.roomId) {
        myRoom = await Room.findById(req.user.roomId);
      }

      const latestNotices = await Notice.find({ targetRoles: { $in: ['all', 'tenant'] } })
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(3);

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
      const assignedComplaints = await Complaint.find({
        $or: [
          { assignedStaffId: userId },
          { assignedTo: { $regex: req.user.name || 'Staff', $options: 'i' } },
          { status: { $in: ['open', 'assigned', 'in-progress', 'waiting-for-parts'] } }
        ]
      }).sort({ priority: -1, createdAt: -1 });

      const roomsUnderMaintenance = await Room.countDocuments({ status: 'maintenance' });
      const totalRooms = await Room.countDocuments();

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

    // Fallback if no logs yet: fetch latest real DB events
    const latestInvoices = await Invoice.find({ status: 'paid' }).sort({ paidDate: -1 }).limit(2);
    const latestComplaints = await Complaint.find().sort({ createdAt: -1 }).limit(2);
    const latestNotices = await Notice.find().sort({ createdAt: -1 }).limit(2);
    const latestTenants = await Tenant.find({ status: 'active' }).sort({ checkInDate: -1 }).limit(2);

    const fallbackList = [];
    latestInvoices.forEach(i => {
      fallbackList.push({
        id: i._id.toString(),
        type: 'payment',
        title: `Rent Payment: ₹${i.totalAmount.toLocaleString()}`,
        description: `${i.tenantName} paid for ${i.month} via ${i.paymentMode}`,
        timestamp: i.paidDate ? new Date(i.paidDate).toLocaleString() : 'Recently',
        tag: 'Finance'
      });
    });

    latestComplaints.forEach(c => {
      fallbackList.push({
        id: c._id.toString(),
        type: 'complaint',
        title: `Complaint: ${c.title}`,
        description: `${c.tenantName} (Room ${c.roomNumber}) - ${c.category}`,
        timestamp: new Date(c.createdAt).toLocaleString(),
        tag: 'Maintenance'
      });
    });

    latestNotices.forEach(n => {
      fallbackList.push({
        id: n._id.toString(),
        type: 'notice',
        title: `Notice: ${n.title}`,
        description: n.content.substring(0, 60) + '...',
        timestamp: new Date(n.createdAt).toLocaleString(),
        tag: 'Announcement'
      });
    });

    latestTenants.forEach(t => {
      fallbackList.push({
        id: t._id.toString(),
        type: 'checkin',
        title: `Tenant Checked In: ${t.name}`,
        description: `Assigned to Room #${t.roomNumber}`,
        timestamp: new Date(t.checkInDate).toLocaleString(),
        tag: 'Occupancy'
      });
    });

    return res.json({
      success: true,
      data: fallbackList
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
