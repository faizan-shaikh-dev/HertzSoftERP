'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, XCircle, Loader2 } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = 'This action cannot be undone. Are you sure you want to delete this record?',
  itemName = '',
  loading = false
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden my-auto p-6 sm:p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          type="button"
          className="absolute top-4 right-4 text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
          aria-label="Close dialog"
        >
          <XCircle className="w-6 h-6 stroke-[1.5]" />
        </button>

        {/* Warning Icon Badge */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#fdf2f2] text-[#f5365c] flex items-center justify-center shadow-xs">
          <Trash2 className="w-7 h-7" />
        </div>

        {/* Title & Message */}
        <h3 className="text-xl font-bold text-[#172b4d] tracking-tight">
          {title}
        </h3>
        
        {itemName && (
          <p className="mt-1.5 text-sm font-semibold text-[#f5365c] truncate max-w-xs mx-auto">
            &ldquo;{itemName}&rdquo;
          </p>
        )}

        <p className="mt-2 text-xs sm:text-sm text-[#525f7f] leading-relaxed max-w-sm mx-auto">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 rounded border border-[#dee2e6] text-xs font-semibold text-[#525f7f] hover:bg-[#f8f9fe] transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded bg-[#f5365c] hover:bg-[#d02548] text-xs font-bold text-white shadow-md shadow-[#f5365c]/25 transition disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{loading ? 'Deleting...' : 'Yes, Delete Record'}</span>
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
