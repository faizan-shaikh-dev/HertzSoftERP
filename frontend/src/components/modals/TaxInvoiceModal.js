'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XCircle,
  Printer,
  FileText,
  Building2,
  Calendar,
  CheckCircle2,
  FolderKanban,
  ShieldCheck,
  CreditCard,
  User,
  Clock,
  Percent
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function TaxInvoiceModal({ isOpen, onClose, quotation, project = null }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted || !quotation) return null;

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

  const handlePrint = () => {
    window.print();
  };

  // Generate Invoice Number derived from Quotation or timestamp
  const rawNum = quotation.quotation_number || `QT-${quotation.id}`;
  const invoiceNumber = rawNum.startsWith('QT-')
    ? rawNum.replace('QT-', 'INV-')
    : `INV-${rawNum}`;

  // Invoice Date (issue date or today)
  const invoiceDate = quotation.date ? formatDate(quotation.date) : formatDate(new Date().toISOString());
  const dueDate = quotation.validity_date ? formatDate(quotation.validity_date) : formatDate(new Date(Date.now() + 15 * 86400000).toISOString());

  // Parsing line items
  let items = [];
  try {
    if (typeof quotation.line_items === 'string') {
      items = JSON.parse(quotation.line_items);
    } else if (Array.isArray(quotation.line_items)) {
      items = quotation.line_items;
    }
  } catch (e) {
    items = [];
  }

  if (items.length === 0) {
    items = [
      {
        description: quotation.title || 'Enterprise Software Engineering Services',
        quantity: 1,
        unit_rate: Number(quotation.subtotal) || Number(quotation.total_amount) || 0,
        discount_percent: Number(quotation.discount_amount) ? 10 : 0,
        tax_percent: Number(quotation.tax_amount) ? 18 : 0,
        total: Number(quotation.subtotal) || Number(quotation.total_amount) || 0
      }
    ];
  }

  const subtotal = Number(quotation.subtotal) || items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.unit_rate || 0)), 0);
  const discountAmount = Number(quotation.discount_amount) || 0;
  const taxAmount = Number(quotation.tax_amount) || 0;
  const grandTotal = Number(quotation.total_amount) || (subtotal - discountAmount + taxAmount);

  const cgst = taxAmount > 0 ? taxAmount / 2 : 0;
  const sgst = taxAmount > 0 ? taxAmount / 2 : 0;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Control Bar - Hertzsoft Brand */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] border-b-2 border-[#5FC8D6]/40 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 text-white border border-white/25 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {invoiceNumber}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                  Tax Invoice
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/40">
                  Accepted Proposal
                </span>
              </div>
              <p className="text-xs text-[#e0f7fa] mt-0.5">
                Official Commercial GST Tax Invoice &amp; Payment Schedule
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

        {/* Printable Tax Invoice Body */}
        <div className="p-6 sm:p-10 overflow-y-auto bg-slate-100 flex-1 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-8 sm:p-10 rounded-lg shadow-sm border border-slate-200 text-slate-800 space-y-6 print:shadow-none print:border-none print:p-0">
            {/* Document Header & Hertzsoft Corporate Details */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 pb-6 border-b-2 border-[#4689C8]">
              <div>
                <img
                  src="/logo.svg"
                  alt="Hertzsoft Technologies"
                  className="h-10 w-auto object-contain mb-2"
                />
                <p className="text-xs text-slate-700 font-semibold">
                  Hertzsoft Technologies Pvt. Ltd.
                </p>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Commercial Complex, Central Tech Zone, Mumbai - 400001<br />
                  <strong>GSTIN:</strong> 27AABCH4920E1ZT | <strong>CIN:</strong> U72900MH2021PTC123456<br />
                  Email: billing@hertzsoft.com | Web: https://hertzsoft.com
                </p>
              </div>

              <div className="sm:text-right">
                <div className="text-2xl font-black text-[#4689C8] tracking-tight">
                  TAX INVOICE
                </div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">
                  {invoiceNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 space-y-0.5">
                  <p><strong>Invoice Date:</strong> {invoiceDate}</p>
                  <p><strong>Payment Due:</strong> {dueDate}</p>
                  <p><strong>Proposal Ref:</strong> {quotation.quotation_number} (v{quotation.version || 1})</p>
                </div>
              </div>
            </div>

            {/* Bill To & Project Link */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-[#4689C8] uppercase tracking-wider">
                  Billed To (Client / Buyer):
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {quotation.client_name || 'Client Contact'}
                </p>
                {quotation.client_company && (
                  <p className="text-slate-600">Company: <span className="font-semibold text-slate-800">{quotation.client_company}</span></p>
                )}
                {quotation.client_email && (
                  <p className="text-slate-600">Email: {quotation.client_email}</p>
                )}
                {quotation.client_phone && (
                  <p className="text-slate-600">Phone: {quotation.client_phone}</p>
                )}
                <p className="text-slate-500 text-[11px] pt-1">
                  Place of Supply: Maharashtra (State Code 27)
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-md border border-slate-200/80 text-xs space-y-1">
                <p className="text-[10px] font-extrabold text-[#4689C8] uppercase tracking-wider">
                  Engagement &amp; Project Coordinates:
                </p>
                <p className="font-bold text-slate-900 text-sm">
                  {quotation.project_title || project?.title || quotation.title || 'Enterprise Software Engineering'}
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Service Category:</span> Information Technology Software Services
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">SAC Code:</span> 998314 (IT Consulting &amp; Software Support)
                </p>
                <p className="text-slate-600">
                  <span className="text-slate-500">Status:</span> Confirmed / Active Engagement
                </p>
              </div>
            </div>

            {/* Deliverables & Tax Table */}
            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#f6f9fc] text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Description of Services</th>
                    <th className="py-2.5 px-3 w-20 text-center">SAC Code</th>
                    <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-24 text-right">Rate (₹)</th>
                    <th className="py-2.5 px-3 w-20 text-center">Disc %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => {
                    const rowQty = Number(it.quantity) || 1;
                    const rowRate = Number(it.unit_rate) || 0;
                    const rowDisc = Number(it.discount_percent) || 0;
                    const rowTotal = it.total ? Number(it.total) : (rowQty * rowRate * (1 - rowDisc / 100));

                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors duration-150 ${
                          idx % 2 === 1 ? 'bg-[#f4f6f8]' : 'bg-white'
                        } hover:bg-[#eaf2fc]`}
                      >
                        <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900">
                            {it.description || `Deliverable Item ${idx + 1}`}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500 text-[11px]">
                          998314
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-700">
                          {rowQty}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          {formatCurrency(rowRate)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-500">
                          {rowDisc > 0 ? `${rowDisc}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {formatCurrency(rowTotal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Calculations Breakdown */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
              {/* Payment Bank Details */}
              <div className="w-full sm:w-1/2 p-4 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                <p className="text-[10px] font-extrabold text-[#4689C8] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Remittance &amp; Bank Coordinates:</span>
                </p>
                <div className="space-y-0.5 text-slate-700 font-mono text-[11px]">
                  <p><strong>Account Name:</strong> Hertzsoft Technologies Pvt Ltd</p>
                  <p><strong>Bank:</strong> HDFC Bank Ltd</p>
                  <p><strong>Account No:</strong> 50200088921456</p>
                  <p><strong>IFSC Code:</strong> HDFC0000240</p>
                  <p><strong>UPI VPA:</strong> hertzsoft@hdfcbank</p>
                </div>
                <p className="text-[10px] text-slate-400 pt-1 italic">
                  * Please quote invoice {invoiceNumber} in the transaction narration for instant credit.
                </p>
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-5/12 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Taxable Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-[#f5365c]">
                    <span>Commercial Discount:</span>
                    <span className="font-mono font-semibold">- {formatCurrency(discountAmount)}</span>
                  </div>
                )}

                {taxAmount > 0 ? (
                  <>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>CGST (9.0%):</span>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(cgst)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                      <span>SGST (9.0%):</span>
                      <span className="font-mono font-semibold text-slate-900">{formatCurrency(sgst)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-500">
                    <span>GST (18%):</span>
                    <span className="font-mono font-semibold text-slate-500">Inclusive / Exempt</span>
                  </div>
                )}

                <div className="flex justify-between py-2 border-t-2 border-[#4689C8] text-sm font-black text-slate-900">
                  <span className="text-[#4689C8]">Invoice Grand Total:</span>
                  <span className="font-mono text-base text-[#172b4d]">{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Terms and Statutory Note */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <strong>Terms &amp; Payment Schedule:</strong> Payments must be remitted strictly according to milestone deliverables. As per Section 4.8 Finance policy, this document is a tax invoice and is distinct from cash receipts. An official Payment Receipt is issued upon clearance of each installment.
            </div>

            {/* Signatures & Corporate Seal */}
            <div className="pt-6 border-t border-slate-200 flex items-end justify-between text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-4 h-4 text-[#4689C8]" />
                  <span>Authenticated Commercial Tax Document</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Hertzsoft Centralized ERP • Finance Module
                </div>
              </div>

              <div className="text-center w-52">
                <div className="border-b border-slate-300 pb-1 mb-1 font-semibold text-slate-800 text-xs">
                  {quotation.prepared_by_name || 'Finance Operations Head'}
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

