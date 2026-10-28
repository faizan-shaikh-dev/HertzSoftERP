'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';

const COMMON_REASONS = [
  'Budget / Fees Constraint',
  'Chose Competitor / Other Institute',
  'Schedule / Batch Timing Mismatch',
  'Not Interested / Duplicate Inquiry',
  'Location / Distance Issue',
  'Other / Custom Reason'
];

export default function LostReasonModal({
  isOpen,
  onClose,
  onConfirm,
  leadName = '',
  loading = false
}) {
  const [mounted, setMounted] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(COMMON_REASONS[0]);
      setCustomReason('');
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
      setError('Please provide or select a reason for marking this inquiry as Lost.');
      return;
    }

    onConfirm(finalReason);
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
          <div className="w-11 h-11 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shadow-2xs flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Mark Inquiry as Lost
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify the reason why {leadName ? <strong className="text-slate-700">&ldquo;{leadName}&rdquo;</strong> : 'this inquiry'} did not convert.
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
              Select Primary Reason
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COMMON_REASONS.map((r) => {
                const isSelected = selectedPreset === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(r);
                      setError('');
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-lg text-left text-xs font-semibold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/80 text-red-700 border-red-300 shadow-2xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-red-600 bg-red-600' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="truncate">{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Detailed Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Additional Details / Staff Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Client mentioned budget cannot exceed ₹15,000 for this semester..."
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-red-500 focus:ring-1 focus:ring-red-400 outline-none transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm & Mark as Lost</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

