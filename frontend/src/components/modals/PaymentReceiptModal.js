'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReceiptDocument from '@/components/templates/ReceiptDocument';
import { X, Printer, Receipt } from 'lucide-react';

export default function PaymentReceiptModal({ isOpen, onClose, payment }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const receiptNo = payment.receipt_number || 'HR26001';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl bg-slate-100 rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-[#0077B6] text-white flex items-center justify-between shrink-0 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  {receiptNo}
                </h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  payment.payment_status === 'Full Payment'
                    ? 'bg-emerald-500/30 text-white border border-emerald-400/40'
                    : 'bg-amber-400/30 text-white border border-amber-300/40'
                }`}>
                  {payment.payment_status || 'Part Payment'}
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Official Commercial Payment Acknowledgement Receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-[#0077B6] bg-white hover:bg-slate-50 rounded-md shadow-xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="text-white hover:bg-white/20 p-1.5 rounded-full transition cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: 1:1 ReceiptDocument */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white">
          <ReceiptDocument payment={payment} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
