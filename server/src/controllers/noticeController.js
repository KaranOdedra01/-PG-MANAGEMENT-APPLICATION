import mongoose from 'mongoose';
import Notice from '../models/Notice.js';
import { inMemoryNotices } from '../utils/inMemoryStore.js';

// @desc    Get all active notices
// @route   GET /api/notices
// @access  Private (All Roles)
export const getNotices = async (req, res) => {
  try {
    const { category, priority, search } = req.query;
    let results = [...inMemoryNotices];

    if (category && category !== 'all') {
      results = results.filter(n => n.category.toLowerCase() === category.toLowerCase());
    }
    if (priority && priority !== 'all') {
      results = results.filter(n => n.priority.toLowerCase() === priority.toLowerCase());
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q)
      );
    }

    // Sort pinned first, then by date descending
    results.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    res.json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Notice
// @route   GET /api/notices/:id
// @access  Private
export const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = inMemoryNotices.find(n => n._id.toString() === id.toString());
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.json({ success: true, data: notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Broadcast a New Notice
// @route   POST /api/notices
// @access  Private (Admin Only)
export const createNotice = async (req, res) => {
  try {
    const { title, content, category = 'general', priority = 'medium', targetRoles = ['all'], isPinned = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Please provide title and content' });
    }

    const newNotice = {
      _id: 'not_' + Date.now(),
      title,
      content,
      category: category.toLowerCase(),
      priority: priority.toLowerCase(),
      targetRoles: Array.isArray(targetRoles) ? targetRoles : ['all'],
      postedBy: req.user?.name || 'Admin',
      isPinned: Boolean(isPinned),
      readBy: [],
      createdAt: new Date()
    };

    inMemoryNotices.unshift(newNotice);

    res.status(201).json({
      success: true,
      message: 'Notice broadcasted successfully',
      data: newNotice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Notice
// @route   PUT /api/notices/:id
// @access  Private (Admin Only)
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, isPinned } = req.body;

    const index = inMemoryNotices.findIndex(n => n._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    const current = inMemoryNotices[index];
    inMemoryNotices[index] = {
      ...current,
      title: title || current.title,
      content: content || current.content,
      category: category ? category.toLowerCase() : current.category,
      priority: priority ? priority.toLowerCase() : current.priority,
      isPinned: isPinned !== undefined ? Boolean(isPinned) : current.isPinned
    };

    res.json({
      success: true,
      message: 'Notice updated successfully',
      data: inMemoryNotices[index]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge / Mark Notice as Read
// @route   PATCH /api/notices/:id/acknowledge
// @access  Private (All Roles)
export const acknowledgeNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id ? req.user._id.toString() : 'usr_anon';

    const notice = inMemoryNotices.find(n => n._id.toString() === id.toString());
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (!notice.readBy) notice.readBy = [];
    if (!notice.readBy.includes(userId)) {
      notice.readBy.push(userId);
    }

    res.json({
      success: true,
      message: 'Notice acknowledged',
      data: notice
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin Only)
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const index = inMemoryNotices.findIndex(n => n._id.toString() === id.toString());
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    inMemoryNotices.splice(index, 1);
    res.json({ success: true, message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
