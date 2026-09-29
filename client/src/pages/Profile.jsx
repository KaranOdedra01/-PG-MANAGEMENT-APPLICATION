import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Home, 
  Calendar, 
  CreditCard,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export const Profile = () => {
  const { user, updateUser } = useAuth();
  const isTenant = user?.role === 'tenant';

  // Profile Form
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    emergencyContact: {
      name: '',
      phone: '',
      relation: ''
    }
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Tenant Room Info
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loadingTenant, setLoadingTenant] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
        emergencyContact: {
          name: user.emergencyContact?.name || '',
          phone: user.emergencyContact?.phone || '',
          relation: user.emergencyContact?.relation || ''
        }
      });
    }

    if (isTenant) {
      fetchTenantDetails();
    }
  }, [user]);

  const fetchTenantDetails = async () => {
    try {
      setLoadingTenant(true);
      const res = await api.get('/tenants');
      if (res.data?.success && res.data.data?.length > 0) {
        setTenantInfo(res.data.data[0]);
      }
    } catch (err) {
      console.warn('Could not fetch tenant room info:', err);
    } finally {
      setLoadingTenant(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setSavingProfile(true);

    try {
      const res = await api.patch('/auth/profile', profileData);
      if (res.data?.success) {
        setProfileSuccess('Profile updated successfully!');
        if (updateUser) {
          updateUser(res.data.data);
        }
        setTimeout(() => setProfileSuccess(''), 4000);
      }
    } catch (err) {
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setSavingPassword(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (res.data?.success) {
        setPasswordSuccess('Password changed successfully!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setPasswordSuccess(''), 4000);
      }
    } catch (err) {
      setPasswordError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            Account & Security
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          <User className="w-7 h-7 text-indigo-500" />
          My Profile & Settings
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, emergency contacts, room assignment, and login credentials.
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 text-indigo-500 font-extrabold flex items-center justify-center text-3xl border border-indigo-500/20 shadow-inner shrink-0">
          {user?.name?.charAt(0) || 'U'}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{user?.name}</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              {user?.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Mail className="w-3.5 h-3.5" /> {user?.email}
          </p>

          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
            <Phone className="w-3.5 h-3.5" /> {user?.phone || 'No phone registered'}
          </p>
        </div>
      </div>

      {/* Tenant Room Info Card (if Tenant) */}
      {isTenant && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">My Room Allocation</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Assigned PG accommodation details</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block mb-1">Room Number</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                #{tenantInfo?.roomNumber || user?.roomNumber || 'Assigned'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block mb-1">Bed Slot</span>
              <span className="text-base font-bold text-indigo-500">
                Bed {tenantInfo?.bedNumber || 'Assigned'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block mb-1">Monthly Base Rent</span>
              <span className="text-base font-bold text-emerald-500">
                ₹{tenantInfo?.monthlyRent || 'Standard'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block mb-1">Check-in Date</span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {tenantInfo?.checkInDate ? new Date(tenantInfo.checkInDate).toLocaleDateString() : 'Active Resident'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Section: Edit Profile & Change Password */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1: Edit Profile Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Personal Information</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your contact details and emergency contact</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Display Name *
              </label>
              <input
                type="text"
                required
                value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Phone Number
              </label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Emergency Contact Group */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block">
                Emergency Contact Person
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Name</label>
                  <input
                    type="text"
                    placeholder="Contact name"
                    value={profileData.emergencyContact.name}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      emergencyContact: { ...profileData.emergencyContact, name: e.target.value }
                    })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Phone</label>
                  <input
                    type="tel"
                    placeholder="+91..."
                    value={profileData.emergencyContact.phone}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      emergencyContact: { ...profileData.emergencyContact, phone: e.target.value }
                    })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Relation</label>
                  <input
                    type="text"
                    placeholder="Parent / Guardian"
                    value={profileData.emergencyContact.relation}
                    onChange={(e) => setProfileData({
                      ...profileData,
                      emergencyContact: { ...profileData.emergencyContact, relation: e.target.value }
                    })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={savingProfile}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Form 2: Change Password */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Security Credentials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Update your secret password regularly to keep your account safe</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 pr-10 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                New Password *
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 pr-10 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Confirm New Password *
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Re-type new password"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPassword}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              {savingPassword ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
