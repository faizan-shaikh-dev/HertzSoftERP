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
    : [];

  const thirdPartyCosts = quotation.third_party_costs && Array.isArray(quotation.third_party_costs) && quotation.third_party_costs.length > 0
    ? quotation.third_party_costs
    : [];

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
            ESTIMATE
          </div>
          {quotation.version > 1 && (
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">
              Revision v{quotation.version} {quotation.status === 'Superseded' ? '(Superseded)' : ''}
            </div>
          )}
        </div>
      </div>

      {/* 2. Blue Divider Line with Document Meta */}
      <div className="flex flex-wrap items-center justify-between text-xs sm:text-[13px] text-slate-800 font-medium border-b-2 border-[#0077B6] pb-1.5 mb-6 gap-2">
        <div>
          <span className="text-slate-600">Estimate No.:</span>{' '}
          <strong className="text-[#0077B6] underline font-mono font-bold tracking-tight">
            {quotation.quotation_number || 'HE26001'}
          </strong>
        </div>
        <div>
          <span className="text-slate-600">Date:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.quotation_date)}</strong>
        </div>
        <div>
          <span className="text-slate-600">Valid Until:</span>{' '}
          <strong className="text-slate-900">{formatDate(quotation.valid_until)}</strong>
        </div>
      </div>

      {/* 3. Client & Project Info Banner (Single Unified 3-Column Container) */}
      <div className="border border-slate-200 overflow-hidden mb-6">
        {/* Blue Header Bar */}
        <div className="grid grid-cols-3 bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider py-1.5 px-4">
          <div className="text-center font-bold">PREPARED FOR</div>
          <div className="text-center font-bold border-l border-r border-[#0077B6]/40">PROJECT</div>
          <div className="text-center font-bold">TIMELINE</div>
        </div>

        {/* Light Grey Body */}
        <div className="grid grid-cols-3 bg-[#F1F5F9]/80 divide-x divide-slate-200 text-xs py-3 px-3">
          {/* Prepared for */}
          <div className="text-center space-y-0.5 px-2">
            <div className="font-bold text-slate-900 text-sm">
              {quotation.client_name || 'Client Name'}
            </div>
            {quotation.client_company && (
              <div className="text-slate-600 font-medium text-[11px]">
                {quotation.client_company}
              </div>
            )}
            <div className="text-slate-600 font-mono text-[11px]">
              {quotation.client_phone ? `+91 ${quotation.client_phone.replace('+91', '').trim()}` : '+91 87654 10982'}
            </div>
          </div>

          {/* Project */}
          <div className="text-center flex flex-col items-center justify-center font-semibold text-slate-900 px-3">
            <div>{quotation.title || quotation.project_title || 'Project Deliverables'}</div>
            {quotation.project_type && (
              <div className="text-[11px] text-slate-500 font-normal mt-0.5">
                ({quotation.project_type})
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="text-center flex items-center justify-center font-semibold text-slate-900 text-sm px-2">
            {quotation.timeline
              ? (quotation.timeline.toLowerCase().includes('day') || quotation.timeline.toLowerCase().includes('month')
                  ? quotation.timeline
                  : `${quotation.timeline} Days`)
              : '45 Days'}
          </div>
        </div>
      </div>

      {/* 4. SCOPE OF WORK TABLE */}
      {scopeModules.length > 0 && (
        <div className="mb-6">
          <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
            SCOPE OF WORK
          </div>
          <div className="border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-4 w-1/3 text-center border-r border-[#0077B6]/40">INCLUDED MODULES</th>
                  <th className="py-2 px-4 text-center">KEY DELIVERABLES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {scopeModules.map((sm, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-white' : 'bg-[#F1F5F9]/80'}>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 text-center border-r border-slate-200 align-top">
                      {sm.module}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 leading-relaxed">
                      {sm.deliverables}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COST BREAKDOWN TABLE */}
      <div className="mb-6">
        <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
          COST BREAKDOWN
        </div>
        <div className="border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
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
              {/* Subtotal Row */}
              <tr className="bg-white border-t border-slate-300 font-bold">
                <td colSpan={3} className="py-2.5 px-4 text-[#0077B6] font-bold">
                  Subtotal
                </td>
                <td className="py-2.5 px-4 text-right text-[#0077B6] font-bold font-mono text-sm">
                  {formatCurrency(subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Cost Summary & In Words */}
          <div className="border-t border-slate-200 bg-white p-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="text-xs text-slate-600 max-w-sm pt-1">
              <span className="font-semibold text-slate-700">Amount in words:</span>
              <div className="italic text-slate-800 font-medium mt-0.5">{amountWords}</div>
            </div>

            <div className="w-full sm:w-72 space-y-2 text-xs">
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
      </div>

      {/* 6. THIRD PARTY COST TABLE (Only if any) */}
      {thirdPartyCosts.length > 0 && (
        <div className="mb-6">
          <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
            THIRD PARTY COST
          </div>
          <div className="border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-2 px-4 text-center">SERVICE</th>
                  <th className="py-2 px-4 text-center border-l border-r border-[#0077B6]/40">BILLING BASIS</th>
                  <th className="py-2 px-4 text-center w-36">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {thirdPartyCosts.map((tp, idx) => (
                  <tr key={idx} className={idx % 2 === 1 ? 'bg-white' : 'bg-[#F1F5F9]/80'}>
                    <td className="py-2.5 px-4 font-medium text-slate-900 border-r border-slate-200">
                      {tp.service}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 text-center border-r border-slate-200">
                      {tp.billing_basis}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                      {isNaN(Number(tp.amount)) ? tp.amount : `₹ ${formatCurrency(tp.amount)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 7. PAYMENT SCHEDULE AND TERMS */}
      <div className="mb-6">
        <div className="text-[#0077B6] font-bold text-xs uppercase tracking-wider mb-1.5">
          PAYMENT SCHEDULE AND TERMS
        </div>
        <div className="border border-slate-200 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 p-4 gap-4 bg-[#F1F5F9]/40 text-xs">
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
