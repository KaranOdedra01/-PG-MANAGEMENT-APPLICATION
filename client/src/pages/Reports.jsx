import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Download, 
  Calendar, 
  Layers, 
  BedDouble, 
  Wrench, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles,
  PieChart,
  BarChart3
} from 'lucide-react';

export const Reports = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('financial'); // 'financial' | 'occupancy' | 'complaints' | 'visitors'
  const [summary, setSummary] = useState(null);
  const [financialData, setFinancialData] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [sumRes, finRes, occRes, cmpRes, visRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get('/reports/financial'),
        api.get('/reports/occupancy'),
        api.get('/complaints'),
        api.get('/visitors')
      ]);

      if (sumRes.data?.success) setSummary(sumRes.data.data);
      if (finRes.data?.success) setFinancialData(finRes.data.data);
      if (occRes.data?.success) setOccupancyData(occRes.data.data);
      if (cmpRes.data?.success) setComplaints(cmpRes.data.data);
      if (visRes.data?.success) setVisitors(visRes.data.data);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);
  // PDF Report Generator
  const generatePDFReport = () => {
    const doc = new jsPDF();

    // Top Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('PG MANAGEMENT SYSTEM', 15, 20);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Official Executive Audit & Analytics Statement', 15, 28);
    doc.text('Generated: ' + new Date().toLocaleString(), 15, 36);

    doc.setFontSize(12);
    doc.setTextColor(251, 191, 36); // amber-400
    doc.text('REPORT: ' + activeTab.toUpperCase() + ' AUDIT', 130, 28);

    let startY = 55;

    if (activeTab === 'financial') {
      const invs = financialData?.invoices || [];
      const tableData = invs.map((inv, idx) => [
        (idx + 1).toString(),
        inv.month || 'N/A',
        inv.tenantName || 'Resident',
        'Room #' + (inv.roomNumber || '101'),
        'Rs. ' + (inv.totalAmount || 0).toLocaleString(),
        (inv.status || 'pending').toUpperCase(),
        inv.paymentMode || 'N/A'
      ]);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary: Total Revenue Rs. ' + (summary?.financials?.totalRevenue || 0).toLocaleString() + ' | Expenses Rs. ' + (summary?.financials?.totalExpenses || 0).toLocaleString() + ' | Net Profit Rs. ' + (summary?.financials?.netProfit || 0).toLocaleString(), 15, startY);

      autoTable(doc, {
        startY: startY + 8,
        head: [['#', 'Month', 'Resident', 'Room', 'Total Amount', 'Status', 'Mode']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (activeTab === 'occupancy') {
      const rooms = occupancyData?.rooms || [];
      const tableData = rooms.map((r, idx) => [
        (idx + 1).toString(),
        'Room #' + r.roomNumber,
        'Floor ' + r.floor,
        r.type.toUpperCase(),
        r.capacity.toString(),
        r.occupiedBeds.toString(),
        r.availableBeds.toString(),
        r.occupancyRate + '%'
      ]);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary: Total Capacity ' + (summary?.occupancy?.totalBeds || 0) + ' Beds | Occupied ' + (summary?.occupancy?.occupiedBeds || 0) + ' (' + (summary?.occupancy?.occupancyRate || 0) + '% Occupancy)', 15, startY);

      autoTable(doc, {
        startY: startY + 8,
        head: [['#', 'Room', 'Floor', 'Type', 'Capacity', 'Occupied', 'Vacant', 'Occupancy %']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (activeTab === 'complaints') {
      const tableData = complaints.map((c, idx) => [
        (idx + 1).toString(),
        c.title,
        c.category.toUpperCase(),
        'Room #' + c.roomNumber,
        c.priority.toUpperCase(),
        c.status.toUpperCase(),
        c.assignedStaffId?.name || c.assignedTo || 'Unassigned'
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['#', 'Ticket Title', 'Category', 'Room', 'Priority', 'Status', 'Staff']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [244, 63, 94], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    } else if (activeTab === 'visitors') {
      const tableData = visitors.map((v, idx) => [
        (idx + 1).toString(),
        v.name,
        v.phone,
        v.visitorType,
        'Room #' + v.roomNumber,
        new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        v.status.toUpperCase()
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['#', 'Visitor Name', 'Phone', 'Type', 'Room', 'Entry Time', 'Status']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [20, 184, 166], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 3 }
      });
    }

    const finalY = (doc.lastAutoTable?.finalY || 140) + 25;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('This is an authorized system-generated administrative audit statement.', 15, finalY);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('Authorized PG Administrator', 135, finalY);
    doc.setLineWidth(0.5);
    doc.line(135, finalY + 8, 195, finalY + 8);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PG Management Operations', 135, finalY + 14);

    doc.save('PG_Audit_Report_' + activeTab + '_' + new Date().toISOString().split('T')[0] + '.pdf');
  };

  // CSV Exporter
  const exportToCSV = () => {
    let headers = [];
    let rows = [];

    if (activeTab === 'financial') {
      headers = ['Month', 'Tenant Name', 'Room #', 'Base Rent', 'Electricity', 'Maintenance', 'Total Amount', 'Status', 'Payment Mode'];
      rows = (financialData?.invoices || []).map(i => [
        i.month,
        '"' + i.tenantName + '"',
        i.roomNumber,
        i.baseRent,
        i.electricityCharge || 0,
        i.maintenanceFee || 0,
        i.totalAmount,
        i.status,
        i.paymentMode || 'N/A'
      ]);
    } else if (activeTab === 'occupancy') {
      headers = ['Room #', 'Floor', 'Type', 'Capacity', 'Occupied Beds', 'Available Beds', 'Occupancy Rate %', 'Rent'];
      rows = (occupancyData?.rooms || []).map(r => [
        r.roomNumber,
        r.floor,
        r.type,
        r.capacity,
        r.occupiedBeds,
        r.availableBeds,
        r.occupancyRate,
        r.rent
      ]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'PG_Report_' + activeTab + '_' + new Date().toISOString().split('T')[0] + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              Module 11 • Executive Reports & Analytics
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-indigo-400" />
            Audit Reports & Intelligence
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Comprehensive financial statements, occupancy audits, maintenance SLAs, and PDF/CSV export engine.
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
            onClick={generatePDFReport}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">Collected Revenue</span>
            <span className="text-2xl font-black text-emerald-400">₹{summary.financials?.totalRevenue.toLocaleString()}</span>
            <p className="text-[11px] text-slate-400 mt-1">₹{summary.financials?.pendingDues.toLocaleString()} Pending Dues</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Net Operating Profit</span>
            <span className="text-2xl font-black text-slate-100">₹{summary.financials?.netProfit.toLocaleString()}</span>
            <p className="text-[11px] text-slate-400 mt-1">{summary.financials?.profitMargin}% Profit Margin</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider block mb-1">Bed Occupancy</span>
            <span className="text-2xl font-black text-indigo-400">{summary.occupancy?.occupancyRate}%</span>
            <p className="text-[11px] text-slate-400 mt-1">{summary.occupancy?.occupiedBeds} of {summary.occupancy?.totalBeds} Beds Occupied</p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">Maintenance SLA</span>
            <span className="text-2xl font-black text-amber-400">{summary.operations?.resolutionRate}% Fixed</span>
            <p className="text-[11px] text-slate-400 mt-1">{summary.operations?.resolvedComplaints} of {summary.operations?.totalComplaints} Tickets</p>
          </div>
        </div>
      )}

      {/* Report Mode Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'financial', label: 'Financial & Invoices Audit', icon: DollarSign },
          { key: 'occupancy', label: 'Occupancy & Bed Utilization', icon: BedDouble },
          { key: 'complaints', label: 'Maintenance & SLA Tickets', icon: Wrench },
          { key: 'visitors', label: 'Security & Gate Register', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Dynamic Breakdown Table */}
      {loading ? (
        <div className="min-h-[30vh] flex flex-col items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="text-xs text-slate-400">Loading audit records...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              {activeTab === 'financial' && 'Invoices & Rent Ledger Statement'}
              {activeTab === 'occupancy' && 'Room-by-Room Occupancy Breakdown'}
              {activeTab === 'complaints' && 'Maintenance Ticket Resolution Ledger'}
              {activeTab === 'visitors' && 'Gate Log Visitor Ledger'}
            </h3>

            <span className="text-xs text-slate-400">
              {activeTab === 'financial' && (financialData?.invoices?.length || 0) + ' Records'}
              {activeTab === 'occupancy' && (occupancyData?.rooms?.length || 0) + ' Rooms'}
              {activeTab === 'complaints' && complaints.length + ' Tickets'}
              {activeTab === 'visitors' && visitors.length + ' Logs'}
            </span>
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'financial' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Billing Month</th>
                    <th className="py-3 px-4">Resident</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Base Rent</th>
                    <th className="py-3 px-4">Utilities</th>
                    <th className="py-3 px-4">Total Payable</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(financialData?.invoices || []).map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{inv.month}</td>
                      <td className="py-3 px-4 text-slate-300">{inv.tenantName}</td>
                      <td className="py-3 px-4">Room #{inv.roomNumber}</td>
                      <td className="py-3 px-4">₹{inv.baseRent?.toLocaleString()}</td>
                      <td className="py-3 px-4">₹{((inv.electricityCharge || 0) + (inv.maintenanceFee || 0)).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">₹{inv.totalAmount?.toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          inv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'occupancy' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Room #</th>
                    <th className="py-3 px-4">Floor</th>
                    <th className="py-3 px-4">Room Type</th>
                    <th className="py-3 px-4">Capacity</th>
                    <th className="py-3 px-4">Occupied</th>
                    <th className="py-3 px-4">Vacant</th>
                    <th className="py-3 px-4">Occupancy %</th>
                    <th className="py-3 px-4">Monthly Rent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(occupancyData?.rooms || []).map((r) => (
                    <tr key={r.roomNumber} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-400">Room #{r.roomNumber}</td>
                      <td className="py-3 px-4">Floor {r.floor}</td>
                      <td className="py-3 px-4 uppercase text-slate-400 font-semibold">{r.type}</td>
                      <td className="py-3 px-4">{r.capacity} Beds</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{r.occupiedBeds}</td>
                      <td className="py-3 px-4 text-slate-400">{r.availableBeds}</td>
                      <td className="py-3 px-4 font-bold text-slate-200">{r.occupancyRate}%</td>
                      <td className="py-3 px-4 font-semibold text-emerald-400">₹{r.rent?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'complaints' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assigned Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {complaints.map((c) => (
                    <tr key={c._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">{c.title}</td>
                      <td className="py-3 px-4 uppercase text-indigo-400 font-semibold">{c.category}</td>
                      <td className="py-3 px-4">Room #{c.roomNumber}</td>
                      <td className="py-3 px-4 capitalize font-semibold">{c.priority}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          c.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{c.assignedTo || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'visitors' && (
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/80 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Visitor Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Visiting Room</th>
                    <th className="py-3 px-4">In Time</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {visitors.map((v) => (
                    <tr key={v._id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-100">{v.name}</td>
                      <td className="py-3 px-4 text-slate-400">{v.phone}</td>
                      <td className="py-3 px-4 uppercase font-semibold text-teal-400">{v.visitorType}</td>
                      <td className="py-3 px-4 font-medium">Room #{v.roomNumber}</td>
                      <td className="py-3 px-4 text-slate-400">{new Date(v.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          v.status === 'inside' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;