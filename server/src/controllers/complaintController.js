import mongoose from 'mongoose';
import Complaint from '../models/Complaint.js';
import { inMemoryComplaints, inMemoryUsers, inMemoryRooms } from '../utils/inMemoryStore.js';
import { inMemoryTenants } from './tenantController.js';

// @desc    Get all complaints (Admins/Staff see all, Tenants see only own)
// @route   GET /api/complaints
// @access  Private
export const getComplaints = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id ? req.user._id.toString() : '';
    const { status, priority, category, search } = req.query;

    let results = [...inMemoryComplaints];

    if (role === 'tenant') {
      results = results.filter(c => c.tenantId === userId);
    }

    if (status && status !== 'all') {
      results = results.filter(c => c.status === status);
    }
    if (priority && priority !== 'all') {
      results = results.filter(c => c.priority === priority);
    }
    if (category && category !== 'all') {
      results = results.filter(c => c.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(c => 
        c.title.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        (c.roomNumber && c.roomNumber.includes(q))
      );
    }

    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Complaint by ID
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  try {
    const { id } = req.params;
    const complaint = inMemoryComplaints.find(c => c._id.toString() === id.toString());
    if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found' });
    res.json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Raise a New Complaint
// @route   POST /api/complaints
// @access  Private (Tenants, Admin, Staff)
export const createComplaint = async (req, res) => {
  try {
    const { title, description, category = 'other', priority = 'medium', roomNumber, attachments = [] } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'Please provide title and description' });
    }

    let assignedRoom = roomNumber;
    if (!assignedRoom && req.user.role === 'tenant') {
      const t = inMemoryTenants.find(ten => ten.userId === req.user._id.toString()) ||
                inMemoryUsers.find(u => u._id.toString() === req.user._id.toString());
      assignedRoom = t?.roomNumber || '102';
    }

    const newComplaint = {
      _id: 'cmp_' + Date.now(),
      tenantId: req.user._id ? req.user._id.toString() : 'usr_anon',
      tenantName: req.user.name || 'Tenant Resident',
      roomNumber: assignedRoom || '101',
      title,
      description,
      category: category.toLowerCase(),
      priority: priority.toLowerCase(),
      status: 'open',
      assignedTo: 'Unassigned',
      resolutionNote: '',
      attachments: Array.isArray(attachments) ? attachments : [],
      createdAt: new Date()
    };

    inMemoryComplaints.unshift(newComplaint);

    res.status(201).json({
      success: true,
      message: 'Maintenance complaint ticket #' + newComplaint._id + ' logged successfully',
      data: newComplaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Complaint Status (open -> in-progress -> resolved)
// @route   PATCH /api/complaints/:id/status
// @access  Private (Admin & Staff)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolutionNote = '' } = req.body;

    if (!['open', 'in-progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const complaint = inMemoryComplaints.find(c => c._id.toString() === id.toString());
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.status = status;
    if (resolutionNote) complaint.resolutionNote = resolutionNote;
    if (status === 'resolved') {
      complaint.resolvedAt = new Date();
    }

    res.json({
      success: true,
      message: 'Complaint status updated to ' + status,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Assign Staff to Complaint
// @route   PATCH /api/complaints/:id/assign
// @access  Private (Admin Only)
export const assignComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const complaint = inMemoryComplaints.find(c => c._id.toString() === id.toString());
    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    complaint.assignedTo = assignedTo || 'Ramesh Caretaker';
    if (complaint.status === 'open') {
      complaint.status = 'in-progress';
    }

    res.json({
      success: true,
      message: 'Complaint assigned to ' + complaint.assignedTo,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete Complaint
// @route   DELETE /api/complaints/:id
// @access  Private (Admin Only)
export const deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryComplaints.findIndex(c => c._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    inMemoryComplaints.splice(index, 1);
    res.json({ success: true, message: 'Complaint deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
