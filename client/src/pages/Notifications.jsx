import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  Bell, 
  CheckCheck, 
  Receipt, 
  Wrench, 
  Megaphone, 
  DoorOpen, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      alert('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        // Continue navigation regardless
      }
    }

    if (notif.link) {
      navigate(notif.link);
    }
  };

  const formatRelativeTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    if (diffSec < 172800) return 'Yesterday';
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'invoice':
      case 'payment':
        return <Receipt className="w-5 h-5 text-emerald-500" />;
      case 'complaint':
        return <Wrench className="w-5 h-5 text-rose-500" />;
      case 'notice':
        return <Megaphone className="w-5 h-5 text-amber-500" />;
      case 'visitor':
        return <DoorOpen className="w-5 h-5 text-cyan-500" />;
      case 'room':
        return <ShieldAlert className="w-5 h-5 text-violet-500" />;
      default:
        return <Bell className="w-5 h-5 text-indigo-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Notification Inbox
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-indigo-500" />
            Alerts & Activity Notifications
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Stay updated with rent invoices, maintenance ticket updates, visitor entries, and management broadcasts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchNotifications}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? 'Marking...' : 'Mark All Read'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">You're All Caught Up!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No new alerts or pending notices at this moment. You will be notified when rent is generated or a complaint status changes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                  !notif.isRead
                    ? 'border-l-4 border-l-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/10'
                    : ''
                }`}
              >
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  {getTypeIcon(notif.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className={`text-sm tracking-tight ${!notif.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.link && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {!notif.isRead && (
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mt-2 shrink-0 animate-pulse" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
