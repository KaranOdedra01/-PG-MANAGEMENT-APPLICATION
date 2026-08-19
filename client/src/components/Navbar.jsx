import React from 'react';
import { LogOut, User, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout } = useAuth();

  const roleColors = {
    admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    tenant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    staff: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          Gemini 3.6 Flash Enabled
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
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
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
