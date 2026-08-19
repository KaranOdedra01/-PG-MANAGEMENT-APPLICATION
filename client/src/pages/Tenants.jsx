import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  DoorOpen, 
  Calendar, 
  ShieldAlert, 
  LogOut, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  CreditCard, 
  HeartHandshake, 
  RefreshCw, 
  X 
} from 'lucide-react';

export const Tenants = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';

  const [tenants, setTenants] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');

  // Onboard Modal State
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    roomId: '',
    securityDeposit: 10000,
    idProofType: 'Aadhaar',
    idProofNumber: '',
    emergencyContact: { name: '', phone: '', relation: 'Father' }
  });
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [editFormData, setEditFormData] = useState({
    phone: '',
    securityDeposit: 10000,
    idProofType: 'Aadhaar',
    idProofNumber: '',
    emergencyContact: { name: '', phone: '', relation: '' }
  });

  // Checkout Modal State
  const [checkoutTarget, setCheckoutTarget] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tRes, rRes] = await Promise.all([
        api.get('/tenants'),
        api.get('/rooms')
      ]);
      if (tRes.data?.success) setTenants(tRes.data.data);
      if (rRes.data?.success) setRooms(rRes.data.data);
    } catch (err) {
      console.error('Failed to load tenants/rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      t.name.toLowerCase().includes(q) || 
      t.email.toLowerCase().includes(q) || 
      t.phone.includes(q) || 
      t.roomNumber.includes(q);
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesRoom = roomFilter === 'all' || t.roomNumber === roomFilter;
    return matchesSearch && matchesStatus && matchesRoom;
  });

  // Rooms with available beds for onboarding dropdown
  const availableRooms = rooms.filter(r => r.occupiedBeds < r.capacity && r.status !== 'maintenance');

  const openOnboardModal = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      roomId: availableRooms[0]?._id || '',
      securityDeposit: 10000,
      idProofType: 'Aadhaar',
      idProofNumber: '',
      emergencyContact: { name: '', phone: '', relation: 'Father' }
    });
    setModalError('');
    setIsOnboardOpen(true);
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await api.post('/tenants/onboard', formData);
      setIsOnboardOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (t) => {
    setEditingTenant(t);
    setEditFormData({
      phone: t.phone,
      securityDeposit: t.securityDeposit,
      idProofType: t.idProofType,
      idProofNumber: t.idProofNumber || '',
      emergencyContact: t.emergencyContact || { name: '', phone: '', relation: '' }
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put(`/tenants/${editingTenant._id}`, editFormData);
      setIsEditOpen(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckout = async (tenant) => {
    try {
      await api.post(`/tenants/${tenant._id}/checkout`);
      setCheckoutTarget(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to checkout tenant');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tenants/${id}`);
      setDeleteTargetId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete tenant');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Module 4 • Tenant Directory & KYC
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-400" />
            Tenant Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Resident records, room bed allocations, security deposits, and check-in/out records.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openOnboardModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Onboard New Tenant
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Name, Phone, Email, Room #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Room filter */}
          <select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Rooms</option>
            {rooms.map((r) => (
              <option key={r._id} value={r.roomNumber}>
                Room #{r.roomNumber}
              </option>
            ))}
          </select>

          {/* Status filter buttons */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'active', 'checked-out'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchData}
            title="Reload Tenants"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tenants Grid */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading tenant directory...</p>
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No tenants found</p>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or onboard a new resident.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTenants.map((t) => {
            const isActive = t.status === 'active';
            return (
              <div
                key={t._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg relative group"
              >
                <div>
                  {/* Top card header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.name)}`}
                        alt={t.name}
                        className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 p-0.5"
                      />
                      <div>
                        <h3 className="text-base font-bold text-slate-100 leading-tight">{t.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-1 ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                          {t.status}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-slate-400 block">Allocated Room</span>
                      <span className="text-sm font-black text-indigo-400">Room #{t.roomNumber}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-2 py-3 border-y border-slate-800/80 text-xs text-slate-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{t.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate text-slate-400">{t.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-400">
                        Check-in: {new Date(t.checkInDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Financial & KYC Details */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Monthly Rent</span>
                      <span className="font-bold text-emerald-400">₹{t.monthlyRent?.toLocaleString() || 7500}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Deposit Paid</span>
                      <span className="font-bold text-slate-200">₹{t.securityDeposit?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  {t.emergencyContact?.name && (
                    <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <HeartHandshake className="w-3 h-3 text-rose-400" />
                        {t.emergencyContact.relation}: {t.emergencyContact.name}
                      </span>
                      <span className="text-slate-300 font-mono">{t.emergencyContact.phone}</span>
                    </div>
                  )}
                </div>

                {/* Card Actions (Admin Only) */}
                {isAdmin && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    {isActive ? (
                      <button
                        onClick={() => setCheckoutTarget(t)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Check-Out
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500">Checked Out on {t.checkOutDate ? new Date(t.checkOutDate).toLocaleDateString() : 'N/A'}</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(t)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                        title="Edit Tenant"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetId(t._id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONBOARD NEW TENANT MODAL */}
      {/* ========================================================================= */}
      {isOnboardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Onboard New Resident
              </h3>
              <button
                onClick={() => setIsOnboardOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Personal Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Yash Soni"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98000 11111"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="yash@gmail.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Room Allocation Dropdown */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Allocate Room *</label>
                  <select
                    required
                    value={formData.roomId}
                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    {availableRooms.length === 0 ? (
                      <option value="">No vacant rooms available</option>
                    ) : (
                      availableRooms.map((r) => (
                        <option key={r._id} value={r._id}>
                          Room #{r.roomNumber} ({r.type}) - ₹{r.rent}/mo
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Security Deposit (₹) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: Number(e.target.value) })}
                    placeholder="10000"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* KYC & ID Proof */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ID Document Type</label>
                  <select
                    value={formData.idProofType}
                    onChange={(e) => setFormData({ ...formData, idProofType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="College ID">College ID</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ID Number / Reference</label>
                  <input
                    type="text"
                    value={formData.idProofNumber}
                    onChange={(e) => setFormData({ ...formData, idProofNumber: e.target.value })}
                    placeholder="e.g. XXXX-XXXX-5544"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Emergency Contact Details
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Contact Name"
                    value={formData.emergencyContact.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                    })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Contact Phone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                    })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Relation (e.g. Father)"
                    value={formData.emergencyContact.relation}
                    onChange={(e) => setFormData({
                      ...formData,
                      emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                    })}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOnboardOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || availableRooms.length === 0}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Onboarding...' : 'Confirm & Onboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT TENANT MODAL */}
      {/* ========================================================================= */}
      {isEditOpen && editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Edit Tenant: {editingTenant.name}</h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Security Deposit (₹)</label>
                <input
                  type="number"
                  required
                  value={editFormData.securityDeposit}
                  onChange={(e) => setEditFormData({ ...editFormData, securityDeposit: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKOUT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {checkoutTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Check-Out {checkoutTarget.name}?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              This will mark the tenant as <strong>Checked-Out</strong> and automatically release <strong>1 bed slot in Room #{checkoutTarget.roomNumber}</strong> back to the available pool.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setCheckoutTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleCheckout(checkoutTarget)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white"
              >
                Confirm Check-Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Delete Tenant Record?</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to delete this tenant record permanently?
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
