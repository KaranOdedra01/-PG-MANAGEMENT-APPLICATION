import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  ShieldCheck, 
  UserCheck, 
  LogOut, 
  Clock, 
  Search, 
  Plus, 
  Download, 
  Phone, 
  DoorOpen, 
  Truck, 
  Users, 
  Wrench, 
  AlertTriangle, 
  RefreshCw, 
  X, 
  Check, 
  Trash2, 
  Layers,
  Sparkles
} from 'lucide-react';

const VISITOR_TYPES = {
  Family: { label: 'Family', icon: Users, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  Friend: { label: 'Friend', icon: Sparkles, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Delivery: { label: 'Delivery', icon: Truck, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  Maintenance: { label: 'Service / Worker', icon: Wrench, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  Other: { label: 'General', icon: Users, color: 'bg-slate-800 text-slate-400 border-slate-700' }
};

export const Visitors = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [visitors, setVisitors] = useState([]);
  const [activeStats, setActiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Modal
  const [isCheckinOpen, setIsCheckinOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    visitorType: 'Friend',
    roomNumber: '102',
    tenantName: '',
    purpose: 'Casual Visit',
    vehicleNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listRes, actRes] = await Promise.all([
        api.get('/visitors'),
        api.get('/visitors/active')
      ]);
      if (listRes.data?.success) setVisitors(listRes.data.data);
      if (actRes.data?.success) setActiveStats(actRes.data.data);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const filteredVisitors = visitors.filter((v) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      v.name.toLowerCase().includes(q) || 
      v.phone.includes(q) || 
      v.tenantName.toLowerCase().includes(q) ||
      v.roomNumber.includes(q);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchesType = typeFilter === 'all' || v.visitorType.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesType;
  });
  const openCheckinModal = () => {
    setFormData({
      name: '',
      phone: '',
      visitorType: 'Friend',
      roomNumber: '102',
      tenantName: '',
      purpose: 'Casual Visit',
      vehicleNumber: ''
    });
    setModalError('');
    setIsCheckinOpen(true);
  };

  const handleCheckinSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await api.post('/visitors', formData);
      setIsCheckinOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to check in visitor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (id) => {
    try {
      await api.patch('/visitors/' + id + '/checkout');
      fetchData();
    } catch (err) {
      alert('Failed to check out visitor');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this visitor log entry?')) {
      try {
        await api.delete('/visitors/' + id);
        fetchData();
      } catch (err) {
        alert('Failed to delete visitor log');
      }
    }
  };

  // Export Visitor Log to CSV
  const exportToCSV = () => {
    if (visitors.length === 0) return alert('No visitor records available to export');

    const headers = ['Entry Time', 'Exit Time', 'Visitor Name', 'Phone', 'Type', 'Room #', 'Host Resident', 'Purpose', 'Vehicle #', 'Status'];
    const rows = visitors.map(v => [
      new Date(v.entryTime).toLocaleString(),
      v.exitTime ? new Date(v.exitTime).toLocaleString() : 'Still Inside',
      '"' + v.name.replace(/"/g, '""') + '"',
      v.phone,
      v.visitorType,
      v.roomNumber,
      '"' + v.tenantName.replace(/"/g, '""') + '"',
      '"' + (v.purpose || '').replace(/"/g, '""') + '"',
      v.vehicleNumber || 'N/A',
      v.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PG_Gate_Visitor_Log_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded-full border border-teal-500/20">
              Module 10 • Security & Visitor Gate Logs
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-teal-400" />
            Visitor & Gate Entry Logs
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Real-time gatekeeper check-in register, late night entry alerts, and audit exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-teal-400" />
            Export Gate Log
          </button>
          <button
            onClick={openCheckinModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-teal-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Check-In Visitor
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Logged</span>
          <span className="text-2xl font-bold text-slate-100">{visitors.length} Visitors</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider block mb-1">Currently Inside</span>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span className="text-2xl font-bold text-teal-400">{activeStats?.totalCurrentlyInside || 0} Inside</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Deliveries</span>
          <span className="text-2xl font-bold text-amber-400">
            {visitors.filter(v => v.visitorType === 'Delivery').length} Packages
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Checked Out</span>
          <span className="text-2xl font-bold text-emerald-400">
            {visitors.filter(v => v.status === 'checked-out').length} Exited
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search visitor, phone, host tenant, room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Visitor Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Visitor Types</option>
            <option value="family">Family</option>
            <option value="friend">Friend</option>
            <option value="delivery">Delivery</option>
            <option value="maintenance">Service / Worker</option>
            <option value="other">Other</option>
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'inside', 'checked-out'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st === 'inside' ? 'Inside' : st === 'checked-out' ? 'Checked Out' : 'All'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            title="Reload Visitor Logs"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Visitor List */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-teal-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading gate register...</p>
        </div>
      ) : filteredVisitors.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No visitor records matching criteria</p>
          <p className="text-xs text-slate-500 mt-1">Check in a new visitor at the gate or clear search filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredVisitors.map((vis) => {
            const meta = VISITOR_TYPES[vis.visitorType] || VISITOR_TYPES.Other;
            const Icon = meta.icon;
            const isInside = vis.status === 'inside';

            return (
              <div
                key={vis._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${meta.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-100">{vis.name}</h3>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-500" /> {vis.phone}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                        {vis.visitorType}
                      </span>
                      {vis.isLateNight && (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Late Night Entry
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 mt-1.5 flex flex-wrap items-center gap-2">
                      <span>Visiting: <strong className="text-indigo-300">{vis.tenantName}</strong></span>
                      <span>•</span>
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        Room #{vis.roomNumber}
                      </span>
                      {vis.vehicleNumber && <span>• Vehicle: {vis.vehicleNumber}</span>}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-1">
                      Purpose: <span className="text-slate-400">{vis.purpose}</span> • Logged by: {vis.loggedBy}
                    </p>
                  </div>
                </div>

                {/* Right Column: Timing, Status, Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[11px] text-slate-400 block flex items-center md:justify-end gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      In: {new Date(vis.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {vis.exitTime ? (
                      <span className="text-[11px] text-slate-500 block">
                        Out: {new Date(vis.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-teal-400 flex items-center md:justify-end gap-1.5 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                        Inside Premises
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isInside && (
                      <button
                        onClick={() => handleCheckout(vis._id)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check-Out
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(vis._id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Visitor Log"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK-IN VISITOR MODAL */}
      {isCheckinOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-400" />
                Gate Visitor Check-In
              </h3>
              <button onClick={() => setIsCheckinOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCheckinSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Visitor Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar / Swiggy Delivery"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Visitor Type *</label>
                  <select
                    value={formData.visitorType}
                    onChange={(e) => setFormData({ ...formData, visitorType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  >
                    <option value="Friend">Friend</option>
                    <option value="Family">Family</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Maintenance">Service / Worker</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Room Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 102"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Host Resident Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Purpose of Visit</label>
                  <input
                    type="text"
                    placeholder="e.g. Study / Parcel / Family"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Vehicle / Reg #</label>
                  <input
                    type="text"
                    placeholder="e.g. GJ-01-AB-1234"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckinOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Checking In...' : 'Confirm Check-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitors;