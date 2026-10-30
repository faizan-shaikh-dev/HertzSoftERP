'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XCircle,
  Printer,
  Receipt,
  Building2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  CreditCard,
  User,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function PaymentReceiptModal({ isOpen, onClose, payment }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !payment) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const receiptNumber = payment.receipt_number || `REC-${new Date(payment.payment_date || payment.created_at || new Date()).getFullYear()}-${String(payment.id).slice(0, 8).toUpperCase()}`;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar - Hertzsoft Brand */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] border-b-2 border-[#5FC8D6]/40 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {receiptNumber}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Payment Cleared
                </span>
              </div>
              <p className="text-xs text-[#e0f7fa] mt-0.5">
                Official Commercial Payment Acknowledgement Receipt
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-[#172b4d] bg-white hover:bg-slate-50 rounded-md shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-[#4689C8]" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition cursor-pointer p-0.5 rounded-full"
              aria-label="Close dialog"
            >
              <XCircle className="w-6 h-6 stroke-[1.5]" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div className="w-full max-w-2xl bg-white p-8 sm:p-10 rounded-lg shadow-sm border border-slate-200 text-slate-800 space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b-2 border-[#4689C8]">
              <div>
                <img
                  src="/logo.svg"
                  alt="Hertzsoft Technologies"
                  className="h-10 w-auto object-contain mb-2"
                />
                <p className="text-xs text-slate-500 leading-relaxed">
                  Enterprise Software Solutions & IT Consultancy<br />
                  Email: info@hertzsoft.com | Web: https://hertzsoft.com
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-2xl font-black text-[#4689C8] tracking-tight">
                  PAYMENT RECEIPT
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {receiptNumber}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Issued: {formatDate(payment.payment_date || payment.created_at)}
                </div>
              </div>
            </div>

            {/* Received From & Project Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-[#4689C8] uppercase tracking-wider">
                  Payment Received From:
                </p>
                <p className="font-bold text-slate-900 text-sm">{payment.client_name}</p>
                {payment.client_company && (
                  <p className="text-slate-600">Company: <span className="font-semibold text-slate-800">{payment.client_company}</span></p>
                )}
                {payment.client_email && (
                  <p className="text-slate-600">Email: {payment.client_email}</p>
                )}
                {payment.client_phone && (
                  <p className="text-slate-600">Phone: {payment.client_phone}</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-[#4689C8] uppercase tracking-wider">
                  Credited Project Account:
                </p>
                <p className="font-bold text-slate-900 text-sm">{payment.project_title || 'General Project Retainer'}</p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Payment Date:</span> {formatDate(payment.payment_date)}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Recorded At:</span> {formatDateTime(payment.created_at)}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Officer / Staff:</span> {payment.recorded_by_name || 'Accounts Admin'}
                </p>
              </div>
            </div>

            {/* Amount Credited Highlight Banner */}
            <div className="p-5 rounded-lg bg-gradient-to-r from-[#e8f7ee] to-[#f0fbf5] border border-[#2dce89]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-extrabold text-[#2dce89] uppercase tracking-wider">
                  Amount Received (INR)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#172b4d] font-mono mt-0.5">
                  {formatCurrency(payment.amount_paid)}
                </div>
              </div>

              <div className="text-xs text-slate-600 sm:text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white text-[#2dce89] border border-[#2dce89]/30 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Payment Credited</span>
                </span>
                <div className="text-[11px] text-slate-500 mt-1">
                  Payment Mode: <strong className="text-slate-800">{payment.payment_method || 'Online'}</strong>
                </div>
              </div>
            </div>

            {/* Transaction Reference & Ledger Table */}
            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Transaction Description</th>
                    <th className="py-2.5 px-3 w-36">Reference / UTR</th>
                    <th className="py-2.5 px-3 w-32 text-center">Payment Mode</th>
                    <th className="py-2.5 px-3 w-32 text-right">Credit Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">
                        Project Installment Payment
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {payment.notes || `Contract installment for ${payment.project_title || 'deliverables'}`}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-700">
                      {payment.transaction_reference || 'N/A (Direct)'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {payment.payment_method || 'UPI'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-sm">
                      {formatCurrency(payment.amount_paid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Statutory & Non-Accounting Note */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <strong>Notice:</strong> This receipt confirms realized commercial cash received against agreed project milestones. As per company policy, quotations are estimates and distinct from cash receipts. Keep this receipt for milestone verification.
            </div>

            {/* Signatures & Corporate Acknowledgement */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-[#4689C8]" />
                  <span>Electronically Generated Receipt</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Hertzsoft Centralized ERP Ledger
                </div>
              </div>

              <div className="text-center w-48">
                <div className="border-b border-slate-300 pb-1 mb-1 font-semibold text-slate-800 text-xs">
                  {payment.recorded_by_name || 'Authorized Finance Officer'}
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">
                  Authorized Signatory
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

