import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  UtensilsCrossed, 
  Sun, 
  Sunrise, 
  Moon, 
  Coffee, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Sparkles, 
  Calendar, 
  Clock, 
  DollarSign, 
  RefreshCw, 
  X, 
  Check, 
  Flame,
  ChefHat
} from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const Mess = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTenant = user?.role === 'tenant';

  const [menu, setMenu] = useState([]);
  const [headcount, setHeadcount] = useState(null);
  const [mySubscription, setMySubscription] = useState(null);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [loading, setLoading] = useState(true);

  // Edit Menu Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    day: 'Monday',
    breakfast: '',
    lunch: '',
    snacks: '',
    dinner: '',
    specialNote: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [menuRes, headRes] = await Promise.all([
        api.get('/mess/menu'),
        api.get('/mess/headcount')
      ]);
      if (menuRes.data?.success) setMenu(menuRes.data.data);
      if (headRes.data?.success) setHeadcount(headRes.data.data);

      if (isTenant) {
        const subRes = await api.get('/mess/my-subscription');
        if (subRes.data?.success) setMySubscription(subRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load mess data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Determine current day of week
    const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    if (DAYS.includes(currentDayName)) {
      setSelectedDay(currentDayName);
    }
    fetchData();
  }, [user]);

  const activeDayMenu = menu.find(m => m.day.toLowerCase() === selectedDay.toLowerCase()) || menu[0];

  const handleToggleAttendance = async (mealType) => {
    try {
      await api.patch('/mess/attendance', { mealType });
      fetchData();
    } catch (err) {
      alert('Failed to update meal attendance');
    }
  };

  const handlePlanChange = async (newPlan) => {
    try {
      await api.patch('/mess/plan', { plan: newPlan });
      fetchData();
    } catch (err) {
      alert('Failed to change meal plan');
    }
  };
  const openEditModal = (dayMenu) => {
    setEditFormData({
      day: dayMenu.day,
      breakfast: dayMenu.breakfast,
      lunch: dayMenu.lunch,
      snacks: dayMenu.snacks,
      dinner: dayMenu.dinner,
      specialNote: dayMenu.specialNote || ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.put('/mess/menu', editFormData);
      setIsEditModalOpen(false);
      fetchData();
    } catch (err) {
      alert('Failed to update menu');
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Module 9 • Mess & Dining Facility
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <UtensilsCrossed className="w-7 h-7 text-emerald-400" />
            Hostel Mess & Dining
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Weekly 4-meal curated menu, live dining headcounts, diet preferences, and meal attendance toggles.
          </p>
        </div>

        <button
          onClick={fetchData}
          title="Reload Mess Data"
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Headcount Bar (Admin & Staff) */}
      {headcount && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <ChefHat className="w-4 h-4" /> Today's Live Kitchen Headcount
              </span>
              <p className="text-xs text-slate-400 mt-0.5">Estimated portions based on resident meal attendance</p>
            </div>
            <span className="text-xs font-semibold text-slate-300 bg-slate-800 px-3 py-1 rounded-lg">
              Total Subscribed Residents: {headcount.totalSubscribedTenants}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
                <Sunrise className="w-3.5 h-3.5 text-amber-400" /> Breakfast
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {headcount.headcount?.breakfast || 0}
              </span>
              <span className="text-[10px] text-slate-500">7:30 AM – 9:30 AM</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
                <Sun className="w-3.5 h-3.5 text-emerald-400" /> Lunch
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                {headcount.headcount?.lunch || 0}
              </span>
              <span className="text-[10px] text-slate-500">12:30 PM – 2:30 PM</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <span className="text-xs text-slate-400 block flex items-center justify-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dinner
              </span>
              <span className="text-2xl font-black text-indigo-400 mt-1 block">
                {headcount.headcount?.dinner || 0}
              </span>
              <span className="text-[10px] text-slate-500">8:00 PM – 10:00 PM</span>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Daily Meal Attendance Switchers */}
      {isTenant && mySubscription && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/20 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-indigo-400" />
                My Today's Dining Attendance
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle if you plan to skip a meal today to help us eliminate food waste.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 self-start sm:self-auto">
              Plan: {mySubscription.subscription?.plan?.toUpperCase()} (₹{mySubscription.subscription?.monthlyCharge}/mo)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {['breakfast', 'lunch', 'dinner'].map((mKey) => {
              const isAttending = mySubscription.todayAttendance?.[mKey];
              return (
                <div key={mKey} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 capitalize flex items-center gap-1.5">
                    {mKey === 'breakfast' && <Sunrise className="w-4 h-4 text-amber-400" />}
                    {mKey === 'lunch' && <Sun className="w-4 h-4 text-emerald-400" />}
                    {mKey === 'dinner' && <Moon className="w-4 h-4 text-indigo-400" />}
                    {mKey}
                  </span>

                  <button
                    onClick={() => handleToggleAttendance(mKey)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      isAttending
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isAttending ? 'Attending' : 'Skipping'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7-Day Day Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
        {DAYS.map((d) => (
          <button
            key={d}
            onClick={() => setSelectedDay(d)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedDay.toLowerCase() === d.toLowerCase()
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* 4 Meals Card Grid for Selected Day */}
      {activeDayMenu && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">{activeDayMenu.day}'s Timetable</h3>
              {activeDayMenu.specialNote && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  {activeDayMenu.specialNote}
                </span>
              )}
            </div>

            {isAdmin && (
              <button
                onClick={() => openEditModal(activeDayMenu)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                Customize Menu
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Breakfast Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/30 transition-all space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sunrise className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">7:30 – 9:30 AM</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Breakfast</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{activeDayMenu.breakfast}</p>
              </div>
            </div>

            {/* Lunch Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sun className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">12:30 – 2:30 PM</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Lunch</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{activeDayMenu.lunch}</p>
              </div>
            </div>

            {/* High Tea Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-violet-500/30 transition-all space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Coffee className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">5:00 – 6:30 PM</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Evening Snacks</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{activeDayMenu.snacks}</p>
              </div>
            </div>

            {/* Dinner Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/30 transition-all space-y-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Moon className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-500 font-semibold">8:00 – 10:00 PM</span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Dinner</h4>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line">{activeDayMenu.dinner}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MENU MODAL (Admin) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
                Edit {editFormData.day} Menu
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Breakfast Menu</label>
                <input
                  type="text"
                  required
                  value={editFormData.breakfast}
                  onChange={(e) => setEditFormData({ ...editFormData, breakfast: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Lunch Menu</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.lunch}
                  onChange={(e) => setEditFormData({ ...editFormData, lunch: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Evening Snacks</label>
                <input
                  type="text"
                  required
                  value={editFormData.snacks}
                  onChange={(e) => setEditFormData({ ...editFormData, snacks: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dinner Menu</label>
                <textarea
                  rows={2}
                  required
                  value={editFormData.dinner}
                  onChange={(e) => setEditFormData({ ...editFormData, dinner: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Special Chef Note</label>
                <input
                  type="text"
                  value={editFormData.specialNote}
                  onChange={(e) => setEditFormData({ ...editFormData, specialNote: e.target.value })}
                  placeholder="e.g. Special Sweet Dish / Paneer Night"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Menu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Mess;