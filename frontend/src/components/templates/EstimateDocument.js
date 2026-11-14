'use client';

import React from 'react';
import { numberToIndianWords } from '@/utils/numberToWords';

export default function EstimateDocument({ quotation, printable = false }) {
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
  const scopeModules = quotation.scope_modules && Array.isArray(quotation.scope_modules) && quotation.scope_modules.length > 0
    ? quotation.scope_modules
    : [
        { module: 'User App', deliverables: 'Login / registration, profile, dashboard, browse services / products, search and basic filters.' },
        { module: 'Payment Gateway', deliverables: 'Booking / order request flow, history, one payment gateway integration, push notifications and contact form' },
        { module: 'Admin Panel', deliverables: 'Admin login, user and listing management, booking / order status, basic reports, database and APIs' },
        { module: 'Testing & Deployment', deliverables: 'Testing, bug fixing, production build and deployment assistance.' }
      ];

  const thirdPartyCosts = quotation.third_party_costs && Array.isArray(quotation.third_party_costs) && quotation.third_party_costs.length > 0
    ? quotation.third_party_costs
    : [
        { service: 'Domain Registration', billing_basis: 'Yearly', amount: '2000' },
        { service: 'Shared Hosting', billing_basis: 'Yearly', amount: '1500' },
        { service: 'SMS Gateway', billing_basis: 'Usage based', amount: 'As per Provider' },
        { service: 'Google Map API', billing_basis: 'Usage based', amount: 'As per hit' },
        { service: 'Admin Panel Management', billing_basis: 'Monthly', amount: '5000' }
      ];

  const paymentMilestones = quotation.payment_milestones && Array.isArray(quotation.payment_milestones) && quotation.payment_milestones.length > 0
    ? quotation.payment_milestones
    : [
        { percent: 40, condition: 'on confirmation & kick off' },
        { percent: 40, condition: 'on UAT build / core completion' },
        { percent: 20, condition: 'before final handover' }
      ];

  const subtotal = Number(quotation.subtotal) || items.reduce((acc, it) => acc + (Number(it.quantity || 1) * Number(it.rate || 0)), 0);
  const discountAmount = Number(quotation.discount_amount) || 0;
  const grandTotal = Number(quotation.total_amount) || (subtotal - discountAmount);
  const amountWords = quotation.amount_in_words || numberToIndianWords(grandTotal);

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
            ESTIMATE
          </div>
          {quotation.version > 1 && (
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
              Revision v{quotation.version} {quotation.status === 'Superseded' ? '(Superseded)' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Mobile contact bar if sm is hidden */}
      <div className="sm:hidden text-center text-[10px] text-slate-600 border-b border-slate-100 pb-2 mb-3">
        www.hertzsoft.com | contact@hertzsoft.com | +91 86572 42757
      </div>

      {/* 2. Document Meta Row */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-[13px] text-slate-700 font-medium mb-5 px-1 gap-2">
        <div>
          <span className="text-slate-500">Estimate No.:</span>{' '}
          <strong className="text-slate-900 font-mono font-bold">{quotation.quotation_number || 'HE26001'}</strong>
        </div>
        <div>
          <span className="text-slate-500">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.quotation_date)}</strong>
        </div>
        <div>
          <span className="text-slate-500">Valid Until:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.valid_until)}</strong>
        </div>
      </div>

      {/* 3. Client & Project Info Banner (3 Navy header cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {/* PREPARED FOR */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            PREPARED FOR
          </div>
          <div className="p-3 text-xs leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">
              {quotation.client_name || 'Client Name'}
            </div>
            {quotation.client_company && (
              <div className="text-slate-600 font-medium">{quotation.client_company}</div>
            )}
            <div className="text-slate-600 mt-1 font-mono">
              {quotation.client_phone ? `+91 ${quotation.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
            </div>
          </div>
        </div>

        {/* PROJECT */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            PROJECT
          </div>
          <div className="p-3 text-xs leading-relaxed">
            <div className="font-bold text-slate-900 text-sm">
              {quotation.title || quotation.project_title || 'Project Deliverables'}
            </div>
            {quotation.project_type && (
              <div className="text-slate-600 font-medium mt-1">
                Type: {quotation.project_type}
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE */}
        <div className="border border-slate-200 rounded-md overflow-hidden bg-slate-50/50">
          <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
            TIMELINE
          </div>
          <div className="p-3 text-xs leading-relaxed flex items-center justify-start h-[calc(100%-28px)]">
            <div className="font-bold text-slate-900 text-sm">
              {quotation.timeline || '45 Days'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. SCOPE OF WORK TABLE */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 flex justify-between">
          <span>SCOPE OF WORK</span>
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wide">
              <th className="py-2 px-3 w-1/3 border-r border-slate-200">INCLUDED MODULES</th>
              <th className="py-2 px-3">KEY DELIVERABLES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {scopeModules.map((sm, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                <td className="py-2.5 px-3 font-semibold text-slate-900 border-r border-slate-200 align-top">
                  {sm.module}
                </td>
                <td className="py-2.5 px-3 text-slate-600 leading-relaxed">
                  {sm.deliverables}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 5. COST BREAKDOWN TABLE */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
          COST BREAKDOWN
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wide">
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

        {/* Cost Summary & In Words */}
        <div className="border-t border-slate-200 bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="text-xs text-slate-600 max-w-sm pt-1">
            <span className="font-semibold text-slate-700">Amount in words:</span>
            <div className="italic text-slate-800 font-medium mt-0.5">{amountWords}</div>
          </div>

          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-slate-900">₹ {formatCurrency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>One-time Discount:</span>
                <span className="font-mono">- ₹ {formatCurrency(discountAmount)}</span>
              </div>
            )}
            {quotation.tax_amount > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax / GST ({quotation.tax_rate}%):</span>
                <span className="font-mono">+ ₹ {formatCurrency(quotation.tax_amount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center bg-[#E0F2FE] border border-[#BAE6FD] text-[#0077B6] p-2.5 rounded-md font-bold text-sm">
              <span>GRAND TOTAL (₹):</span>
              <span className="font-mono text-base">₹ {formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 6. THIRD PARTY COST TABLE */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
          THIRD PARTY COST
        </div>
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wide">
              <th className="py-2 px-3">SERVICE</th>
              <th className="py-2 px-3">BILLING BASIS</th>
              <th className="py-2 px-3 text-right w-36">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 text-slate-700">
            {thirdPartyCosts.map((tp, idx) => (
              <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'}>
                <td className="py-2.5 px-3 font-medium text-slate-900">
                  {tp.service}
                </td>
                <td className="py-2.5 px-3 text-slate-600">
                  {tp.billing_basis}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                  {isNaN(Number(tp.amount)) ? tp.amount : `₹ ${formatCurrency(tp.amount)}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 7. PAYMENT SCHEDULE AND TERMS */}
      <div className="border border-slate-200 rounded-md overflow-hidden mb-6">
        <div className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5">
          PAYMENT SCHEDULE AND TERMS
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-4 gap-4 bg-slate-50/30 text-xs">
          {/* Payment Milestones */}
          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wide mb-2.5 text-[11px]">
              Payment Milestones:
            </div>
            <ul className="space-y-2 text-slate-700">
              {paymentMilestones.map((m, idx) => {
                const milestoneAmount = m.amount || (grandTotal * (Number(m.percent) / 100));
                return (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#0077B6] font-bold">•</span>
                    <span>
                      <strong className="font-semibold text-slate-900">{m.percent}% (₹ {formatCurrency(milestoneAmount)})</strong>{' '}
                      {m.condition}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Key terms */}
          <div>
            <div className="font-bold text-slate-900 uppercase tracking-wide mb-2.5 text-[11px]">
              Key terms:
            </div>
            <div className="text-slate-600 leading-relaxed text-[11.5px] whitespace-pre-line">
              {quotation.terms_and_conditions || `Estimate valid for 15 days. Third party fees (hosting, domain, app store accounts, SMS / WhatsApp / email credits, paid APIs and gateway transaction fees) are extra. Client to provide content, branding and access credentials. Additional features / scope changes will be quoted separately. Includes 30 day defect fix warranty after handover; ongoing maintenance is excluded. GST invoicing will follow applicable law. This estimate is not a tax invoice or receipt.`}
            </div>
          </div>
        </div>
      </div>

      {/* 8. Signature Block */}
      <div className="flex justify-between items-end pt-4 border-t border-slate-200 text-xs text-slate-600">
        <div>
          <div className="font-semibold text-slate-800">Tahseen S. Ghatte</div>
          <div className="text-[11px] text-slate-500">Authorized Signatory</div>
          <div className="text-[10px] text-slate-400">Hertzsoft Technologies Private Limited</div>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          Generated via Hertzsoft Commercial Suite
        </div>
      </div>

    </div>
  );
}

