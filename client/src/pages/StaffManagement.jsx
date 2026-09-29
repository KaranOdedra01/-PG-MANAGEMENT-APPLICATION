import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Users, 
  UserCheck, 
  UserX, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  Shield, 
  RefreshCw, 
  Mail, 
  Phone, 
  Calendar, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';

export const StaffManagement = () => {
  const { user: currentUser } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Add Staff Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'staff',
    phone: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Password Reveal Banner
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/staff');
      if (res.data?.success) {
        setStaffList(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleToggleStatus = async (staffMember) => {
    if (staffMember._id === currentUser?._id) {
      alert('You cannot deactivate your own admin account.');
      return;
    }

    const actionText = staffMember.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionText} ${staffMember.name}'s account?`)) {
      return;
    }

    try {
      await api.patch(`/auth/users/${staffMember._id}/status`);
      fetchStaff();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update account status');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);

    try {
      // Generate secure temp password
      const tempPassword = `PG@Staff${Math.floor(1000 + Math.random() * 9000)}!`;
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: tempPassword,
        role: formData.role,
        phone: formData.phone.trim() || undefined
      };

      const res = await api.post('/auth/users', payload);
      if (res.data?.success) {
        setIsAddModalOpen(false);
        setCreatedCredentials({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          tempPassword
        });
        setFormData({ name: '', email: '', role: 'staff', phone: '' });
        fetchStaff();
      }
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `PG Management Account Credentials\nName: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.tempPassword}\nRole: ${createdCredentials.role}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search);
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Access Control & Operations
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-500" />
            Staff & Personnel Management
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Provision staff/admin accounts, view operational personnel directory, and control security access.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStaff}
            title="Refresh List"
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Dismissible New Credentials Banner */}
      {createdCredentials && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 space-y-3 animate-in fade-in">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Staff Account Created Successfully!
              </h4>
            </div>
            <button
              onClick={() => setCreatedCredentials(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please share these initial credentials with the staff member. They will be prompted to change their password upon first login.
          </p>

          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-emerald-500/20 font-mono text-xs space-y-1.5 text-slate-800 dark:text-slate-200">
            <div><strong className="text-slate-500">Name:</strong> {createdCredentials.name}</div>
            <div><strong className="text-slate-500">Email:</strong> {createdCredentials.email}</div>
            <div><strong className="text-slate-500">Role:</strong> {createdCredentials.role.toUpperCase()}</div>
            <div>
              <strong className="text-slate-500">Temporary Password:</strong>{' '}
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded font-bold">
                {createdCredentials.tempPassword}
              </span>
            </div>
          </div>

          <button
            onClick={handleCopyCredentials}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by staff name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
          >
            <option value="all">All Roles</option>
            <option value="staff">Staff Only</option>
            <option value="admin">Administrators</option>
          </select>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading staff records...</div>
        ) : filteredStaff.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">No personnel found matching the filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">Personnel</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredStaff.map((member) => {
                  const isSelf = member._id === currentUser?._id;

                  return (
                    <tr key={member._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center text-sm shrink-0 border border-indigo-500/20">
                            {member.name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {member.name} {isSelf && <span className="text-[10px] text-indigo-500 font-normal">(You)</span>}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {member.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            member.role === 'admin'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          }`}
                        >
                          {member.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {member.role}
                        </span>
                      </td>

                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        {member.phone ? (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {member.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Not provided</span>
                        )}
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            member.isActive
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${member.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td className="p-4 text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </td>

                      <td className="p-4 text-right">
                        {!isSelf && (
                          <button
                            onClick={() => handleToggleStatus(member)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors border ${
                              member.isActive
                                ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30'
                                : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                            }`}
                          >
                            {member.isActive ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Provision Staff Account</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add a new caretaker or assistant admin to the portal</p>
              </div>
            </div>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. caretaker@pg.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="staff">Staff / Caretaker</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-700 dark:text-indigo-300">
                ⚡ A secure temporary password will be automatically generated upon creation.
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
