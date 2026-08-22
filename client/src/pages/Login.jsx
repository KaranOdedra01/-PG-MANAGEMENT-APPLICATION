import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Shield, User, Wrench, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${email === 'admin@pg.com' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('tenant@pg.com', 'Password@123')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${email === 'tenant@pg.com' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}`}
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Tenant</span>
              </button>

              <button
                type="button"
                onClick={() => selectDemoAccount('staff@pg.com', 'Password@123')}
                className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${email === 'staff@pg.com' ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-sm' : 'border-slate-800 bg-slate-800/60 text-slate-400 hover:border-slate-700'}`}
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
