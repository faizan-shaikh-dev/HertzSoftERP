'use client';

import React from 'react';
import { numberToIndianWords } from '@/utils/numberToWords';
import { QrCode } from 'lucide-react';

export default function InvoiceDocument({ quotation, printable = false }) {
  if (!quotation) return null;

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

  const items = quotation.items || [];
  const subtotal = Number(quotation.subtotal) || items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.rate || 0)), 0);
  const discountAmount = Number(quotation.discount_amount) || 0;
  const taxableValue = Math.max(0, subtotal - discountAmount);
  const taxAmount = Number(quotation.tax_amount) || 0;
  const grandTotal = Number(quotation.total_amount) || (taxableValue + taxAmount);
  const amountWords = quotation.amount_in_words || numberToIndianWords(grandTotal);

  const invoiceNumber = quotation.invoice_number || quotation.quotation_number?.replace('HE', 'HIN') || 'HIN26001';

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
            INVOICE
          </div>
        </div>
      </div>

      {/* 2. Blue Divider Line with Document Meta */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-[13px] text-slate-800 font-medium border-b-2 border-[#0077B6] pb-1.5 mb-6 gap-2">
        <div>
          <span className="text-slate-600">Invoice No.:</span>{' '}
          <strong className="text-[#0077B6] underline font-mono font-bold tracking-tight">
            {invoiceNumber}
          </strong>
        </div>
        <div>
          <span className="text-slate-600">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.quotation_date)}</strong>
        </div>
        <div>
          <span className="text-slate-600">Due Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.valid_until)}</strong>
        </div>
      </div>

      {/* 3. FROM and BILL TO (Single Unified 2-Column Container matching Real PDF) */}
      <div className="border border-slate-200 overflow-hidden mb-6">
        {/* Blue Header Bar */}
        <div className="grid grid-cols-2 bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-4">
          <div className="text-center font-bold">FROM</div>
          <div className="text-center font-bold border-l border-[#0077B6]/40">BILL TO</div>
        </div>

        {/* Light Grey Body */}
        <div className="grid grid-cols-2 bg-[#F1F5F9]/80 divide-x divide-slate-200 text-xs py-3.5 px-4">
          {/* FROM Column */}
          <div className="space-y-1 pr-2">
            <div className="font-bold text-slate-900 text-sm">
              HERTZSOFT TECHNOLOGIES PRIVATE LIMITED
            </div>
            <div className="text-slate-700 text-[11.5px] leading-relaxed">
              Office No. 102, First Floor, A-Wing, Al-Ameer Tower, Jail Road (South), Dongri, Mumbai: 400 009.
            </div>
            <div className="text-slate-900 font-semibold pt-1">
              <span className="text-slate-500 font-normal">PAN NO.:</span> AAECH3898Q
            </div>
          </div>

          {/* BILL TO Column */}
          <div className="space-y-1 pl-4">
            <div>
              <span className="text-slate-600">Client Name:</span>{' '}
              <strong className="text-slate-900 font-semibold">{quotation.client_name || 'Client Name'}</strong>
            </div>
            <div>
              <span className="text-slate-600">Project Name:</span>{' '}
              <strong className="text-slate-900">{quotation.title || quotation.project_title || 'Software Development Project'}</strong>
            </div>
            <div>
              <span className="text-slate-600">Company Name:</span>{' '}
              <span className="text-slate-800">{quotation.client_company || '-'}</span>
            </div>
            <div>
              <span className="text-slate-600">Contact No.:</span>{' '}
              <span className="text-slate-800 font-mono">
                {quotation.client_phone ? `+91 ${quotation.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
              </span>
            </div>
            <div>
              <span className="text-slate-600">Address:</span>{' '}
              <span className="text-slate-700">
                {quotation.client_billing_address || '102 House, Galaxy Tower, Pipeline Road, Kurla(W), Mumbai – 400 070'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SERVICE / PRODUCT DETAILS TABLE */}
      <div className="mb-6">
        <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
          SERVICE / PRODUCT DETAILS
        </div>
        <div className="border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2 px-3 text-center w-14 border-r border-[#0077B6]/40">SR. NO.</th>
                <th className="py-2 px-4 text-center">DESCRIPTION</th>
                <th className="py-2 px-3 text-center w-20 border-l border-r border-[#0077B6]/40">QTY</th>
                <th className="py-2 px-4 text-center w-36 border-r border-[#0077B6]/40">BASE AMOUNT (₹)</th>
                <th className="py-2 px-4 text-center w-36">TOTAL AMOUNT (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {items.map((item, idx) => {
                const qty = Number(item.quantity) || 1;
                const rate = Number(item.rate) || 0;
                const total = Number(item.amount) || (qty * rate);
                return (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-white' : 'bg-[#F1F5F9]/80'}>
                    <td className="py-2.5 px-3 text-center font-semibold text-slate-700 border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-200">
                      {item.description}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-700 border-r border-slate-200">
                      {qty}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 border-r border-slate-200">
                      {formatCurrency(rate)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-slate-900">
                      {formatCurrency(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Invoice Summary and Note matching Real PDF */}
          <div className="border-t border-slate-200 bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-slate-600 max-w-sm pt-1 space-y-2">
              <div>
                <span className="font-semibold text-slate-700">Amount in words:</span>{' '}
                <span className="font-semibold text-slate-900">{amountWords}</span>
              </div>
              <div className="text-slate-600 font-medium text-[11.5px] pt-1">
                <strong>Note:</strong> Thank you for your business!
              </div>
            </div>

            <div className="w-full sm:w-72 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900">₹ {formatCurrency(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount (if any):</span>
                  <span className="font-mono font-semibold">- ₹ {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-700">
                <span className="font-medium">Taxable Value:</span>
                <span className="font-mono font-semibold text-slate-900">₹ {formatCurrency(taxableValue)}</span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span className="font-medium">Tax / GST ({quotation.tax_rate}%):</span>
                  <span className="font-mono font-semibold text-slate-900">+ ₹ {formatCurrency(taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center bg-[#E0F2FE] border border-[#BAE6FD] text-[#0077B6] p-2.5 rounded-none font-bold text-sm mt-1">
                <span className="uppercase tracking-wider">GRAND TOTAL:</span>
                <span className="font-mono text-base">₹ {formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Unified Container: ACCOUNT DETAILS & AUTHORIZED SIGNATORY (Matching Real PDF) */}
      <div className="border border-slate-200 overflow-hidden mb-2">
        {/* Blue Header Bar */}
        <div className="grid grid-cols-2 bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-4">
          <div className="text-center font-bold">ACCOUNT DETAILS</div>
          <div className="text-center font-bold border-l border-[#0077B6]/40">AUTHORIZED SIGNATORY</div>
        </div>

        {/* Light Grey Body */}
        <div className="grid grid-cols-2 bg-[#F1F5F9]/80 divide-x divide-slate-200 text-xs py-3.5 px-4">
          {/* Left Column: Bank Details & QR */}
          <div className="flex justify-between items-start gap-3 pr-2">
            <div className="space-y-1">
              <div>
                <span className="text-slate-600">Account Name:</span>{' '}
                <strong className="text-slate-900">Hertzsoft Technologies Private Limited</strong>
              </div>
              <div>
                <span className="text-slate-600">Bank:</span>{' '}
                <strong className="text-slate-900">ICICI Bank</strong>
              </div>
              <div>
                <span className="text-slate-600">Branch:</span>{' '}
                <span className="text-slate-800">Bhat Bazar, Mumbai</span>
              </div>
              <div>
                <span className="text-slate-600">Account No.:</span>{' '}
                <strong className="text-slate-900 font-mono tracking-wider">122305001551</strong>
              </div>
              <div>
                <span className="text-slate-600">IFSC:</span>{' '}
                <strong className="text-slate-900 font-mono">ICIC0001223</strong>
              </div>
              <div className="pt-0.5">
                <span className="text-slate-600">UPI:</span>{' '}
                <strong className="text-[#0077B6] font-mono">8657242757@okbizaxis</strong>
              </div>
            </div>

            {/* QR Code */}
            <div className="shrink-0 flex flex-col items-center justify-center p-1.5 bg-white border border-slate-200 rounded text-center">
              <img 
                src="/images/hertzsoft-upi-qr.png" 
                alt="Axis Bank UPI QR" 
                className="w-16 h-16 object-contain" 
              />
              <div className="text-[9px] font-mono text-slate-500 mt-1">8657242757@okbizaxis</div>
            </div>
          </div>

          {/* Right Column: Stamp & Signature */}
          <div className="flex flex-col items-center justify-center text-center p-2 pl-4">
            <div className="my-1 flex items-center justify-center">
              <img
                src="/images/hertzsoft-stamp-signature.png"
                alt="Official Stamp & Signature - Tahseen S. Ghatte"
                className="w-36 h-auto object-contain max-h-20"
              />
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

    </div>
  );
}
