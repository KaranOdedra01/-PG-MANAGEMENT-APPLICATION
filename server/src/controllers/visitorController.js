import mongoose from 'mongoose';
import Visitor from '../models/Visitor.js';

export let inMemoryVisitors = [
  {
    _id: 'vis_001',
    name: 'Sunil Sharma',
    phone: '+91 98111 99999',
    visitorType: 'Family',
    tenantName: 'Rahul Sharma',
    roomNumber: '102',
    purpose: 'Parents visiting for the weekend',
    vehicleNumber: 'GJ-01-AB-1234',
    entryTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
    exitTime: null,
    status: 'inside',
    isLateNight: false,
    loggedBy: 'Ramesh Caretaker'
  },
  {
    _id: 'vis_002',
    name: 'Zomato Delivery Agent',
    phone: '+91 98777 44433',
    visitorType: 'Delivery',
    tenantName: 'Priya Patel',
    roomNumber: '101',
    purpose: 'Food delivery parcel handover at gate',
    vehicleNumber: 'GJ-01-XX-9900',
    entryTime: new Date(Date.now() - 45 * 60 * 1000),
    exitTime: new Date(Date.now() - 35 * 60 * 1000),
    status: 'checked-out',
    isLateNight: false,
    loggedBy: 'Ramesh Caretaker'
  },
  {
    _id: 'vis_003',
    name: 'Vikram Mehta',
    phone: '+91 98333 11223',
    visitorType: 'Friend',
    tenantName: 'Aman Verma',
    roomNumber: '102',
    purpose: 'College project study group',
    vehicleNumber: '',
    entryTime: new Date(Date.now() - 90 * 60 * 1000),
    exitTime: null,
    status: 'inside',
    isLateNight: false,
    loggedBy: 'Security Guard'
  }
];

// @desc    Get all visitor logs
// @route   GET /api/visitors
// @access  Private (Admin & Staff)
export const getVisitors = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let results = [...inMemoryVisitors];

    if (status && status !== 'all') {
      results = results.filter(v => v.status === status);
    }
    if (type && type !== 'all') {
      results = results.filter(v => v.visitorType.toLowerCase() === type.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(v => 
        v.name.toLowerCase().includes(q) || 
        v.phone.includes(q) || 
        v.tenantName.toLowerCase().includes(q) ||
        v.roomNumber.includes(q)
      );
    }

    results.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Active Visitors currently inside
// @route   GET /api/visitors/active
// @access  Private
export const getActiveVisitors = async (req, res) => {
  try {
    const inside = inMemoryVisitors.filter(v => v.status === 'inside');
    const lateNight = inMemoryVisitors.filter(v => v.isLateNight && v.status === 'inside');

    res.json({
      success: true,
      data: {
        totalCurrentlyInside: inside.length,
        lateNightActive: lateNight.length,
        insideVisitors: inside
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-in New Visitor
// @route   POST /api/visitors
// @access  Private (Admin & Staff)
export const checkinVisitor = async (req, res) => {
  try {
    const { name, phone, visitorType = 'Friend', tenantName, roomNumber, purpose = 'Visit', vehicleNumber = '' } = req.body;

    if (!name || !phone || !roomNumber) {
      return res.status(400).json({ success: false, message: 'Please provide visitor name, phone, and roomNumber' });
    }

    const currentHour = new Date().getHours();
    const isLate = currentHour >= 21 || currentHour < 6; // 9:00 PM to 6:00 AM

    const newVisitor = {
      _id: 'vis_' + Date.now(),
      name,
      phone,
      visitorType,
      tenantName: tenantName || ('Resident of Room #' + roomNumber),
      roomNumber,
      purpose,
      vehicleNumber,
      entryTime: new Date(),
      exitTime: null,
      status: 'inside',
      isLateNight: isLate,
      loggedBy: req.user?.name || 'Gatekeeper'
    };

    inMemoryVisitors.unshift(newVisitor);

    res.status(201).json({
      success: true,
      message: 'Visitor ' + name + ' checked in successfully to Room #' + roomNumber,
      data: newVisitor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check-out Visitor
// @route   PATCH /api/visitors/:id/checkout
// @access  Private (Admin & Staff)
export const checkoutVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = inMemoryVisitors.find(v => v._id.toString() === id.toString());
    if (!visitor) {
      return res.status(404).json({ success: false, message: 'Visitor entry not found' });
    }

    if (visitor.status === 'checked-out') {
      return res.status(400).json({ success: false, message: 'Visitor is already checked out' });
    }

    visitor.status = 'checked-out';
    visitor.exitTime = new Date();

    res.json({
      success: true,
      message: 'Visitor ' + visitor.name + ' checked out successfully',
      data: visitor
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Visitor Log
// @route   DELETE /api/visitors/:id
// @access  Private (Admin Only)
export const deleteVisitor = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryVisitors.findIndex(v => v._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Visitor not found' });
    }

    inMemoryVisitors.splice(index, 1);
    res.json({ success: true, message: 'Visitor log deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
