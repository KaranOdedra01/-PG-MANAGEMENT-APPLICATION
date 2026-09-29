import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export const ConfirmDeleteModal = ({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Deletion',
  message = 'Are you sure you want to delete this record? This action cannot be undone.',
  confirmLabel = 'Delete',
  isDanger = true,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative transition-all">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-4">
          <div
            className={`p-3 rounded-xl border shrink-0 ${
              isDanger
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="flex-1 pr-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
            <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20'
            }`}
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;
