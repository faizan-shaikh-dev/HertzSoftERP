'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import quotationService from '@/services/quotationService';
import {
  XCircle,
  Printer,
  ExternalLink,
  FileSpreadsheet,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function QuotationPreviewModal({ isOpen, onClose, quotation }) {
  const [mounted, setMounted] = useState(false);
  const printIframeRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !quotation) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    const printUrl = quotationService.getPrintableUrl(quotation.id);
    const printWindow = window.open(printUrl, '_blank');
    if (printWindow) {
      printWindow.focus();
    } else {
      toast.info('Popup blocked. Please allow popups to print/download the PDF.');
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar - Hertzsoft Brand */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] border-b-2 border-[#5FC8D6]/40 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {quotation.quotation_number}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-[#e0f7fa] border border-white/30">
                  Version {quotation.version}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  quotation.status === 'Accepted'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : quotation.status === 'Sent'
                    ? 'bg-blue-400/30 text-[#e0f7fa] border border-white/30'
                    : quotation.status === 'Superseded'
                    ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                    : 'bg-white/20 text-white/90 border border-white/30'
                }`}>
                  {quotation.status}
                </span>
              </div>
              <p className="text-xs text-[#e0f7fa] mt-0.5">
                Official Commercial Proposal Document
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

        {/* Printable Document Body View */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-8 sm:p-12 rounded-lg shadow-sm border border-slate-200 text-slate-800 space-y-6">
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b-2 border-slate-900">
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
                <div className="text-2xl font-extrabold text-[#4689C8] tracking-tight">
                  QUOTATION
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {quotation.quotation_number}
                </div>
                <div className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30">
                  Version {quotation.version} {quotation.status === 'Superseded' ? '(Superseded)' : ''}
                </div>
              </div>
            </div>

            {/* Client & Proposal Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Quotation Prepared For:
                </p>
                <p className="font-bold text-slate-900 text-sm">{quotation.client_name}</p>
                {quotation.client_company && (
                  <p className="text-slate-600">Company: {quotation.client_company}</p>
                )}
                {quotation.client_email && (
                  <p className="text-slate-600">Email: {quotation.client_email}</p>
                )}
                {quotation.client_phone && (
                  <p className="text-slate-600">Phone: {quotation.client_phone}</p>
                )}
                {quotation.client_billing_address && (
                  <p className="text-slate-600">Address: {quotation.client_billing_address}</p>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Proposal Details:
                </p>
                <p className="font-semibold text-slate-900">
                  <span className="text-slate-500">Subject:</span> {quotation.title}
                </p>
                {quotation.project_title && (
                  <p className="text-slate-600">
                    <span className="text-slate-500">Project:</span> {quotation.project_title}
                  </p>
                )}
                <p className="text-slate-600">
                  <span className="text-slate-500">Issue Date:</span> {formatDate(quotation.quotation_date)}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Valid Until:</span> {formatDate(quotation.valid_until)}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Status:</span>{' '}
                  <span className="font-bold text-slate-800">{quotation.status}</span>
                </p>
              </div>
            </div>

            {/* Line Items Table */}
            <div>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3">Description / Scope Deliverable</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-24 text-right">Rate</th>
                    <th className="py-2.5 px-3 w-16 text-right">Disc</th>
                    <th className="py-2.5 px-3 w-16 text-right">Tax</th>
                    <th className="py-2.5 px-3 w-28 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(quotation.items || []).map((item, index) => (
                    <tr key={index} className={index % 2 === 1 ? 'bg-[#f8f9fa]' : 'bg-white'}>
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {index + 1}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-900">
                        {item.description}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-700">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right text-slate-700 font-mono">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                        {item.discount_percent > 0 ? `${item.discount_percent}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 font-mono">
                        {item.tax_percent > 0 ? `${item.tax_percent}%` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals Breakdown */}
            <div className="flex justify-end pt-2">
              <div className="w-72 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {formatCurrency(quotation.subtotal)}
                  </span>
                </div>

                {quotation.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-red-600">
                    <span>Discount ({quotation.discount_rate}%):</span>
                    <span className="font-semibold font-mono">
                      - {formatCurrency(quotation.discount_amount)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-slate-600">
                  <span>GST / Tax ({quotation.tax_rate}%):</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    + {formatCurrency(quotation.tax_amount)}
                  </span>
                </div>

                <div className="pt-2 border-t-2 border-slate-900 flex items-center justify-between font-extrabold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-blue-700 text-base font-mono">
                    {formatCurrency(quotation.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            {quotation.terms_and_conditions && (
              <div className="p-4 bg-slate-50 rounded-md border border-slate-200/80 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">
                  Terms & Conditions:
                </p>
                <p className="text-slate-600 whitespace-pre-line leading-relaxed">
                  {quotation.terms_and_conditions}
                </p>
              </div>
            )}

            {/* Additional Notes */}
            {quotation.notes && (
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700">Notes:</span> {quotation.notes}
              </div>
            )}

            {/* Signatures */}
            <div className="pt-8 border-t border-slate-200 flex items-end justify-between text-xs">
              <div className="text-center w-48">
                <div className="border-b border-slate-400 h-10 mb-1" />
                <p className="font-bold text-slate-800">Client Acceptance Signature</p>
                <p className="text-[10px] text-slate-400">Date & Company Stamp</p>
              </div>

              <div className="text-center w-48">
                <div className="border-b border-slate-400 h-10 mb-1" />
                <p className="font-bold text-slate-800">Authorized Signatory</p>
                <p className="text-[10px] text-slate-400">Hertzsoft Technologies</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

