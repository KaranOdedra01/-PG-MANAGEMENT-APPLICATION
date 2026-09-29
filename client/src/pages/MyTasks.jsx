import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { 
  ClipboardList, 
  Clock, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  Check, 
  X,
  Play
} from 'lucide-react';

export const MyTasks = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Resolve Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [actualCost, setActualCost] = useState(0);
  const [resolving, setResolving] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/complaints/my-tasks');
      if (res.data?.success) {
        setTasks(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load assigned tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleStartWork = async (taskId) => {
    try {
      await api.patch(`/complaints/${taskId}/status`, { status: 'in-progress' });
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    setResolving(true);
    try {
      await api.patch(`/complaints/${selectedTask._id}/status`, {
        status: 'resolved',
        resolutionNote: resolutionNote.trim() || 'Work completed and inspected.',
        actualCost: Number(actualCost) || 0
      });
      setIsResolveModalOpen(false);
      setSelectedTask(null);
      setResolutionNote('');
      setActualCost(0);
      fetchTasks();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to resolve task');
    } finally {
      setResolving(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const totalAssigned = tasks.length;
  const urgentCount = tasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
  const inProgressCount = tasks.filter(t => t.status === 'in-progress').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              Staff Task Queue
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <ClipboardList className="w-7 h-7 text-amber-500" />
            My Assigned Maintenance Tasks
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review and resolve hostel maintenance requests assigned to you by administration.
          </p>
        </div>

        <button
          onClick={fetchTasks}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm self-start sm:self-auto"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-500' : ''}`} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Total Assigned
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalAssigned} Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider block mb-1">
            Urgent / High Priority
          </span>
          <span className="text-2xl font-bold text-rose-500">{urgentCount} Critical</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider block mb-1">
            Currently In Progress
          </span>
          <span className="text-2xl font-bold text-amber-500">{inProgressCount} Working</span>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 shadow-sm">
        <span className="text-xs font-semibold text-slate-500">Filter by:</span>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="open">Open / Pending</option>
          <option value="assigned">Assigned</option>
          <option value="in-progress">In Progress</option>
          <option value="waiting-for-parts">Waiting For Parts</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading your tasks queue...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">No Open Tasks Assigned!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              You have completed all maintenance tickets assigned to you, or no tickets are currently pending.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="p-4">Ticket</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date Logged</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredTasks.map((task) => (
                  <tr key={task._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-slate-100 block">
                          #{task.ticketNumber || task._id.slice(-6)}: {task.title}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {task.description}
                        </p>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                        Room #{task.roomNumber}
                      </span>
                      <span className="text-[11px] text-slate-500">Resident: {task.tenantName}</span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          task.priority === 'urgent'
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                            : task.priority === 'high'
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : task.priority === 'low'
                            ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {task.priority === 'urgent' && <Flame className="w-3 h-3 text-rose-500" />}
                        {task.priority}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {task.status}
                      </span>
                    </td>

                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {task.status !== 'in-progress' && (
                          <button
                            onClick={() => handleStartWork(task._id)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1 border border-amber-500/20 transition-colors"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Work
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsResolveModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                        >
                          <Check className="w-3.5 h-3.5" /> Resolve
                        </button>

                        <button
                          onClick={() => navigate('/complaints')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="View In Complaints Hub"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* RESOLVE MODAL */}
      {isResolveModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsResolveModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Complete & Resolve Task</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Ticket #{selectedTask.ticketNumber || selectedTask._id.slice(-6)} • Room #{selectedTask.roomNumber}
                </p>
              </div>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Resolution Summary / Note *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe repair actions performed (e.g. replaced capacitor and checked cooling)..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Repair Cost (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={actualCost}
                  onChange={(e) => setActualCost(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Optional materials or technician cost for hostel financial records.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {resolving ? 'Submitting...' : 'Mark as Resolved'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyTasks;
