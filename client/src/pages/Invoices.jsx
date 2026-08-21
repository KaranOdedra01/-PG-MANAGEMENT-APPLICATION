import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Receipt, DollarSign, Download, CheckCircle2, Clock, AlertCircle, 
  Search, Plus, Layers, Calendar, CreditCard, User, DoorOpen, 
  Trash2, RefreshCw, X, Send, Zap 
} from 'lucide-react';

export const Invoices = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isTenant = user?.role === 'tenant';

  const [invoices, setInvoices] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const [batchData, setBatchData] = useState({
    month: 'September 2026',
    electricityCharge: 500,
    maintenanceFee: 200,
    dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [singleData, setSingleData] = useState({
    tenantId: '',
    month: 'August 2026',
    baseRent: 7500,
    electricityCharge: 400,
    maintenanceFee: 200,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [payData, setPayData] = useState({
    paymentMode: 'UPI',
    transactionId: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      if (res.data?.success) setInvoices(res.data.data);

      if (isAdmin) {
        const tRes = await api.get('/tenants');
        if (tRes.data?.success) {
          const active = tRes.data.data.filter(t => t.status === 'active');
          setTenants(active);
          if (active.length > 0 && !singleData.tenantId) {
            setSingleData(prev => ({
              ...prev,
              tenantId: active[0].userId || active[0]._id,
              baseRent: active[0].monthlyRent || 7500
            }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [user]);

  const totalBilled = invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const totalPending = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0);
  const paidCount = invoices.filter(i => i.status === 'paid').length;
  const pendingCount = invoices.filter(i => i.status !== 'paid').length;

  const filteredInvoices = invoices.filter((i) => {
    const q = search.toLowerCase();
    const matchesSearch = 
      (i.tenantName && i.tenantName.toLowerCase().includes(q)) || 
      (i.roomNumber && i.roomNumber.includes(q)) ||
      (i.month && i.month.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchesMonth = monthFilter === 'all' || (i.month && i.month.toLowerCase().includes(monthFilter.toLowerCase()));
    return matchesSearch && matchesStatus && matchesMonth;
  });
  const handleBatchSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await api.post('/invoices/generate-monthly', batchData);
      setIsBatchModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Batch generation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSubmitting(true);
    try {
      await api.post('/invoices', singleData);
      setIsSingleModalOpen(false);
      fetchInvoices();
    } catch (err) {
      setModalError(err.response?.data?.message || err.message || 'Invoice creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.patch('/invoices/' + selectedInvoice._id + '/pay', payData);
      setIsPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      alert(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await api.delete('/invoices/' + id);
        fetchInvoices();
      } catch (err) {
        alert('Failed to delete invoice');
      }
    }
  };

  const generatePDFReceipt = (inv) => {
    const doc = new jsPDF();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PG MANAGEMENT SYSTEM', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(199, 210, 254);
    doc.text('Official Rent Payment Receipt & Tax Invoice', 15, 28);
    doc.text('Receipt #: ' + (inv._id ? inv._id.toUpperCase() : 'REC_001'), 135, 20);
    doc.text('Date: ' + new Date().toLocaleDateString(), 135, 28);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tenant & Room Details:', 15, 52);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Resident Name: ' + (inv.tenantName || 'Resident'), 15, 60);
    doc.text('Allocated Room: Room #' + (inv.roomNumber || '101'), 15, 67);
    doc.text('Billing Month: ' + inv.month, 15, 74);

    doc.text('Payment Status: ' + (inv.status || 'PAID').toUpperCase(), 130, 60);
    doc.text('Payment Mode: ' + (inv.paymentMode || 'UPI / Online'), 130, 67);
    doc.text('Paid Date: ' + (inv.paidDate ? new Date(inv.paidDate).toLocaleDateString() : new Date().toLocaleDateString()), 130, 74);

    const tableData = [
      ['1', 'Monthly Room Accommodation Rent', 'Rs. ' + (inv.baseRent ? inv.baseRent.toLocaleString() : '7,500')],
      ['2', 'Electricity & Power Utilities Charge', 'Rs. ' + (inv.electricityCharge ? inv.electricityCharge.toLocaleString() : '0')],
      ['3', 'Hostel Facility Maintenance & Sanitation Fee', 'Rs. ' + (inv.maintenanceFee ? inv.maintenanceFee.toLocaleString() : '0')],
      ['', 'TOTAL AMOUNT PAID', 'Rs. ' + (inv.totalAmount ? inv.totalAmount.toLocaleString() : '0')]
    ];

    autoTable(doc, {
      startY: 85,
      head: [['#', 'Item Description', 'Amount (INR)']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 120 },
        2: { cellWidth: 45, halign: 'right' }
      }
    });

    const finalY = (doc.lastAutoTable?.finalY || 140) + 25;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is an authorized system-generated receipt.', 15, finalY);
    doc.text('Thank you for your prompt payment!', 15, finalY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Authorized PG Signatory', 140, finalY);
    doc.setLineWidth(0.5);
    doc.line(140, finalY + 12, 195, finalY + 12);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PG Master Management Ltd.', 140, finalY + 17);

    doc.save('PG_Receipt_' + inv.month.replace(/\s+/g, '_') + '_Room' + inv.roomNumber + '.pdf');
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Module 5 • Rent & Invoicing
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-amber-400" />
            {isTenant ? 'My Rent Invoices & Receipts' : 'Rent Invoicing & Inbound Dues'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isTenant 
              ? 'View your monthly dues, simulate online payments, and download official PDF rent receipts.'
              : 'Auto-generate monthly rent invoices, track collected revenue, and download receipts.'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all"
            >
              <Zap className="w-4 h-4" />
              Batch Generate Invoices
            </button>
            <button
              onClick={() => setIsSingleModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Single Invoice
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Invoiced</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-100">₹{totalBilled.toLocaleString()}</span>
              <span className="text-xs text-slate-500">({invoices.length} Invoices)</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Collected Revenue</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">₹{totalCollected.toLocaleString()}</span>
              <span className="text-xs text-slate-400">({paidCount} Paid)</span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Pending Receivables</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-amber-400">₹{totalPending.toLocaleString()}</span>
              <span className="text-xs text-slate-400">({pendingCount} Unpaid)</span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col lg:flex-row gap-3 items-center justify-between">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by Tenant Name, Room #, Month..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {['all', 'paid', 'pending', 'overdue'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  statusFilter === st
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={fetchInvoices}
            title="Reload Invoices"
            className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-amber-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading invoice statements...</p>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
          <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-300">No invoice records found</p>
          <p className="text-xs text-slate-500 mt-1">Generate monthly invoices or create a single invoice.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const isPaid = inv.status === 'paid';
            return (
              <div
                key={inv._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                    <Receipt className="w-6 h-6" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="text-base font-bold text-slate-100">{inv.month}</h3>
                      <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                        Room #{inv.roomNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          isPaid
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span>Resident: <strong className="text-slate-200">{inv.tenantName}</strong></span>
                      <span>•</span>
                      <span>Due: {new Date(inv.dueDate).toLocaleDateString()}</span>
                      {inv.paidDate && <span>• Paid: {new Date(inv.paidDate).toLocaleDateString()}</span>}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span>Rent: <span className="text-slate-200 font-medium">₹{inv.baseRent}</span></span>
                      <span>+ Electricity: <span className="text-slate-200 font-medium">₹{inv.electricityCharge || 0}</span></span>
                      <span>+ Maintenance: <span className="text-slate-200 font-medium">₹{inv.maintenanceFee || 0}</span></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Payable</span>
                    <span className="text-xl font-black text-emerald-400">₹{inv.totalAmount.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isPaid && (
                      <button
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsPayModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {isTenant ? 'Pay Now' : 'Record Payment'}
                      </button>
                    )}

                    <button
                      onClick={() => generatePDFReceipt(inv)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold transition-colors flex items-center gap-1.5 border border-slate-700"
                      title="Download Official PDF Receipt"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      PDF Receipt
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(inv._id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Invoice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                Batch Generate Invoices
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Billing Month *</label>
                <input
                  type="text"
                  required
                  value={batchData.month}
                  onChange={(e) => setBatchData({ ...batchData, month: e.target.value })}
                  placeholder="e.g. September 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Electricity (₹/tenant)</label>
                  <input
                    type="number"
                    value={batchData.electricityCharge}
                    onChange={(e) => setBatchData({ ...batchData, electricityCharge: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Maintenance (₹/tenant)</label>
                  <input
                    type="number"
                    value={batchData.maintenanceFee}
                    onChange={(e) => setBatchData({ ...batchData, maintenanceFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Payment Due Date *</label>
                <input
                  type="date"
                  required
                  value={batchData.dueDate}
                  onChange={(e) => setBatchData({ ...batchData, dueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Generating...' : 'Generate Invoices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSingleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                Create Single Invoice
              </h3>
              <button
                onClick={() => setIsSingleModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Tenant Resident *</label>
                <select
                  required
                  value={singleData.tenantId}
                  onChange={(e) => {
                    const target = tenants.find(t => (t.userId || t._id) === e.target.value);
                    setSingleData({
                      ...singleData,
                      tenantId: e.target.value,
                      baseRent: target?.monthlyRent || 7500
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                >
                  {tenants.map((t) => (
                    <option key={t._id} value={t.userId || t._id}>
                      {t.name} (Room #{t.roomNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Month *</label>
                  <input
                    type="text"
                    required
                    value={singleData.month}
                    onChange={(e) => setSingleData({ ...singleData, month: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Base Rent (₹) *</label>
                  <input
                    type="number"
                    required
                    value={singleData.baseRent}
                    onChange={(e) => setSingleData({ ...singleData, baseRent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Electricity (₹)</label>
                  <input
                    type="number"
                    value={singleData.electricityCharge}
                    onChange={(e) => setSingleData({ ...singleData, electricityCharge: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Due Date *</label>
                  <input
                    type="date"
                    required
                    value={singleData.dueDate}
                    onChange={(e) => setSingleData({ ...singleData, dueDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSingleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-400" />
                {isTenant ? 'Pay Rent Online' : 'Record Rent Payment'}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-xs text-slate-400 block">{selectedInvoice.month} • Room #{selectedInvoice.roomNumber}</span>
                <span className="text-3xl font-black text-emerald-400 mt-1 block">
                  ₹{selectedInvoice.totalAmount.toLocaleString()}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">Resident: {selectedInvoice.tenantName}</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Select Payment Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {['UPI', 'Cash', 'Bank Transfer'].map((mode) => (
                    <button
                      type="button"
                      key={mode}
                      onClick={() => setPayData({ ...payData, paymentMode: mode })}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition-all ${
                        payData.paymentMode === mode
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Transaction Ref / Note</label>
                <input
                  type="text"
                  placeholder="e.g. UPI Ref / Receipt #9921"
                  value={payData.transactionId}
                  onChange={(e) => setPayData({ ...payData, transactionId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all disabled:opacity-50"
                >
                  {submitting ? 'Confirming...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;