import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';

// Valid complaint lifecycle state transition matrix
const validTransitions = {
  'open': ['assigned', 'in-progress'],
  'assigned': ['in-progress', 'waiting-for-parts', 'open'],
  'in-progress': ['waiting-for-parts', 'resolved'],
  'waiting-for-parts': ['in-progress', 'resolved'],
  'resolved': ['closed', 'in-progress'],
  'closed': ['open'] // only re-openable
};

// @desc    Get complaints with Pagination, Search & Role Protection
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    const role = req.user.role;
    const { status, priority, category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const query = {};

    // IDOR Protection: Tenants only see their own complaints
    if (role === 'tenant') {
      query.tenantId = req.user._id;
    }

    if (status && status !== 'all') {
      query.status = status;
    }
    if (priority && priority !== 'all') {
      query.priority = priority;
    }
    if (category && category !== 'all') {
      query.category = category;
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } },
        { ticketNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const total = await Complaint.countDocuments(query);
    const complaints = await Complaint.find(query)
      .populate('assignedStaffId', 'name email role phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      success: true,
      data: complaints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id).populate('assignedStaffId', 'name email role phone');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // IDOR Protection: Tenants can only view their own complaint
    if (req.user.role === 'tenant' && complaint.tenantId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own complaints'
      });
    }

    return res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raise a New Complaint
// @route   POST /api/complaints
// @access  Private (Tenants, Admin, Staff)
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category = 'other', priority = 'medium', roomNumber, attachments = [] } = req.body;

    let assignedRoom = roomNumber;
    if (!assignedRoom) {
      const tenant = await Tenant.findOne({ userId: req.user._id });
      assignedRoom = tenant?.roomNumber || req.user.roomNumber || 'General';
    }

    const complaint = await Complaint.create({
      tenantId: req.user._id,
      tenantName: req.user.name,
      roomNumber: assignedRoom,
      title: title.trim(),
      description: description.trim(),
      category: category.toLowerCase(),
      priority: priority.toLowerCase(),
      status: 'open',
      attachments,
      assignedTo: 'Unassigned',
      assignedStaffId: null
    });

    await logActivity({
      user: req.user,
      action: 'RAISE_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Raised complaint ticket #${complaint.ticketNumber || complaint._id}: ${complaint.title}`
    });

    return res.status(201).json({
      success: true,
      message: `Maintenance complaint ticket #${complaint.ticketNumber || complaint._id} logged successfully`,
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Complaint Status with Valid Lifecycle Transitions
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin & Staff)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote = '', actualCost = 0 } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Enforce valid lifecycle transitions (Admin can override)
    if (req.user.role !== 'admin') {
      const allowedNext = validTransitions[complaint.status] || [];
      if (!allowedNext.includes(status) && complaint.status !== status) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${complaint.status}' to '${status}'. Allowed transitions: ${allowedNext.join(', ')}`
        });
      }
    }

    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote.trim();
    if (actualCost !== undefined) complaint.actualCost = Number(actualCost);

    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }
    if (status === 'closed') {
      complaint.closedAt = new Date();
    }

    await complaint.save();

    // Notify Tenant
    await Notification.create({
      recipient: complaint.tenantId,
      type: 'complaint',
      title: `Complaint Status Update: ${status.toUpperCase()}`,
      message: `Your complaint #${complaint.ticketNumber || complaint._id} is now ${status}. ${resolutionNote ? `Note: ${resolutionNote}` : ''}`,
      link: '/complaints'
    });

    await logActivity({
      user: req.user,
      action: 'UPDATE_COMPLAINT_STATUS',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Updated complaint #${complaint.ticketNumber || complaint._id} status to ${status}`
    });

    return res.json({
      success: true,
      message: `Complaint status updated to ${status}`,
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign Staff to Complaint with Strict User Verification
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin & Staff)
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedStaffId } = req.body;

    if (!assignedStaffId) {
      return res.status(400).json({
        success: false,
        message: 'assignedStaffId is required'
      });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    const staffUser = await User.findById(assignedStaffId);
    if (!staffUser || (staffUser.role !== 'staff' && staffUser.role !== 'admin') || !staffUser.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must be an active staff or administrator'
      });
    }

    complaint.assignedStaffId = staffUser._id;
    complaint.assignedTo = staffUser.name;
    complaint.assignedAt = new Date();
    if (complaint.status === 'open') {
      complaint.status = 'assigned';
    }

    await complaint.save();

    // Notify Tenant
    await Notification.create({
      recipient: complaint.tenantId,
      type: 'complaint',
      title: 'Complaint Assigned',
      message: `Your complaint #${complaint.ticketNumber || complaint._id} has been assigned to ${staffName}.`,
      link: '/complaints'
    });

    await logActivity({
      user: req.user,
      action: 'ASSIGN_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Assigned complaint #${complaint.ticketNumber || complaint._id} to ${staffName}`
    });

    return res.json({
      success: true,
      message: `Complaint assigned to ${staffName}`,
      data: complaint
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin Only)
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = await Complaint.findById(id);

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    await complaint.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_COMPLAINT',
      entity: 'Complaint',
      entityId: id,
      description: `Deleted complaint #${complaint.ticketNumber || id}`
    });

    return res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
