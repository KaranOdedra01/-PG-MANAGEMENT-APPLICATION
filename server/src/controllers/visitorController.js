import Visitor from '../models/Visitor.js';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all visitor logs
// @route   GET /api/visitors
// @access  Private (Admin & Staff)
export const getVisitors = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (type && type !== 'all') {
      query.visitorType = { $regex: new RegExp(`^${type.trim()}$`, 'i') };
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { tenantName: { $regex: q, $options: 'i' } },
        { roomNumber: { $regex: q, $options: 'i' } },
        { vehicleNumber: { $regex: q, $options: 'i' } }
      ];
    }

    const visitors = await Visitor.find(query).sort({ entryTime: -1 });

    return res.json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Active Visitors currently inside
// @route   GET /api/visitors/active
// @access  Private
export const getActiveVisitors = async (req, res) => {
  try {
    const inside = await Visitor.find({ status: 'inside' }).sort({ entryTime: -1 });
    const lateNight = inside.filter(v => v.isLateNight);

    return res.json({
      success: true,
      data: {
        totalCurrentlyInside: inside.length,
        lateNightActive: lateNight.length,
        insideVisitors: inside
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-in New Visitor
// @route   POST /api/visitors
// @access  Private (Admin & Staff)
export const checkinVisitor = async (req, res) => {
  try {
    const { name, phone, visitorType = 'Friend', tenantName, roomNumber, purpose = 'Visit', vehicleNumber = '' } = req.body;

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 21 || currentHour < 6; // 9:00 PM to 6:00 AM

    // Find host tenant if available
    let hostTenantId = null;
    let hostName = tenantName;
    if (roomNumber) {
      const hostUser = await User.findOne({ roomNumber: roomNumber.trim(), role: 'tenant' });
      if (hostUser) {
        hostTenantId = hostUser._id;
        if (!hostName) hostName = hostUser.name;
      }
    }

    const visitor = await Visitor.create({
      name: name.trim(),
      phone: phone.trim(),
      visitorType,
      tenantId: hostTenantId,
      tenantName: hostName || `Resident of Room #${roomNumber}`,
      roomNumber: roomNumber.trim(),
      purpose: purpose.trim(),
      vehicleNumber: vehicleNumber ? vehicleNumber.trim() : '',
      entryTime: new Date(),
      exitTime: null,
      status: 'inside',
      isLateNight: isLate,
      loggedBy: req.user?.name || 'Security Guard'
    });

    await logActivity({
      user: req.user,
      action: 'CHECKIN_VISITOR',
      entity: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} checked in to visit Room #${visitor.roomNumber}`
    });

    return res.status(201).json({
      success: true,
      message: `Visitor ${visitor.name} checked in successfully to Room #${roomNumber}`,
      data: visitor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-out Visitor
// @route   PATCH /api/visitors/:id/checkout
// @access  Private (Admin & Staff)
export const checkoutVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor entry not found' });
    }

    if (visitor.status === 'checked-out') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked out' });
    }

    visitor.status = 'checked-out';
    visitor.exitTime = new Date();
    await visitor.save();

    await logActivity({
      user: req.user,
      action: 'CHECKOUT_VISITOR',
      entity: 'Visitor',
      entityId: visitor._id,
      description: `Visitor ${visitor.name} checked out`
    });

    return res.json({
      success: true,
      message: `Visitor ${visitor.name} checked out successfully`,
      data: visitor
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Visitor Log
// @route   DELETE /api/visitors/:id
// @access  Private (Admin Only)
export const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findById(id);

    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    await visitor.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_VISITOR',
      entity: 'Visitor',
      entityId: id,
      description: `Deleted visitor log for ${visitor.name}`
    });

    return res.json({
      success: true,
      message: 'Visitor log deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
