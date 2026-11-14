'use client';

import React from 'react';
import { numberToIndianWords } from '@/utils/numberToWords';

export default function ReceiptDocument({ payment, printable = false }) {
  if (!payment) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2
    }).format(Number(val) || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const suffix = (day === 1 || day === 21 || day === 31) ? 'st' :
                     (day === 2 || day === 22) ? 'nd' :
                     (day === 3 || day === 23) ? 'rd' : 'th';
      const month = d.toLocaleDateString('en-GB', { month: 'long' });
      const year = d.getFullYear();
      return `${day}${suffix} ${month} ${year}`;
    } catch {
      return dateStr;
    }
  };

  const amountReceived = Number(payment.amount_paid) || 0;
  const invoiceAmount = Number(payment.invoice_amount || payment.project_total_cost) || amountReceived;
  const amountWords = payment.amount_in_words || numberToIndianWords(amountReceived);
  const receiptNo = payment.receipt_number || `HR26001`;
  const invoiceNo = payment.invoice_number || (receiptNo.includes('-R') ? receiptNo.split('-R')[0] : 'HIN26001');

  return (
    <div className={`w-full max-w-4xl mx-auto bg-white text-[#1e293b] font-sans ${printable ? 'p-0 shadow-none' : 'p-6 sm:p-10 shadow-lg rounded-xl border border-slate-200'}`}>
      
      {/* 1. Header Row */}
      <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Hertzsoft" 
            className="h-11 w-auto object-contain"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/logo.svg';
            }}
          />
          <div>
            <div className="text-[17px] font-black tracking-tight text-[#0f172a] uppercase leading-tight">
              HERTZSOFT
            </div>
            <div className="text-[10px] text-slate-500 font-medium tracking-wide">
              Think in New Dimensions
            </div>
          </div>
        </div>

        {/* Header Center / Subtext */}
        <div className="hidden sm:block text-center text-[11px] text-slate-600 font-medium pt-2">
          www.hertzsoft.com &nbsp;|&nbsp; contact@hertzsoft.com &nbsp;|&nbsp; +91 86572 42757
        </div>

        {/* Title Badge */}
        <div className="text-right">
          <div className="text-2xl sm:text-3xl font-extrabold tracking-wider text-[#0077B6] uppercase">
            RECEIPT
          </div>
        </div>
      </div>

      {/* Mobile contact bar */}
      <div className="sm:hidden text-center text-[10px] text-slate-600 border-b border-slate-100 pb-2 mb-3">
        www.hertzsoft.com | contact@hertzsoft.com | +91 86572 42757
      </div>

      {/* 2. Document Meta Row */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-[13px] text-slate-700 font-medium mb-5 px-1 gap-2">
        <div>
          <span className="text-slate-500">Receipt No.:</span>{' '}
          <strong className="text-slate-900 font-mono font-bold">{receiptNo}</strong>
        </div>
        <div>
          <span className="text-slate-500">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(payment.payment_date || payment.created_at)}</strong>
        </div>
      </div>

      {/* 3. Entity Boxes (RECEIVED FROM & PAYMENT REFERENCE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* RECEIVED FROM Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            RECEIVED FROM
          </div>
          <div className="p-3.5 text-xs text-slate-700 leading-relaxed">
            <div>
              <span className="text-slate-500">Client Name:</span>{' '}
              <strong className="text-slate-900 text-sm">{payment.client_name || 'Client Name'}</strong>
            </div>
            {payment.client_company && (
              <div>
                <span className="text-slate-500">Company Name:</span>{' '}
                <span className="text-slate-800 font-medium">{payment.client_company}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Contact No.:</span>{' '}
              <span className="text-slate-800 font-mono">
                {payment.client_phone ? `+91 ${payment.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-slate-500">Address:</span>{' '}
              <span className="text-slate-700">
                {payment.client_billing_address || '102 House, Galaxy Tower, Pipeline Road, Kurla(W), Mumbai - 400 070'}
              </span>
            </div>
          </div>
        </div>

        {/* PAYMENT REFERENCE Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            PAYMENT REFERENCE
          </div>
          <div className="p-3.5 text-xs text-slate-700 leading-relaxed space-y-1.5">
            <div>
              <span className="text-slate-500">Against Invoice No.:</span>{' '}
              <strong className="text-slate-900 font-mono">{invoiceNo}</strong>
            </div>
            <div>
              <span className="text-slate-500">Invoice Date:</span>{' '}
              <span className="text-slate-800 font-medium">{formatDate(payment.payment_date || payment.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-500">Project Name:</span>{' '}
              <strong className="text-slate-800">{payment.project_title || 'Maths4All Application'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AMOUNT RECEIVED BANNER */}
      <div className="bg-[#E0F2FE] border-2 border-[#BAE6FD] rounded-lg p-5 mb-6 text-center shadow-xs">
        <div className="text-xs uppercase tracking-widest text-[#0077B6] font-bold">
          Amount Received
        </div>
        <div className="text-3xl sm:text-4xl font-extrabold text-[#0077B6] font-mono mt-1">
          ₹ {formatCurrency(amountReceived)}
        </div>
        <div className="text-xs text-slate-700 italic font-medium mt-1">
          Amount in words: {amountWords}
        </div>
      </div>

      {/* 5. PAYMENT DETAILS (4-to-6 Column / Grid Box) */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
          PAYMENT DETAILS
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <tbody className="divide-y divide-slate-200 text-slate-700">
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 w-1/3 bg-slate-50/60 font-semibold text-slate-600">Payment Mode</td>
              <td className="py-2.5 px-3 font-semibold text-slate-900">{payment.payment_method || 'UPI'}</td>
            </tr>
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 bg-slate-50/60 font-semibold text-slate-600">Transaction Details</td>
              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                {payment.transaction_reference ? `ID: ${payment.transaction_reference}` : 'ID: 687549021359'}
              </td>
            </tr>
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 bg-slate-50/60 font-semibold text-slate-600">Payment Date</td>
              <td className="py-2.5 px-3 font-medium text-slate-800">{formatDate(payment.payment_date || payment.created_at)}</td>
            </tr>
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 bg-slate-50/60 font-semibold text-slate-600">Invoice Amount</td>
              <td className="py-2.5 px-3 font-mono font-medium text-slate-800">₹ {formatCurrency(invoiceAmount)}</td>
            </tr>
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 bg-slate-50/60 font-semibold text-slate-600">Amount Received</td>
              <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">₹ {formatCurrency(amountReceived)}</td>
            </tr>
            <tr className="divide-x divide-slate-200 bg-white">
              <td className="py-2.5 px-3 bg-slate-50/60 font-semibold text-slate-600">Payment Status</td>
              <td className="py-2.5 px-3 font-bold">
                <span className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                  payment.payment_status === 'Full Payment'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {payment.payment_status || 'Part Payment'}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 6. Footer: Disclaimer & FOR HERTZSOFT Signature Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-2">
        {/* Disclaimer Note */}
        <div className="text-[11px] text-slate-500 leading-relaxed">
          <strong className="text-slate-700">Note:</strong> This receipt acknowledges only the amount actually received by Hertzsoft Technologies Private Limited. It is not a tax invoice. Any outstanding balance, if applicable, remains payable as per the agreed terms.
        </div>

        {/* Authorized Signature Card */}
        <div className="text-center md:text-right flex flex-col items-center md:items-end">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
            FOR HERTZSOFT TECHNOLOGIES PRIVATE LIMITED
          </div>
          
          {/* Stamp & Seal Illustration */}
          <div className="my-2 relative">
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-[#0077B6]/40 flex flex-col items-center justify-center text-center p-1 bg-[#0077B6]/5 rotate-[-8deg]">
              <div className="text-[7px] font-black uppercase text-[#0077B6] tracking-tighter leading-tight">
                HERTZSOFT
              </div>
              <div className="text-[6px] font-bold text-emerald-700 uppercase">
                RECEIVED
              </div>
            </div>
          </div>

          <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
            TAHSEEN S. GHATTE
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            Signature and Stamp
          </div>
        </div>
      </div>

    </div>
  );
}

