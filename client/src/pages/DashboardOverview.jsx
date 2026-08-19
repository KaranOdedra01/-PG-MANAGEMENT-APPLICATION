import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  Building, 
  Users, 
  Receipt, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight,
  PlusCircle,
  Megaphone,
  DollarSign,
  Wrench,
  Wifi,
  ShieldCheck,
  RefreshCw,
  DoorOpen,
  Check,
  Calendar,
  Layers
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardOverview = () => {
  const { user } = useAuth();
  const role = user?.role || 'admin';
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [statsRes, actRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activities')
      ]);
      if (statsRes.data?.success) setStats(statsRes.data.data);
      if (actRes.data?.success) setActivities(actRes.data.data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
        <p className="text-sm text-slate-400">Loading live PG operations data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Role Context */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              {role} Dashboard
            </span>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Operational Sync
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
            Welcome back, {user?.name}! 👋
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {role === 'admin' && 'Real-time PG occupancy, financial cashflow, complaints, and facility metrics.'}
            {role === 'tenant' && 'Your assigned room status, upcoming rent invoice, and notices.'}
            {role === 'staff' && 'Maintenance queue, daily room servicing, and visitor gate logs.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <Link
            to="/ai-assistant"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Gemini Assistant
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ADMIN DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {role === 'admin' && stats && (
        <>
          {/* 4 Primary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Occupancy Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Occupancy Rate</span>
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Building className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-100">{stats.occupancy.occupancyRate}%</span>
                <span className="text-xs text-slate-400">({stats.occupancy.occupiedBeds}/{stats.occupancy.totalBeds} Beds)</span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.occupancy.occupancyRate}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                <span>{stats.occupancy.availableBeds} beds vacant</span>
                <span>{stats.occupancy.totalRooms} total rooms</span>
              </div>
            </div>

            {/* Collected Revenue Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Revenue Collected</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400">₹{stats.financials.revenueCollected.toLocaleString()}</span>
              </div>
              <p className="text-xs text-emerald-400/90 mt-2 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3.5 h-3.5" /> August 2026 Collection
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                <span>Total Tenants: {stats.totalTenants}</span>
                <span>Expenses: ₹{stats.financials.totalExpenses.toLocaleString()}</span>
              </div>
            </div>

            {/* Pending Dues Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Pending Dues</span>
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <Receipt className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-amber-400">₹{stats.financials.pendingDues.toLocaleString()}</span>
              </div>
              <p className="text-xs text-amber-400/80 mt-2 font-medium">
                1 Unpaid Invoices Due
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                <Link to="/invoices" className="text-indigo-400 hover:underline flex items-center gap-0.5">
                  Send Rent Reminders <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Active Complaints Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/40 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Maintenance Hub</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-rose-400">{stats.complaints.open} Active</span>
                <span className="text-xs text-slate-400">/ {stats.complaints.total} Total</span>
              </div>
              <p className="text-xs text-rose-400/80 mt-2 font-medium">
                {stats.complaints.highPriority} High Priority Ticket
              </p>
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-800/80">
                <span>Assigned to Staff: {stats.totalStaff}</span>
                <Link to="/complaints" className="text-indigo-400 hover:underline flex items-center gap-0.5">
                  Review <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

          </div>

          {/* Middle Section: Quick Actions & Room Type Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Quick Action Hub */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                Quick Admin Actions
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/rooms"
                  className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-indigo-600/20 border border-slate-700/60 hover:border-indigo-500/40 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
                    <DoorOpen className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Manage Rooms</span>
                </Link>

                <Link
                  to="/tenants"
                  className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-emerald-600/20 border border-slate-700/60 hover:border-emerald-500/40 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Onboard Tenant</span>
                </Link>

                <Link
                  to="/invoices"
                  className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-amber-600/20 border border-slate-700/60 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Create Invoices</span>
                </Link>

                <Link
                  to="/notices"
                  className="p-3.5 rounded-xl bg-slate-800/60 hover:bg-violet-600/20 border border-slate-700/60 hover:border-violet-500/40 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                >
                  <div className="p-2.5 rounded-lg bg-violet-500/10 text-violet-400 group-hover:scale-110 transition-transform">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">Post Notice</span>
                </Link>
              </div>

              {/* Gemini Quick Prompt suggestion */}
              <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-violet-950/40 to-indigo-950/40 border border-indigo-500/20">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Gemini Smart Recommendation
                </div>
                <p className="text-[11px] text-slate-400">
                  "You have 3 vacant beds in 2nd floor rooms. Gemini can auto-generate rent reminder messages or marketing flyers."
                </p>
              </div>
            </div>

            {/* Room Distribution Breakdown */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Room Inventory by Type
              </h3>

              <div className="space-y-3.5">
                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Single Bed Rooms</span>
                    <span className="text-indigo-400 font-bold">{stats.roomTypes.single} Units</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Double Sharing Rooms</span>
                    <span className="text-emerald-400 font-bold">{stats.roomTypes.double} Units</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium text-slate-300 mb-1">
                    <span>Triple Sharing Rooms</span>
                    <span className="text-amber-400 font-bold">{stats.roomTypes.triple} Units</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '20%' }}></div>
                  </div>
                </div>
              </div>

              <div className="mt-5 p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between text-xs">
                <span className="text-slate-400">Total PG Capacity:</span>
                <span className="font-bold text-slate-200">{stats.occupancy.totalBeds} Registered Beds</span>
              </div>
            </div>

            {/* Recent Operational Activities */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4 text-violet-400" />
                  Live Activity Stream
                </h3>
                <span className="text-[10px] text-slate-500 uppercase font-semibold">Realtime</span>
              </div>

              <div className="space-y-3">
                {activities.map((act) => (
                  <div key={act.id} className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-200 truncate">{act.title}</p>
                        <span className="text-[10px] text-slate-500 shrink-0">{act.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{act.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* TENANT DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {role === 'tenant' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Room Allocation Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 lg:col-span-2">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div>
                <span className="text-xs font-semibold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Active Stay
                </span>
                <h3 className="text-2xl font-bold text-slate-100 mt-1">Room #{stats.room?.roomNumber || '102'}</h3>
                <p className="text-xs text-slate-400 capitalize">{stats.room?.type || 'Double'} Sharing • Floor {stats.room?.floor || 1}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Monthly Rent</span>
                <span className="text-2xl font-extrabold text-indigo-400">₹{stats.room?.rent || 7500}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Included Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {(stats.room?.amenities || ['AC', 'Attached Bathroom', 'High-Speed WiFi', 'Wardrobe']).map((amenity, i) => (
                  <span key={i} className="px-3 py-1 rounded-lg bg-slate-800 text-xs text-slate-300 border border-slate-700 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-3">
              <Link
                to="/complaints"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
              >
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Raise Maintenance Ticket
              </Link>
              <Link
                to="/ai-assistant"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Ask Room AI Assistant
              </Link>
            </div>
          </div>

          {/* Latest Rent & Invoicing */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Latest Rent Status
            </h3>

            {stats.invoiceSummary?.latestInvoice ? (
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{stats.invoiceSummary.latestInvoice.month}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${stats.invoiceSummary.latestInvoice.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    {stats.invoiceSummary.latestInvoice.status}
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-100">
                  ₹{stats.invoiceSummary.latestInvoice.totalAmount}
                </div>
                <div className="text-xs text-slate-400">
                  Payment Mode: <span className="text-slate-200 font-medium">{stats.invoiceSummary.latestInvoice.paymentMode}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No pending invoices found.</p>
            )}

            <div className="mt-5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">PG Announcements</h4>
              <div className="space-y-2">
                {(stats.latestNotices || []).map((notice) => (
                  <div key={notice._id} className="p-2.5 rounded-xl bg-slate-800/30 border border-slate-800 text-xs">
                    <p className="font-semibold text-slate-200">{notice.title}</p>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{notice.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* STAFF DASHBOARD VIEW */}
      {/* ========================================================================= */}
      {role === 'staff' && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 lg:col-span-2">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Assigned Maintenance Tasks ({stats.maintenance.assignedTasks})
            </h3>

            <div className="space-y-3">
              {(stats.maintenance.pendingTasks || []).map((task) => (
                <div key={task._id} className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400">Room #{task.roomNumber}</span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        {task.priority} Priority
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-100 mt-1">{task.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{task.description}</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                    {task.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" />
              Hostel Facility Status
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 flex justify-between">
                <span>Rooms Under Maintenance:</span>
                <span className="font-bold text-amber-400">{stats.roomsUnderMaintenance}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 flex justify-between">
                <span>Total Inspected Rooms:</span>
                <span className="font-bold text-slate-100">{stats.totalRooms}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
