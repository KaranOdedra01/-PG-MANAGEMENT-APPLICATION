import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  DoorOpen,
  Users,
  Receipt,
  DollarSign,
  Wrench,
  Megaphone,
  UtensilsCrossed,
  ShieldCheck,
  FileText,
  Bot,
  LogOut,
  Building2,
  X
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const role = user?.role || 'tenant';

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'tenant', 'staff'] },
    { to: '/rooms', label: 'Rooms & Beds', icon: DoorOpen, roles: ['admin', 'staff'] },
    { to: '/tenants', label: 'Tenants & KYC', icon: Users, roles: ['admin', 'staff'] },
    { to: '/invoices', label: role === 'tenant' ? 'My Invoices & Dues' : 'Rent & Invoicing', icon: Receipt, roles: ['admin', 'tenant', 'staff'] },
    { to: '/expenses', label: 'Expense Tracker', icon: DollarSign, roles: ['admin'] },
    { to: '/complaints', label: role === 'tenant' ? 'Raise Complaint' : 'Complaints Hub', icon: Wrench, roles: ['admin', 'tenant', 'staff'] },
    { to: '/notices', label: 'Notice Board', icon: Megaphone, roles: ['admin', 'tenant', 'staff'] },
    { to: '/mess', label: 'Mess & Food', icon: UtensilsCrossed, roles: ['admin', 'tenant', 'staff'] },
    { to: '/visitors', label: 'Visitor Logs', icon: ShieldCheck, roles: ['admin', 'staff'] },
    { to: '/reports', label: 'Reports & Analytics', icon: FileText, roles: ['admin'] },
    { to: '/ai-assistant', label: 'Gemini AI Assistant', icon: Bot, roles: ['admin', 'tenant', 'staff'], badge: 'AI 2.0' },
  ];

  const filteredLinks = links.filter((l) => l.roles.includes(role));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sticky Desktop & Off-Canvas Mobile Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 inset-y-0 left-0 z-50 w-64 h-screen bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight text-slate-100 flex items-center gap-1.5">
                  PG MASTER <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-md">PRO</span>
                </h1>
                <span className="text-[10px] text-slate-500 block">Smart PG Management</span>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 scrollbar-none">
            {filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-200 block truncate">{user?.name || 'User'}</span>
                <span className="text-[10px] font-semibold text-slate-500 capitalize">{role}</span>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
