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
            INVOICE
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
          <span className="text-slate-500">Invoice No.:</span>{' '}
          <strong className="text-slate-900 font-mono font-bold">{invoiceNumber}</strong>
        </div>
        <div>
          <span className="text-slate-500">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.quotation_date)}</strong>
        </div>
        <div>
          <span className="text-slate-500">Due Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.valid_until)}</strong>
        </div>
      </div>

      {/* 3. Entity Boxes (FROM and BILL TO) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* FROM Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            FROM
          </div>
          <div className="p-3.5 text-xs text-slate-700 leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">
              HERTZSOFT TECHNOLOGIES PRIVATE LIMITED
            </div>
            <div className="text-slate-600 mt-1">
              Office No. 102, First Floor, A Wing, Al Ameer Tower, Jail Road (South), Dongri, Mumbai: 400 009.
            </div>
            <div className="mt-2 text-slate-900 font-semibold">
              <span className="text-slate-500 font-normal">PAN NO.:</span> AAECH3898Q
            </div>
          </div>
        </div>

        {/* BILL TO Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            BILL TO
          </div>
          <div className="p-3.5 text-xs text-slate-700 leading-relaxed">
            <div>
              <span className="text-slate-500">Client Name:</span>{' '}
              <strong className="text-slate-900 text-sm">{quotation.client_name || 'Client Name'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Project Name:</span>{' '}
              <strong className="text-slate-800">{quotation.title || quotation.project_title || 'Maths4All Application'}</strong>
            </div>
            {quotation.client_company && (
              <div>
                <span className="text-slate-500">Company Name:</span>{' '}
                <span className="text-slate-800 font-medium">{quotation.client_company}</span>
              </div>
            )}
            <div>
              <span className="text-slate-500">Contact No.:</span>{' '}
              <span className="text-slate-800 font-mono">
                {quotation.client_phone ? `+91 ${quotation.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
              </span>
            </div>
            <div className="mt-1">
              <span className="text-slate-500">Address:</span>{' '}
              <span className="text-slate-700">
                {quotation.client_billing_address || '102 House, Galaxy Tower, Pipeline Road, Kurla(W), Mumbai - 400 070'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. SERVICE / PRODUCT DETAILS TABLE */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
          SERVICE / PRODUCT DETAILS
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wide">
              <th className="py-2 px-3 text-center w-14">SR. NO.</th>
              <th className="py-2 px-3">DESCRIPTION</th>
              <th className="py-2 px-3 text-center w-20">QTY</th>
              <th className="py-2 px-3 text-right w-36">BASE AMOUNT (₹)</th>
              <th className="py-2 px-3 text-right w-36">TOTAL AMOUNT (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {items.map((item, idx) => {
              const qty = Number(item.quantity) || 1;
              const rate = Number(item.rate) || 0;
              const total = Number(item.amount) || (qty * rate);
              return (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                  <td className="py-2.5 px-3 text-center font-semibold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-600">
                    {qty}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                    {formatCurrency(rate)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                    {formatCurrency(total)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Invoice Summary and Note */}
        <div className="border-t border-slate-200 bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-xs text-slate-600 max-w-sm pt-1 space-y-2">
            <div>
              <span className="font-semibold text-slate-700">Amount in words:</span>
              <div className="italic text-slate-800 font-medium mt-0.5">{amountWords}</div>
            </div>
            <div className="text-slate-600 font-medium text-[11.5px] pt-2">
              <strong>Note:</strong> Thank you for your business!
            </div>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-slate-900">₹ {formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Discount (if any):</span>
                <span className="font-mono">- ₹ {formatCurrency(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value:</span>
              <span className="font-mono font-medium text-slate-900">₹ {formatCurrency(taxableValue)}</span>
            </div>
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST ({quotation.tax_rate}%):</span>
                <span className="font-mono">+ ₹ {formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-[#E0F2FE] border border-[#BAE6FD] text-[#0077B6] p-2.5 rounded-md font-bold text-sm">
              <span>GRAND TOTAL:</span>
              <span className="font-mono text-base">₹ {formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Bottom Cards: ACCOUNT DETAILS & AUTHORIZED SIGNATORY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ACCOUNT DETAILS Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 flex items-center justify-between">
            <span>ACCOUNT DETAILS</span>
            <span className="text-[10px] font-normal opacity-85">UPI & Net Banking</span>
          </div>
          <div className="p-3.5 text-xs text-slate-700 leading-relaxed flex justify-between items-start gap-3">
            <div className="space-y-1">
              <div>
                <span className="text-slate-500">Account Name:</span>{' '}
                <strong className="text-slate-900">Hertzsoft Technologies Private Limited</strong>
              </div>
              <div>
                <span className="text-slate-500">Bank:</span>{' '}
                <span className="text-slate-800 font-semibold">ICICI Bank</span>
              </div>
              <div>
                <span className="text-slate-500">Branch:</span>{' '}
                <span className="text-slate-800">Bhat Bazar, Mumbai</span>
              </div>
              <div>
                <span className="text-slate-500">Account No.:</span>{' '}
                <strong className="text-slate-900 font-mono tracking-wider">122305001551</strong>
              </div>
              <div>
                <span className="text-slate-500">IFSC:</span>{' '}
                <strong className="text-slate-900 font-mono">ICIC0001223</strong>
              </div>
              <div className="pt-1">
                <span className="text-slate-500">UPI:</span>{' '}
                <strong className="text-[#0077B6] font-mono">8657242757@okbizaxis</strong>
              </div>
            </div>

            {/* UPI QR Code Badge */}
            <div className="shrink-0 flex flex-col items-center justify-center p-2 bg-white border border-slate-200 rounded-md shadow-xs text-center">
              <QrCode className="w-14 h-14 text-slate-800" strokeWidth={1.5} />
              <div className="text-[9px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Scan to Pay
              </div>
            </div>
          </div>
        </div>

        {/* AUTHORIZED SIGNATORY Card */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50 flex flex-col justify-between">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            AUTHORIZED SIGNATORY
          </div>
          <div className="p-4 text-center my-auto flex flex-col items-center justify-center">
            {/* Stamp & Seal Illustration */}
            <div className="relative mb-2">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#0077B6]/40 flex flex-col items-center justify-center text-center p-1 bg-[#0077B6]/5 rotate-[-8deg]">
                <div className="text-[8px] font-black uppercase text-[#0077B6] tracking-tighter leading-tight">
                  HERTZSOFT TECH
                </div>
                <div className="text-[7px] text-[#0077B6]/70 uppercase font-semibold my-0.5">
                  PVT. LTD.
                </div>
                <div className="text-[7px] font-bold text-emerald-700 uppercase">
                  VERIFIED
                </div>
              </div>
            </div>

            <div className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
              TAHSEEN S. GHATTE
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Signature and Stamp
            </div>
            <div className="text-[9.5px] text-slate-400 mt-1">
              Hertzsoft Technologies Private Limited
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

