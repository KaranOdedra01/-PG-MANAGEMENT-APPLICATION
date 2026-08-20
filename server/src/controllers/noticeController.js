import Notice from '../models/Notice.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { logActivity } from '../utils/activityLogger.js';

// @desc    Get all active notices (Role targeted)
// @route   GET /api/notices
// @access  Private (All Roles)
export const getNotices = async (req, res) => {
  try {
    const { category, priority, search } = req.query;
    const userRole = req.user.role;

    const query = {
      targetRoles: { $in: ['all', userRole] }
    };

    if (category && category !== 'all') {
      query.category = category.toLowerCase();
    }
    if (priority && priority !== 'all') {
      query.priority = priority.toLowerCase();
    }
    if (search) {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } }
      ];
    }

    // Pinned first, then newest
    const notices = await Notice.find(query).sort({ isPinned: -1, createdAt: -1 });

    return res.json({
      success: true,
      count: notices.length,
      data: notices
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Single Notice by ID
// @route   GET /api/notices/:id
// @access  Private
export const getNoticeById = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    return res.json({
      success: true,
      data: notice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Broadcast a New Notice
// @route   POST /api/notices
// @access  Private (Admin & Staff)
export const createNotice = async (req, res) => {
  try {
    const { title, content, category = 'general', priority = 'medium', targetRoles = ['all'], isPinned = false } = req.body;

    const notice = await Notice.create({
      title: title.trim(),
      content: content.trim(),
      category: category.toLowerCase(),
      priority: priority.toLowerCase(),
      targetRoles: Array.isArray(targetRoles) ? targetRoles : ['all'],
      postedBy: req.user.name || 'Admin',
      isPinned: Boolean(isPinned),
      readBy: []
    });

    // Send in-app notification to targeted users
    const roleFilter = targetRoles.includes('all') ? {} : { role: { $in: targetRoles } };
    const targetUsers = await User.find(roleFilter);
    for (const u of targetUsers) {
      if (u._id.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: u._id,
          type: 'notice',
          title: `Announcement: ${notice.title}`,
          message: notice.content.substring(0, 100) + '...',
          link: '/notices'
        });
      }
    }

    await logActivity({
      user: req.user,
      action: 'CREATE_NOTICE',
      entity: 'Notice',
      entityId: notice._id,
      description: `Broadcasted notice: ${notice.title} (${notice.category})`
    });

    return res.status(201).json({
      success: true,
      message: 'Notice broadcasted successfully',
      data: notice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a Notice
// @route   PUT /api/notices/:id
// @access  Private (Admin & Staff)
export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, targetRoles, isPinned } = req.body;

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (title) notice.title = title.trim();
    if (content) notice.content = content.trim();
    if (category) notice.category = category.toLowerCase();
    if (priority) notice.priority = priority.toLowerCase();
    if (targetRoles) notice.targetRoles = Array.isArray(targetRoles) ? targetRoles : [targetRoles];
    if (isPinned !== undefined) notice.isPinned = Boolean(isPinned);

    await notice.save();

    await logActivity({
      user: req.user,
      action: 'UPDATE_NOTICE',
      entity: 'Notice',
      entityId: notice._id,
      description: `Updated notice: ${notice.title}`
    });

    return res.json({
      success: true,
      message: 'Notice updated successfully',
      data: notice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Acknowledge / Mark Notice as Read
// @route   PATCH /api/notices/:id/acknowledge
// @access  Private (All Roles)
export const acknowledgeNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    if (!notice.readBy.includes(userId)) {
      notice.readBy.push(userId);
      await notice.save();
    }

    return res.json({
      success: true,
      message: 'Notice acknowledged',
      data: notice
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a Notice
// @route   DELETE /api/notices/:id
// @access  Private (Admin Only)
export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Notice not found' });
    }

    await notice.deleteOne();

    await logActivity({
      user: req.user,
      action: 'DELETE_NOTICE',
      entity: 'Notice',
      entityId: id,
      description: `Deleted notice: ${notice.title}`
    });

    return res.json({
      success: true,
      message: 'Notice deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
