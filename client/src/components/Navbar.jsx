import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Sparkles, Check, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  const roleColors = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    tenant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    staff: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      // Quiet fail if network/notifications not ready
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Powered by Gemini AI
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
                title="Notifications"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs text-slate-200 uppercase tracking-wider">Notifications</h4>
                      {unreadCount > 0 && (
                        <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-full font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60 mt-2 scrollbar-none">
                    {notifications.length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n._id}
                          onClick={() => !n.isRead && markSingleAsRead(n._id)}
                          className={`py-2.5 px-2 rounded-lg cursor-pointer transition-colors ${
                            n.isRead ? 'opacity-60 hover:bg-slate-800/30' : 'bg-indigo-500/5 hover:bg-indigo-500/10'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-xs font-semibold text-slate-200">{n.title}</h5>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                          <span className="text-[9px] text-slate-500 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <span className={`text-xs font-semibold uppercase px-2.5 py-1 rounded-full border ${roleColors[user.role] || roleColors.tenant}`}>
              {user.role}
            </span>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <img
                src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
                alt={user.name}
                className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700"
              />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
