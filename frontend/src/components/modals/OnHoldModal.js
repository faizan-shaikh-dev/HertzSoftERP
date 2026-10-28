'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Clock, Loader2, Calendar } from 'lucide-react';

const COMMON_HOLD_REASONS = [
  'Awaiting Q4 / Annual Budget Approval',
  'Project Postponed by Client',
  'Key Stakeholder Traveling / Out of Office',
  'Internal Tech Evaluation in Progress',
  'Requested Call After Specific Date',
  'Other / Custom Reason'
];

export default function OnHoldModal({
  isOpen,
  onClose,
  onConfirm,
  leadName = '',
  loading = false
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(COMMON_HOLD_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [revisitDate, setRevisitDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(COMMON_HOLD_REASONS[0]);
      setCustomReason('');
      setRevisitDate('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalReason = selectedPreset === 'Other / Custom Reason'
      ? customReason.trim()
      : (customReason.trim() ? `${selectedPreset} — ${customReason.trim()}` : selectedPreset);

    if (!finalReason) {
      setError('Please provide a reason for putting this lead On Hold.');
      return;
    }

    onConfirm({
      reason: finalReason,
      revisitDate: revisitDate || null
    });
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden my-auto p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          type="button"
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Put Lead On Hold
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the reason why {leadName ? <strong className="text-slate-700">&ldquo;{leadName}&rdquo;</strong> : 'this lead'} is placed on hold and set an optional follow-up revisit date.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preset Reason Options */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Reason for Hold *
            </label>
            <div className="space-y-1.5">
              {COMMON_HOLD_REASONS.map((r) => (
                <label 
                  key={r} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition-all ${
                    selectedPreset === r 
                      ? 'border-amber-500 bg-amber-50/50 text-amber-900 font-semibold shadow-2xs' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="holdPreset"
                    checked={selectedPreset === r}
                    onChange={() => setSelectedPreset(r)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Clarification */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Additional Details / Remarks
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Spoke with client, said to call after 15th of next month once board approves."
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-amber-600 outline-none transition"
            />
          </div>

          {/* Optional Revisit Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>Next Revisit / Follow-up Date (Optional)</span>
            </label>
            <input
              type="date"
              value={revisitDate}
              onChange={(e) => setRevisitDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-amber-600 outline-none transition font-medium"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4.5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm On Hold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

