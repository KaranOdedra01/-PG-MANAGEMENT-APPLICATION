import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import Tenant from '../models/Tenant.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all complaints (Admins/Staff see all, Tenants see only own)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    const role = req.user.role;
    const { status, priority, category, search } = req.query;
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

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: complaints.length,
      data: complaints
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
    const complaint = await Complaint.findById(id);

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
      assignedTo: 'Unassigned',
      resolutionNote: '',
      attachments: Array.isArray(attachments) ? attachments : []
    });

    // Notify Admins & Staff
    const adminsAndStaff = await User.find({ role: { $in: ['admin', 'staff'] } });
    for (const admin of adminsAndStaff) {
      await Notification.create({
        recipient: admin._id,
        type: 'complaint',
        title: `New [${priority.toUpperCase()}] Complaint: ${complaint.title}`,
        message: `${req.user.name} from Room #${assignedRoom} raised a ${category} complaint.`,
        link: '/complaints'
      });
    }

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

// @desc    Update Complaint Status
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

    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote.trim();
    if (actualCost) complaint.actualCost = Number(actualCost);

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

// @desc    Assign Staff to Complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin & Staff)
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo, assignedStaffId } = req.body;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedTo = assignedTo.trim();
    if (assignedStaffId) complaint.assignedStaffId = assignedStaffId;
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
      message: `Your complaint #${complaint.ticketNumber || complaint._id} has been assigned to ${complaint.assignedTo}.`,
      link: '/complaints'
    });

    await logActivity({
      user: req.user,
      action: 'ASSIGN_COMPLAINT',
      entity: 'Complaint',
      entityId: complaint._id,
      description: `Assigned complaint #${complaint.ticketNumber || complaint._id} to ${complaint.assignedTo}`
    });

    return res.json({
      success: true,
      message: `Complaint assigned to ${complaint.assignedTo}`,
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
