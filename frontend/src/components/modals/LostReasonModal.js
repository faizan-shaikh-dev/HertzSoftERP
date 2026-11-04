'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XCircle, AlertCircle, Loader2 } from 'lucide-react';

const COMMON_REASONS = [
  'Budget / Fees Constraint',
  'Chose Competitor / Other Vendor',
  'Schedule / Timeline Mismatch',
  'Not Interested / Duplicate Inquiry',
  'Internal Priorities Changed',
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#DFEAF2] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#DFEAF2] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight">
              Mark Inquiry as Lost
            </h3>
            <p className="text-xs text-[#71869B] mt-0.5">
              Specify the reason why {leadName ? <strong className="text-[#71869B]">&ldquo;{leadName}&rdquo;</strong> : 'this inquiry'} did not convert.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-[#19324D] hover:text-[#71869B] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#FDF2F2] border border-[#F5365C]/30 text-xs text-[#F5365C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Preset Reason Options */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-2">
              Select Primary Reason <span className="text-[#F5365C] font-bold ml-0.5">*</span>
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
                    className={`flex items-center gap-2 p-2.5 rounded-md text-left text-xs font-semibold transition border cursor-pointer ${
                      isSelected
                        ? 'bg-[#FDF2F2] text-[#F5365C] border-[#F5365C] shadow-xs'
                        : 'bg-white text-[#71869B] border-[#DFEAF2] hover:bg-[#F4F8FC]'
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-[#F5365C] bg-[#F5365C]' : 'border-[#adb5bd]'
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
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Additional Details / Staff Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Client mentioned budget cannot exceed ₹15,000 for this phase..."
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] placeholder-[#adb5bd] text-sm rounded-md border border-[#DFEAF2] focus:border-[#F5365C] focus:ring-1 focus:ring-[#F5365C] outline-none transition resize-y"
            />
          </div>

          {/* Action Button - Full-Width Red / Lost */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#F5365C] hover:bg-[#d02548] text-white font-bold text-sm rounded shadow-md shadow-[#F5365C]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm & Mark as Lost</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
