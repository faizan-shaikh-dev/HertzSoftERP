'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import InvoiceDocument from '@/components/templates/InvoiceDocument';
import { X, Printer, FileText } from 'lucide-react';

export default function TaxInvoiceModal({ isOpen, onClose, quotation }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = quotation.invoice_number || quotation.quotation_number?.replace('HE', 'HIN') || 'HIN26001';

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl bg-slate-100 rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[95vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 bg-[#0077B6] text-white flex items-center justify-between shrink-0 shadow-sm print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white font-mono">
                  {invoiceNo}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-white border border-emerald-400/40">
                  Tax Invoice
                </span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">
                Official Commercial GST Tax Invoice Preview
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

        {/* Modal Body: 1:1 InvoiceDocument */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100 print:p-0 print:bg-white">
          <InvoiceDocument quotation={quotation} />
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
