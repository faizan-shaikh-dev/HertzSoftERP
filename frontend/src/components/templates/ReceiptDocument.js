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
    <div className={`printable-document w-full max-w-4xl mx-auto bg-white text-[#1e293b] font-sans ${printable ? 'p-0 shadow-none' : 'p-6 sm:p-10 shadow-lg rounded-xl border border-slate-200'}`}>
      
      {/* 1. Header Row */}
      <div className="flex items-start justify-between pb-3 mb-2">
        {/* Brand / Logo + Contact Details underneath */}
        <div>
          <div className="flex items-center gap-2.5">
            <img 
              src="/logo.png" 
              alt="Hertzsoft" 
              className="h-10 w-auto object-contain"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/logo.svg';
              }}
            />
            <div>
              <div className="text-[19px] font-black tracking-tight text-[#0077B6] uppercase leading-none">
                HERTZSOFT
              </div>
              <div className="text-[10px] text-slate-500 font-medium tracking-wide">
                Think in New Dimensions
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[#0077B6] font-semibold mt-2.5">
            www.hertzsoft.com &nbsp;|&nbsp; contact@hertzsoft.com &nbsp;|&nbsp; +91 86572 42757
          </div>
        </div>

        {/* Title Badge */}
        <div className="text-right">
          <div className="text-3xl sm:text-4xl font-extrabold tracking-wider text-[#0077B6] uppercase">
            RECEIPT
          </div>
        </div>
      </div>

      {/* 2. Blue Divider Line with Document Meta */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-[13px] text-slate-800 font-medium border-b-2 border-[#0077B6] pb-1.5 mb-6 gap-2">
        <div>
          <span className="text-slate-600">Receipt No.:</span>{' '}
          <strong className="text-[#0077B6] underline font-mono font-bold tracking-tight">
            {receiptNo}
          </strong>
        </div>
        <div>
          <span className="text-slate-600">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(payment.payment_date || payment.created_at)}</strong>
        </div>
      </div>

      {/* 3. Entity Boxes (Single Unified 2-Column Container matching Real PDF) */}
      <div className="border border-slate-200 overflow-hidden mb-6">
        {/* Blue Header Bar */}
        <div className="grid grid-cols-2 bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-4">
          <div className="text-center font-bold">RECEIVED FROM</div>
          <div className="text-center font-bold border-l border-[#0077B6]/40">PAYMENT REFERENCE</div>
        </div>

        {/* Light Grey Body */}
        <div className="grid grid-cols-2 bg-[#F1F5F9]/80 divide-x divide-slate-200 text-xs py-3 px-4">
          {/* Left Column: Received From */}
          <div className="space-y-1">
            <div>
              <span className="text-slate-600">Client Name:</span>{' '}
              <strong className="text-slate-900 font-semibold">{payment.client_name || 'Client Name'}</strong>
            </div>
            {payment.client_company && (
              <div>
                <span className="text-slate-600">Company Name:</span>{' '}
                <span className="text-slate-800 font-medium">{payment.client_company}</span>
              </div>
            )}
            <div>
              <span className="text-slate-600">Contact No.:</span>{' '}
              <span className="text-slate-800 font-mono">
                {payment.client_phone ? `+91 ${payment.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Address:</span>{' '}
              <span className="text-slate-700">
                {payment.client_billing_address || 'Mumbai, Maharashtra, India'}
              </span>
            </div>
          </div>

          {/* Right Column: Payment Reference */}
          <div className="space-y-1 pl-4">
            <div>
              <span className="text-slate-600">Against Invoice No.:</span>{' '}
              <strong className="text-slate-900 font-mono font-bold">{invoiceNo}</strong>
            </div>
            <div>
              <span className="text-slate-600">Invoice Date:</span>{' '}
              <span className="text-slate-800 font-medium">{formatDate(payment.payment_date || payment.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-600">Project Name:</span>{' '}
              <strong className="text-slate-900 font-semibold">{payment.project_title || 'Commercial Project'}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AMOUNT RECEIVED BANNER (Clean Light Blue Strip matching Real PDF) */}
      <div className="bg-[#E0F2FE]/70 border border-[#BAE6FD] p-3 px-4 mb-6">
        <div className="text-xs font-semibold text-slate-800">
          Amount Received:{' '}
          <span className="text-[#20A36B] font-bold text-base font-mono ml-1">
            ₹ {formatCurrency(amountReceived)}
          </span>
        </div>
        <div className="text-xs text-slate-700 font-medium mt-0.5">
          Amount in words:{' '}
          <span className="text-slate-900 font-semibold">{amountWords}</span>
        </div>
      </div>

      {/* 5. PAYMENT DETAILS (4-Column, 3-Row Grid matching Real PDF) */}
      <div className="mb-6">
        <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
          PAYMENT DETAILS
        </div>
        <div className="border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {/* Row 1 */}
              <tr className="divide-x divide-slate-200">
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Payment Mode
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-medium text-slate-900 text-center">
                  {payment.payment_method || 'UPI'}
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Transaction Details
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-mono font-medium text-slate-800 text-center">
                  {payment.transaction_reference ? `ID: ${payment.transaction_reference}` : 'ID: N/A'}
                </td>
              </tr>

              {/* Row 2 */}
              <tr className="divide-x divide-slate-200">
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Payment Date
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-medium text-slate-800 text-center">
                  {formatDate(payment.payment_date || payment.created_at)}
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Invoice Amount
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-mono font-medium text-slate-900 text-center">
                  ₹ {formatCurrency(invoiceAmount)}
                </td>
              </tr>

              {/* Row 3 */}
              <tr className="divide-x divide-slate-200">
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Amount Received
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-mono font-bold text-slate-900 text-center">
                  ₹ {formatCurrency(amountReceived)}
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#0077B6] text-white font-bold text-[11px] text-center uppercase tracking-wide">
                  Payment Status
                </td>
                <td className="w-1/4 py-2 px-4 bg-[#F1F5F9]/80 font-medium text-slate-800 text-center">
                  {payment.payment_status || 'Part Payment'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Footer: Disclaimer & FOR HERTZSOFT Signature Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end pt-4">
        {/* Disclaimer Note */}
        <div className="text-[11px] text-slate-600 leading-relaxed">
          <strong className="text-slate-800">Note:</strong> This receipt acknowledges only the amount actually received by Hertzsoft Technologies Private Limited. It is not a tax invoice. Any outstanding balance, if applicable, remains payable as per the agreed terms.
        </div>

        {/* Authorized Signature Card */}
        <div className="text-center md:text-right flex flex-col items-center md:items-end">
          <div className="text-[11px] font-bold text-[#0077B6] uppercase tracking-wide mb-1">
            FOR HERTZSOFT TECHNOLOGIES PRIVATE LIMITED
          </div>
          
          {/* Stamp & Seal */}
          <div className="my-1 relative">
            <div className="w-16 h-16 rounded-full border-2 border-[#0077B6]/50 flex flex-col items-center justify-center text-center p-1 bg-[#0077B6]/5 rotate-[-8deg]">
              <div className="text-[7px] font-black uppercase text-[#0077B6] tracking-tighter leading-tight">
                HERTZSOFT
              </div>
              <div className="text-[6px] font-bold text-emerald-700 uppercase">
                RECEIVED
              </div>
            </div>
          </div>

          <div className="font-extrabold text-slate-900 text-xs uppercase tracking-wide mt-1">
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
