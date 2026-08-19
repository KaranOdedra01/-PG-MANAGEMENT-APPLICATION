import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Zap, 
  Droplet, 
  Users, 
  Wrench, 
  Wifi, 
  ShoppingBag, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  RefreshCw, 
  X,
  CreditCard,
  Layers
} from 'lucide-react';

const CATEGORY_META = {
  electricity: { label: 'Electricity Bill', icon: Zap, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  salary: { label: 'Staff Salary', icon: Users, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  water: { label: 'Water & RO Filter', icon: Droplet, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  maintenance: { label: 'Building Maintenance', icon: Wrench, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  internet: { label: 'WiFi & Internet', icon: Wifi, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  groceries: { label: 'Mess & Groceries', icon: ShoppingBag, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  other: { label: 'Miscellaneous', icon: MoreHorizontal, color: 'bg-slate-800 text-slate-400 border-slate-700' }
};

export const Expenses = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: 'electricity',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Bank Transfer',
    receiptRef: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [expRes, sumRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/summary')
      ]);
      if (expRes.data?.success) setExpenses(expRes.data.data);
      if (sumRes.data?.success) setSummary(sumRes.data.data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredExpenses = expenses.filter((e) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      e.description.toLowerCase().includes(q) || 
      e.category.toLowerCase().includes(q) ||
      (e.receiptRef && e.receiptRef.toLowerCase().includes(q));
    const matchesCategory = categoryFilter === 'all' || e.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });
  const openAddModal = () => {
    setEditingExpense(null);
    setFormData({
      category: 'electricity',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMode: 'Bank Transfer',
      receiptRef: ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setFormData({
      category: exp.category,
      amount: exp.amount,
      description: exp.description,
      date: new Date(exp.date).toISOString().split('T')[0],
      paymentMode: exp.paymentMode || 'Bank Transfer',
      receiptRef: exp.receiptRef || ''
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      if (editingExpense) {
        await api.put('/expenses/' + editingExpense._id, formData);
      } else {
        await api.post('/expenses', formData);
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense record?')) {
      try {
        await api.delete('/expenses/' + id);
        fetchData();
      } catch (err) {
        alert('Failed to delete expense');
      }
    }
  };

  // Export Expenses to CSV
  const exportToCSV = () => {
    if (expenses.length === 0) return alert('No expenses available to export');

    const headers = ['Date', 'Category', 'Description', 'Amount (INR)', 'Payment Mode', 'Receipt Ref', 'Added By'];
    const rows = expenses.map(e => [
      new Date(e.date).toLocaleDateString(),
      e.category,
      '"' + e.description.replace(/"/g, '""') + '"',
      e.amount,
      e.paymentMode,
      e.receiptRef || 'N/A',
      e.addedBy || 'Admin'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PG_Expenses_Report_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
              Module 6 • Expense & P&L Tracker
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-rose-400" />
            Operational Expenses & P&L
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Track utility bills, staff payroll, maintenance outflows, and overall net operating profit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            Export CSV
          </button>
          <button
            onClick={openAddModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/25 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log New Expense
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Total Revenue Inflows</span>
            <span className="text-2xl font-bold text-emerald-400">₹{summary.totalRevenue.toLocaleString()}</span>
            <p className="text-xs text-slate-400 mt-1">From tenant paid rent</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block mb-1">Operating Expenses</span>
            <span className="text-2xl font-bold text-rose-400">₹{summary.totalExpenses.toLocaleString()}</span>
            <p className="text-xs text-slate-400 mt-1">Across {summary.expenseCount} logged bills</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Net Operating Profit</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ₹{summary.netProfit.toLocaleString()}
              </span>
              <span className={`text-xs font-bold ${summary.netProfit >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                ({summary.profitMargin}% Margin)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Revenue minus operational outflows</p>
          </div>
        </div>
      )}

      {/* Category-Wise Spend Breakdown */}
      {summary?.categoryTotals && (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            Spending Breakdown by Category
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(summary.categoryTotals).map(([catKey, total]) => {
              const meta = CATEGORY_META[catKey] || CATEGORY_META.other;
              const Icon = meta.icon;
              return (
                <div key={catKey} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                  <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate">{meta.label}</span>
                  <span className="text-sm font-bold text-slate-100 mt-0.5 block">₹{total.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search description, category, ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Categories</option>
            <option value="electricity">Electricity</option>
            <option value="salary">Staff Salary</option>
            <option value="water">Water & RO</option>
            <option value="maintenance">Maintenance</option>
            <option value="internet">Internet & WiFi</option>
            <option value="groceries">Groceries & Mess</option>
            <option value="other">Other</option>
          </select>

          <button
            onClick={fetchData}
            title="Reload Expenses"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-rose-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading expense ledger...</p>
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <DollarSign className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No expense records found</p>
          <p className="text-xs text-slate-500 mt-1">Log a new bill or change your search filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((exp) => {
            const meta = CATEGORY_META[exp.category] || CATEGORY_META.other;
            const Icon = meta.icon;
            return (
              <div
                key={exp._id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-10 h-10 rounded-xl ${meta.color} flex items-center justify-center shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-100">{exp.description}</h4>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.color}`}>
                        {exp.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>{new Date(exp.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Paid via: <strong className="text-slate-300">{exp.paymentMode}</strong></span>
                      {exp.receiptRef && <span>• Ref: {exp.receiptRef}</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-lg font-black text-rose-400">-₹{exp.amount.toLocaleString()}</span>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditModal(exp)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-indigo-400 transition-colors"
                        title="Edit Expense"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(exp._id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-400" />
                {editingExpense ? 'Edit Expense' : 'Log New Expense'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Category *</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                >
                  <option value="electricity">Electricity Bill</option>
                  <option value="salary">Staff Salary</option>
                  <option value="water">Water & RO Filtration</option>
                  <option value="maintenance">Building Maintenance</option>
                  <option value="internet">WiFi & Internet</option>
                  <option value="groceries">Mess & Food Supplies</option>
                  <option value="other">Miscellaneous</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="e.g. 4500"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description / Vendor Name *</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Torrent Power July Bill / Caretaker Salary"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Mode</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Receipt / Invoice Ref</label>
                  <input
                    type="text"
                    value={formData.receiptRef}
                    onChange={(e) => setFormData({ ...formData, receiptRef: e.target.value })}
                    placeholder="e.g. BILL-9982"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;