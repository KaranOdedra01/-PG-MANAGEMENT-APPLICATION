import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Megaphone, 
  Pin, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Users, 
  Wrench, 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Check, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  Flame, 
  Bell, 
  Eye 
} from 'lucide-react';

const NOTICE_CATEGORIES = {
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  rules: { label: 'Rules & Timings', icon: ShieldAlert, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  events: { label: 'Events & Mess', icon: Sparkles, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  general: { label: 'General', icon: Megaphone, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' }
};

export const Notices = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const userId = user?._id ? user._id.toString() : '';

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    priority: 'medium',
    isPinned: false,
    targetRoles: ['all']
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notices');
      if (res.data?.success) setNotices(res.data.data);
    } catch (err) {
      console.error('Failed to load notices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [user]);

  const filteredNotices = notices.filter((n) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      n.title.toLowerCase().includes(q) || 
      n.content.toLowerCase().includes(q);
    const matchesCategory = categoryFilter === 'all' || n.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesPriority = priorityFilter === 'all' || n.priority.toLowerCase() === priorityFilter.toLowerCase();
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const pinnedNotice = notices.find(n => n.isPinned || n.priority === 'urgent');
  const openAddModal = () => {
    setEditingNotice(null);
    setFormData({
      title: '',
      content: '',
      category: 'general',
      priority: 'medium',
      isPinned: false,
      targetRoles: ['all']
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (notice) => {
    setEditingNotice(notice);
    setFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category,
      priority: notice.priority,
      isPinned: Boolean(notice.isPinned),
      targetRoles: notice.targetRoles || ['all']
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingNotice) {
        await api.put('/notices/' + editingNotice._id, formData);
      } else {
        await api.post('/notices', formData);
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcknowledge = async (noticeId) => {
    try {
      await api.patch('/notices/' + noticeId + '/acknowledge');
      fetchNotices();
    } catch (err) {
      alert('Failed to acknowledge notice');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notice?')) {
      try {
        await api.delete('/notices/' + id);
        fetchNotices();
      } catch (err) {
        alert('Failed to delete notice');
      }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2.5 py-0.5 rounded-full border border-violet-500/20">
              Module 8 • Notice Board & Announcements
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Megaphone className="w-7 h-7 text-violet-400" />
            Hostel Notice Board
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Official announcements, maintenance schedules, gate timing policies, and mess event updates.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-violet-600/25 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Broadcast Notice
          </button>
        )}
      </div>

      {/* Featured / Pinned Alert Banner */}
      {pinnedNotice && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-900 border border-amber-500/30 shadow-lg flex items-start gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Pin className="w-3 h-3" /> Pinned Announcement
              </span>
              <span className="text-xs text-slate-400">• {new Date(pinnedNotice.createdAt).toLocaleDateString()}</span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-1">{pinnedNotice.title}</h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">{pinnedNotice.content}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search announcement keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Categories</option>
            <option value="maintenance">Maintenance</option>
            <option value="rules">Rules & Policies</option>
            <option value="events">Events & Mess</option>
            <option value="general">General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <button
            onClick={fetchNotices}
            title="Reload Notices"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notices Grid */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-violet-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading notices...</p>
        </div>
      ) : filteredNotices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No announcements found</p>
          <p className="text-xs text-slate-500 mt-1">Check back later or broadcast a new notice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNotices.map((notice) => {
            const meta = NOTICE_CATEGORIES[notice.category] || NOTICE_CATEGORIES.general;
            const Icon = meta.icon;
            const isUrgent = notice.priority === 'urgent' || notice.priority === 'high';
            const hasRead = notice.readBy?.includes(userId);

            return (
              <div
                key={notice._id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative group space-y-4"
              >
                <div>
                  {/* Top Bar: Category & Priority */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${meta.color}`}>
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <Flame className="w-3 h-3 animate-pulse" />
                          {notice.priority}
                        </span>
                      )}
                      {notice.isPinned && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1">
                          <Pin className="w-2.5 h-2.5" /> Pinned
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500">
                      {new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-100 mt-3">{notice.title}</h3>
                  <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{notice.content}</p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Posted by: <strong className="text-slate-300">{notice.postedBy}</strong></span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-500" />
                      {notice.readBy?.length || 0} Acknowledged
                    </span>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  {!isAdmin && (
                    <button
                      onClick={() => handleAcknowledge(notice._id)}
                      disabled={hasRead}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        hasRead
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {hasRead ? 'Acknowledged' : 'Mark as Read'}
                    </button>
                  )}

                  {isAdmin && (
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => openEditModal(notice)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-violet-400 transition-colors"
                        title="Edit Notice"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(notice._id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BROADCAST NOTICE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-violet-400" />
                {editingNotice ? 'Edit Announcement' : 'Broadcast Announcement'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Water Tank Cleaning / Diwali Mess Dinner"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="general">General</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="rules">Rules & Policies</option>
                    <option value="events">Events & Mess</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Message *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write the full announcement details here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="w-4 h-4 rounded text-violet-600 bg-slate-950 border-slate-800"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                  <Pin className="w-3 h-3 text-indigo-400" />
                  Pin this announcement to the top banner
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Broadcasting...' : editingNotice ? 'Save Changes' : 'Broadcast Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notices;