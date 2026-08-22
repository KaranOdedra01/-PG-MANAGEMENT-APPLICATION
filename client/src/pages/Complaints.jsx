import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  AlertCircle, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  Filter, 
  Zap, 
  Droplet, 
  Wifi, 
  ShieldAlert, 
  Sparkles, 
  Trash2, 
  UserCheck, 
  RefreshCw, 
  X, 
  Check, 
  Layers, 
  AlertTriangle,
  ArrowRight,
  Flame
} from 'lucide-react';

const CATEGORY_ICONS = {
  electrical: { label: 'Electrical', icon: Zap, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  plumbing: { label: 'Plumbing', icon: Droplet, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  cleaning: { label: 'Cleaning', icon: Sparkles, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  internet: { label: 'WiFi / Internet', icon: Wifi, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  security: { label: 'Security', icon: ShieldAlert, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  other: { label: 'General', icon: Wrench, color: 'bg-slate-800 text-slate-400 border-slate-700' }
};

export const Complaints = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isTenant = user?.role === 'tenant';

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modals
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Forms
  const [formData, setFormData] = useState({
    title: '',
    category: 'electrical',
    priority: 'medium',
    roomNumber: '',
    description: ''
  });

  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints');
      if (res.data?.success) setComplaints(res.data.data);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffList = async () => {
    try {
      const res = await api.get('/auth/staff');
      if (res.data?.success && res.data.data.length > 0) {
        setStaffList(res.data.data);
        setSelectedStaffId(res.data.data[0]._id);
      }
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  useEffect(() => {
    fetchComplaints();
    if (user?.role === 'admin' || user?.role === 'staff') {
      fetchStaffList();
    }
  }, [user]);

  // Counts for KPIs
  const totalCount = complaints.length;
  const openCount = complaints.filter(c => c.status === 'open').length;
  const inProgressCount = complaints.filter(c => c.status === 'in-progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const urgentCount = complaints.filter(c => (c.priority === 'high' || c.priority === 'urgent') && c.status !== 'resolved').length;

  const filteredComplaints = complaints.filter((c) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      c.title.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) ||
      (c.roomNumber && c.roomNumber.includes(q)) ||
      (c.tenantName && c.tenantName.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });
  const openRaiseModal = () => {
    setFormData({
      title: '',
      category: 'electrical',
      priority: 'medium',
      roomNumber: user?.roomNumber || '102',
      description: ''
    });
    setModalError('');
    setIsRaiseOpen(true);
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await api.post('/complaints', formData);
      setIsRaiseOpen(false);
      fetchComplaints();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to raise complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaffId) {
      alert('Please select a staff member');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch('/complaints/' + selectedTicket._id + '/assign', { assignedStaffId: selectedStaffId });
      setIsAssignOpen(false);
      fetchComplaints();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to assign staff');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch('/complaints/' + selectedTicket._id + '/status', {
        status: 'resolved',
        resolutionNote: resolutionNote || 'Resolved and inspected by maintenance team.'
      });
      setIsResolveOpen(false);
      fetchComplaints();
    } catch (err) {
      alert('Failed to resolve complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatus = async (ticket, nextStatus) => {
    try {
      await api.patch('/complaints/' + ticket._id + '/status', { status: nextStatus });
      fetchComplaints();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint record?')) {
      try {
        await api.delete('/complaints/' + id);
        fetchComplaints();
      } catch (err) {
        alert('Failed to delete complaint');
      }
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Module 7 • Maintenance & Complaints Hub
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-rose-400" />
            {isTenant ? 'My Maintenance Requests' : 'Complaints & Maintenance Hub'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isTenant 
              ? 'Raise room maintenance tickets, track live progress, and get electrical/plumbing issues fixed.'
              : 'Monitor hostel maintenance tickets, assign tasks to caretakers, and track resolution lifecycles.'}
          </p>
        </div>

        <button
          onClick={openRaiseModal}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/25 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Raise Complaint
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Logged</span>
          <span className="text-2xl font-bold text-slate-100">{totalCount} Tickets</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">Open / Unassigned</span>
          <span className="text-2xl font-bold text-rose-400">{openCount} Pending</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">In Progress</span>
          <span className="text-2xl font-bold text-amber-400">{inProgressCount} Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Resolved</span>
          <span className="text-2xl font-bold text-emerald-400">{resolvedCount} Fixed</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticket title, room #, resident..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            <option value="electrical">Electrical</option>
            <option value="plumbing">Plumbing</option>
            <option value="cleaning">Cleaning</option>
            <option value="internet">Internet & WiFi</option>
            <option value="security">Security</option>
            <option value="other">General</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'open', 'in-progress', 'resolved'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchComplaints}
            title="Reload Complaints"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ticket Cards */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading complaints tickets...</p>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500/60 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No complaints matching your criteria</p>
          <p className="text-xs text-slate-500 mt-1">All systems operational or try adjusting filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map((ticket) => {
            const meta = CATEGORY_ICONS[ticket.category] || CATEGORY_ICONS.other;
            const Icon = meta.icon;
            const isUrgent = ticket.priority === 'urgent' || ticket.priority === 'high';
            const isResolved = ticket.status === 'resolved';

            return (
              <div
                key={ticket._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-md"
              >
                {/* Top Row: Category, Title, Priority, Status */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`w-11 h-11 rounded-xl ${meta.color} flex items-center justify-center shrink-0 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-100">{ticket.title}</h3>
                        <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                          Room #{ticket.roomNumber}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          isUrgent ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isUrgent && <Flame className="w-3 h-3 text-rose-400 animate-pulse" />}
                          {ticket.priority} Priority
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{ticket.description}</p>

                      <p className="text-[11px] text-slate-500 mt-2 flex flex-wrap items-center gap-2">
                        <span>Resident: <strong className="text-slate-400">{ticket.tenantName}</strong></span>
                        <span>•</span>
                        <span>Logged: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Assigned Staff: <strong className="text-slate-300">{ticket.assignedStaffId?.name || ticket.assignedTo || 'Unassigned'}</strong></span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`self-start sm:self-auto text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                      isResolved
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : ticket.status === 'in-progress'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}
                  >
                    {ticket.status}
                  </span>
                </div>

                {/* 3-Step Visual Progress Stepper */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="grid grid-cols-3 text-center text-xs font-semibold gap-2">
                    <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${ticket.status === 'open' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-900 text-slate-400'}`}>
                      <span>1. Ticket Logged</span>
                    </div>

                    <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${ticket.status === 'in-progress' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : isResolved ? 'bg-slate-900 text-slate-300' : 'bg-slate-900/40 text-slate-600'}`}>
                      <span>2. In Progress</span>
                    </div>

                    <div className={`p-2 rounded-lg flex items-center justify-center gap-1.5 ${isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-900/40 text-slate-600'}`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>3. Resolved</span>
                    </div>
                  </div>

                  {ticket.resolutionNote && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-xs text-emerald-400 flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>Resolution: {ticket.resolutionNote}</span>
                    </div>
                  )}
                </div>

                {/* Actions (Admin & Staff) */}
                {(isAdmin || isStaff) && (
                  <div className="pt-2 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {isAdmin && ticket.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsAssignOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                        >
                          <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                          Assign Staff
                        </button>
                      )}

                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setIsResolveOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                      )}

                      {ticket.status === 'open' && (
                        <button
                          onClick={() => handleQuickStatus(ticket, 'in-progress')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          Start Progress
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(ticket._id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Ticket"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* RAISE COMPLAINT MODAL */}
      {isRaiseOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-rose-400" />
                Raise Maintenance Ticket
              </h3>
              <button onClick={() => setIsRaiseOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRaiseSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AC cooling low / Fan regulator broken"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="electrical">Electrical</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="internet">WiFi / Internet</option>
                    <option value="security">Security</option>
                    <option value="other">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Priority Level *</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number *</label>
                <input
                  type="text"
                  required
                  value={formData.roomNumber}
                  onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                  placeholder="e.g. 102"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Please describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRaiseOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN STAFF MODAL (Admin) */}
      {isAssignOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-indigo-400" />
              Assign Maintenance Staff
            </h3>
            <p className="text-xs text-slate-400">Assign ticket "{selectedTicket.title}" to a caretaker.</p>
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Verified Staff Member *</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {staffList.length > 0 ? (
                    staffList.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name} ({s.role.toUpperCase()})
                      </option>
                    ))
                  ) : (
                    <option value="">No active staff found</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  Assign & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TICKET MODAL */}
      {isResolveOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Complete & Resolve Ticket
            </h3>
            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resolution Summary Note</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Replaced faulty socket and tested power load."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResolveOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                >
                  Confirm Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Complaints;