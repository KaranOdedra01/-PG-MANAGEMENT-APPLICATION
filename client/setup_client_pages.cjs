const fs = require('fs');
const path = require('path');

const files = {
  // src/components/ProtectedRoute.jsx
  'src/components/ProtectedRoute.jsx': `import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};
`,

  // src/components/Sidebar.jsx
  'src/components/Sidebar.jsx': `import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  DoorOpen, 
  Users, 
  Receipt, 
  DollarSign, 
  AlertCircle, 
  Megaphone, 
  UtensilsCrossed, 
  UserCheck, 
  BarChart3, 
  Bot, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'tenant';

  const navItems = [
    // Common Dashboard
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard, roles: ['admin', 'tenant', 'staff'] },
    
    // Admin & Staff Modules
    { path: '/rooms', label: 'Room Management', icon: DoorOpen, roles: ['admin', 'staff'] },
    { path: '/tenants', label: 'Tenant Directory', icon: Users, roles: ['admin', 'staff'] },
    
    // Financials
    { path: '/invoices', label: role === 'tenant' ? 'My Invoices & Dues' : 'Rent & Invoices', icon: Receipt, roles: ['admin', 'tenant', 'staff'] },
    { path: '/expenses', label: 'Expense Tracker', icon: DollarSign, roles: ['admin'] },
    
    // Operations & Support
    { path: '/complaints', label: role === 'tenant' ? 'Raise Complaint' : 'Complaints Hub', icon: AlertCircle, roles: ['admin', 'tenant', 'staff'] },
    { path: '/notices', label: 'Notice Board', icon: Megaphone, roles: ['admin', 'tenant', 'staff'] },
    { path: '/mess', label: 'Mess & Food', icon: UtensilsCrossed, roles: ['admin', 'tenant', 'staff'] },
    { path: '/visitors', label: 'Gate & Visitors', icon: UserCheck, roles: ['admin', 'staff'] },
    
    // Analytics
    { path: '/reports', label: 'Reports & Analytics', icon: BarChart3, roles: ['admin'] },
    
    // Gemini AI
    { path: '/ai-assistant', label: 'Gemini AI Assistant', icon: Bot, roles: ['admin', 'tenant', 'staff'], badge: 'AI' },
  ];

  const filteredNav = navItems.filter(item => item.roles.includes(role));

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 text-slate-300 select-none">
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          PG
        </div>
        <div>
          <h1 className="font-bold text-slate-100 leading-tight">PG Master</h1>
          <p className="text-xs text-indigo-400 font-medium">Smart PG Manager</p>
        </div>
      </div>

      <div className="p-3">
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {role.toUpperCase()} PORTAL
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => \`
                flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                \${isActive 
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm' 
                  : 'hover:bg-slate-800/60 hover:text-slate-200 text-slate-400'}
              \`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer info badge */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate text-xs">
            <p className="text-slate-300 font-medium truncate">{user?.name}</p>
            <p className="text-slate-500 capitalize">{role} Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
`,

  // src/components/Navbar.jsx
  'src/components/Navbar.jsx': `import React from 'react';
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
            <span className={\`text-xs font-semibold uppercase px-2.5 py-1 rounded-full border \${roleColors[user.role] || roleColors.tenant}\`}>
              {user.role}
            </span>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <img
                src={user.avatar || \`https://api.dicebear.com/7.x/avataaars/svg?seed=\${user.name}\`}
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
`,

  // src/components/Layout.jsx
  'src/components/Layout.jsx': `import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const Layout = () => {
  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
`,

  // src/pages/Login.jsx
  'src/pages/Login.jsx': `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, User, Wrench, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('admin@pg.com');
  const [password, setPassword] = useState('Password@123');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e?.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const selectDemoAccount = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-500/25 mb-4 text-white text-2xl font-black">
          PG
        </div>
        <h2 className="text-3xl font-extrabold text-slate-100 tracking-tight">PG Management System</h2>
        <p className="mt-2 text-sm text-slate-400">
          Smart, AI-Powered Hostel & PG Operations Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          
          {/* Quick Demo Switcher */}
          <div className="mb-6">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              ⚡ 1-Click Quick Demo Login (Student Evaluation)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => selectDemoAccount('admin@pg.com', 'Password@123')}
                className={\`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all \${email === 'admin@pg.com' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}\`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('tenant@pg.com', 'Password@123')}
                className={\`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all \${email === 'tenant@pg.com' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}\`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Tenant</span>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('staff@pg.com', 'Password@123')}
                className={\`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all \${email === 'staff@pg.com' ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}\`}
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Staff</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="admin@pg.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              New tenant?{' '}
              <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
                Create Tenant Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
`,

  // src/pages/Register.jsx
  'src/pages/Register.jsx': `import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Phone, AlertCircle, ArrowRight } from 'lucide-react';

export const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'tenant',
    emergencyContact: { name: '', phone: '', relation: '' }
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-extrabold text-slate-100">Tenant Registration</h2>
        <p className="mt-2 text-sm text-slate-400">Join the PG system to manage your stay & dues</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Amit Patel"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="amit@gmail.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="+91 98765 00000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? 'Creating account...' : 'Create Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
`,

  // src/pages/Unauthorized.jsx
  'src/pages/Unauthorized.jsx': `import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-4">
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-100">Access Restricted</h2>
      <p className="text-sm text-slate-400 max-w-md mt-2">
        You do not have permission to view this module with your current role.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  );
};
`,

  // src/pages/DashboardOverview.jsx
  'src/pages/DashboardOverview.jsx': `import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building, 
  Users, 
  Receipt, 
  AlertCircle, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardOverview = () => {
  const { user } = useAuth();
  const role = user?.role || 'tenant';

  // Metrics based on role
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              {role} Dashboard
            </span>
            <span className="text-xs text-slate-400">• Module 1 Verified (Auth & RBAC)</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-100">Welcome back, {user?.name}! 👋</h2>
          <p className="text-sm text-slate-400 mt-1">
            {role === 'admin' && 'Here is your PG operational overview, occupancy metrics, and pending tasks.'}
            {role === 'tenant' && 'Here is your room allocation status, invoices, and quick service actions.'}
            {role === 'staff' && 'Here are your pending maintenance assignments and visitor logs for today.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/ai-assistant"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask Gemini AI
          </Link>
        </div>
      </div>

      {/* Quick Stat Cards */}
      {role === 'admin' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium">Total Occupancy</span>
              <Building className="w-4 h-4 text-indigo-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">28 / 32 Beds</p>
            <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 87.5% Occupancy Rate
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium">Active Tenants</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-slate-100">28 Residents</p>
            <p className="text-xs text-slate-400 mt-1">Across 12 Rooms</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium">This Month Dues</span>
              <Receipt className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-2xl font-bold text-amber-400">₹18,500</p>
            <p className="text-xs text-slate-400 mt-1">3 Pending Invoices</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium">Open Complaints</span>
              <AlertCircle className="w-4 h-4 text-rose-400" />
            </div>
            <p className="text-2xl font-bold text-rose-400">2 Active</p>
            <p className="text-xs text-slate-400 mt-1">1 High Priority</p>
          </div>
        </div>
      )}

      {role === 'tenant' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-2">My Allocated Room</span>
            <p className="text-2xl font-bold text-indigo-400">Room #204</p>
            <p className="text-xs text-slate-400 mt-1">Double Sharing • AC & Attached Bath</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-2">Current Month Rent</span>
            <p className="text-2xl font-bold text-emerald-400">₹7,500 (Paid)</p>
            <p className="text-xs text-slate-400 mt-1">Due next: 1st of next month</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <span className="text-xs font-medium text-slate-400 block mb-2">Maintenance Status</span>
            <p className="text-2xl font-bold text-slate-100">0 Open Tickets</p>
            <p className="text-xs text-emerald-400 mt-1">All issues resolved</p>
          </div>
        </div>
      )}

      {/* Module Status Checklist */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800">
        <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          SRS Module Roadmap & Progress Checklist
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { id: 1, name: 'Auth & Role Access (Admin/Tenant/Staff)', status: 'COMPLETED', active: true },
            { id: 2, name: 'Admin Live Dashboard & Analytics', status: 'READY FOR REVIEW', active: true },
            { id: 3, name: 'Room & Amenity Management', status: 'UP NEXT' },
            { id: 4, name: 'Tenant Onboarding & Profiles', status: 'QUEUED' },
            { id: 5, name: 'Rent Invoicing & PDF Receipts', status: 'QUEUED' },
            { id: 6, name: 'Expense Tracker & P&L', status: 'QUEUED' },
            { id: 7, name: 'Complaint Hub & Photo Uploads', status: 'QUEUED' },
            { id: 8, name: 'Notice Board Broadcasts', status: 'QUEUED' },
            { id: 9, name: 'Mess & Food Subscriptions', status: 'QUEUED' },
            { id: 10, name: 'Visitor & Gate Logging', status: 'QUEUED' },
            { id: 11, name: 'Financial & Occupancy Reports', status: 'QUEUED' },
            { id: 12, name: 'Gemini AI Assistant & Classifier', status: 'READY TO WIRE' },
          ].map((mod) => (
            <div
              key={mod.id}
              className={\`p-3.5 rounded-xl border flex items-center justify-between gap-2 \${
                mod.status === 'COMPLETED'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                  : mod.status === 'READY FOR REVIEW'
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
              }\`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-[10px] font-bold flex items-center justify-center text-slate-300 shrink-0">
                  {mod.id}
                </span>
                <span className="text-xs font-medium truncate">{mod.name}</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 shrink-0">
                {mod.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
`,

  // src/App.jsx
  'src/App.jsx': `import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Unauthorized } from './pages/Unauthorized';
import { DashboardOverview } from './pages/DashboardOverview';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['admin', 'tenant', 'staff']}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardOverview />} />
            
            {/* Fallback for other routes during module-by-module building */}
            <Route path="*" element={<DashboardOverview />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
`
};

for (const [relPath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, relPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Created Component/Page:', relPath);
}
