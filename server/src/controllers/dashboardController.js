import mongoose from 'mongoose';
import Room from '../models/Room.js';
import Invoice from '../models/Invoice.js';
import Complaint from '../models/Complaint.js';
import { 
  inMemoryUsers, 
  inMemoryRooms, 
  inMemoryInvoices, 
  inMemoryComplaints, 
  inMemoryNotices, 
  inMemoryExpenses 
} from '../utils/inMemoryStore.js';

// @desc    Get Role-Tailored Dashboard Metrics
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id ? req.user._id.toString() : '';

    if (role === 'admin') {
      // Aggregate room occupancy
      const totalRooms = inMemoryRooms.length;
      const totalBeds = inMemoryRooms.reduce((sum, r) => sum + r.capacity, 0);
      const occupiedBeds = inMemoryRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
      const availableBeds = totalBeds - occupiedBeds;
      const occupancyRate = totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(1) : 0;

      // Financials
      const totalRevenueCollected = inMemoryInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const totalPendingDues = inMemoryInvoices
        .filter(inv => inv.status === 'pending' || inv.status === 'overdue')
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const totalExpenses = inMemoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalRevenueCollected - totalExpenses;

      // Complaints
      const totalComplaints = inMemoryComplaints.length;
      const openComplaints = inMemoryComplaints.filter(c => c.status !== 'resolved').length;
      const highPriorityComplaints = inMemoryComplaints.filter(c => (c.priority === 'high' || c.priority === 'urgent') && c.status !== 'resolved').length;

      // Room Type breakdown
      const roomTypes = {
        single: inMemoryRooms.filter(r => r.type === 'single').length,
        double: inMemoryRooms.filter(r => r.type === 'double').length,
        triple: inMemoryRooms.filter(r => r.type === 'triple').length,
        dormitory: inMemoryRooms.filter(r => r.type === 'dormitory').length,
      };

      return res.json({
        success: true,
        data: {
          role: 'admin',
          occupancy: {
            totalRooms,
            totalBeds,
            occupiedBeds,
            availableBeds,
            occupancyRate: Number(occupancyRate)
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
          totalTenants: inMemoryUsers.filter(u => u.role === 'tenant').length,
          totalStaff: inMemoryUsers.filter(u => u.role === 'staff').length
        }
      });
    }

    if (role === 'tenant') {
      // Tenant-specific stats
      const myInvoices = inMemoryInvoices.filter(inv => inv.tenantId === userId);
      const latestInvoice = myInvoices[0] || null;
      const myComplaints = inMemoryComplaints.filter(c => c.tenantId === userId);
      const myRoom = inMemoryRooms.find(r => r._id === req.user.roomId || r.tenants?.includes(userId)) || inMemoryRooms[1];

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
            totalPending: myInvoices.filter(i => i.status === 'pending').reduce((s, i) => s + i.totalAmount, 0),
            allPaid: myInvoices.every(i => i.status === 'paid')
          },
          complaints: {
            totalRaised: myComplaints.length,
            activeCount: myComplaints.filter(c => c.status !== 'resolved').length
          },
          latestNotices: inMemoryNotices.slice(0, 2)
        }
      });
    }

    if (role === 'staff') {
      // Staff-specific stats
      const assignedComplaints = inMemoryComplaints.filter(c => c.assignedTo.includes('Ramesh') || c.status !== 'resolved');
      return res.json({
        success: true,
        data: {
          role: 'staff',
          maintenance: {
            assignedTasks: assignedComplaints.length,
            highPriority: assignedComplaints.filter(c => c.priority === 'high').length,
            pendingTasks: assignedComplaints
          },
          roomsUnderMaintenance: inMemoryRooms.filter(r => r.status === 'maintenance').length,
          totalRooms: inMemoryRooms.length
        }
      });
    }

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Recent Activities & Feed
// @route   GET /api/dashboard/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    const activities = [
      {
        id: 'act_1',
        type: 'payment',
        title: 'Rent Received',
        description: 'Priya Patel paid ₹10,300 for August Rent via Bank Transfer',
        timestamp: '2 hours ago',
        tag: 'Finance'
      },
      {
        id: 'act_2',
        type: 'complaint',
        title: 'New Complaint Logged',
        description: 'WiFi speed issue reported by Room 101',
        timestamp: '5 hours ago',
        tag: 'Maintenance'
      },
      {
        id: 'act_3',
        type: 'notice',
        title: 'Notice Broadcasted',
        description: 'Water Tank Cleaning Scheduled for Saturday',
        timestamp: '1 day ago',
        tag: 'Announcement'
      },
      {
        id: 'act_4',
        type: 'checkin',
        title: 'New Tenant Checked In',
        description: 'Aman Verma assigned to Room 102 (Double Sharing)',
        timestamp: '2 days ago',
        tag: 'Occupancy'
      }
    ];

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
