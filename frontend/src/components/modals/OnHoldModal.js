'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XCircle, Clock, Loader2, Calendar, AlertCircle } from 'lucide-react';

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
              Put Lead On Hold
            </h3>
            <p className="text-xs text-[#71869B] mt-0.5">
              Specify the reason why {leadName ? <strong className="text-[#71869B]">&ldquo;{leadName}&rdquo;</strong> : 'this lead'} is placed on hold.
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
              Reason for Hold <span className="text-[#F5365C] font-bold ml-0.5">*</span>
            </label>
            <div className="space-y-1.5">
              {COMMON_HOLD_REASONS.map((r) => (
                <label 
                  key={r} 
                  className={`flex items-center gap-2.5 p-2.5 rounded-md border text-xs cursor-pointer transition ${
                    selectedPreset === r 
                      ? 'border-[#FB6340] bg-[#fff6f4] text-[#d03d19] font-bold shadow-xs' 
                      : 'border-[#DFEAF2] hover:bg-[#F4F8FC] text-[#71869B]'
                  }`}
                >
                  <input
                    type="radio"
                    name="holdPreset"
                    checked={selectedPreset === r}
                    onChange={() => setSelectedPreset(r)}
                    className="text-[#FB6340] focus:ring-[#FB6340]"
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Clarification */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Additional Details / Remarks
            </label>
            <textarea
              rows={2}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Spoke with client, said to call after 15th of next month once board approves."
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] placeholder-[#adb5bd] text-sm rounded-md border border-[#DFEAF2] focus:border-[#FB6340] focus:ring-1 focus:ring-[#FB6340] outline-none transition resize-y"
            />
          </div>

          {/* Optional Revisit Date */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#FB6340]" />
              <span>Next Revisit / Follow-up Date (Optional)</span>
            </label>
            <input
              type="date"
              value={revisitDate}
              onChange={(e) => setRevisitDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#FB6340] outline-none transition font-medium"
            />
          </div>

          {/* Action Button - Full Width */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#FB6340] hover:bg-[#d03d19] text-white font-bold text-sm rounded shadow-md shadow-[#FB6340]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Confirm On Hold</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
