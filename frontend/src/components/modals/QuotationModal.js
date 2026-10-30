'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import quotationService from '@/services/quotationService';
import projectService from '@/services/projectService';
import {
  XCircle,
  Plus,
  Trash2,
  Building2,
  FolderKanban,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const DEFAULT_TERMS = `1. 50% Advance on project initiation.\n2. 50% Upon milestone completion.\n3. Quotation is valid for 30 days from date of issue.`;

export default function QuotationModal({
  isOpen,
  onClose,
  quotation = null,
  mode = 'create', // 'create' | 'edit' | 'revise'
  onSuccess
}) {
  const [mounted, setMounted] = useState(false);

  // Reference data
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Form Fields
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');
  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate, setTaxRate] = useState(18);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');

  // Line items
  const [items, setItems] = useState([
    { description: '', quantity: 1, rate: '', discount_percent: 0, tax_percent: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clients and projects on mount
  useEffect(() => {
    if (isOpen) {
      setLoadingRefs(true);
      Promise.all([
        projectService.getClients().catch(() => ({ data: [] })),
        projectService.getProjects().catch(() => ({ data: [] }))
      ])
        .then(([clientsRes, projectsRes]) => {
          setClients(clientsRes.data || []);
          setProjects(projectsRes.data || []);
        })
        .finally(() => {
          setLoadingRefs(false);
        });
    }
  }, [isOpen]);

  // Initialize or reset form values
  useEffect(() => {
    if (!isOpen) return;

    setError('');

    if (quotation && (mode === 'edit' || mode === 'revise')) {
      setClientId(quotation.client_id || '');
      setProjectId(quotation.project_id || '');
      setTitle(quotation.title || '');
      setQuotationDate(
        quotation.quotation_date
          ? quotation.quotation_date.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );

      // In revise mode, default validity to 30 days from today
      if (mode === 'revise') {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        setValidUntil(d.toISOString().slice(0, 10));
      } else {
        setValidUntil(quotation.valid_until ? quotation.valid_until.slice(0, 10) : '');
      }

      setDiscountRate(Number(quotation.discount_rate) || 0);
      setTaxRate(Number(quotation.tax_rate) || 18);
      setTerms(quotation.terms_and_conditions || DEFAULT_TERMS);
      setNotes(quotation.notes || '');

      if (quotation.items && quotation.items.length > 0) {
        setItems(
          quotation.items.map((it) => ({
            description: it.description || '',
            quantity: Number(it.quantity) || 1,
            rate: it.rate !== undefined ? String(it.rate) : '',
            discount_percent: Number(it.discount_percent) || 0,
            tax_percent: Number(it.tax_percent) || 0
          }))
        );
      } else {
        setItems([{ description: '', quantity: 1, rate: '', discount_percent: 0, tax_percent: 0 }]);
      }
    } else {
      // Create mode default values
      const today = new Date();
      const thirtyDays = new Date();
      thirtyDays.setDate(today.getDate() + 30);

      setClientId('');
      setProjectId('');
      setTitle('Commercial Proposal & Software Quotation');
      setQuotationDate(today.toISOString().slice(0, 10));
      setValidUntil(thirtyDays.toISOString().slice(0, 10));
      setDiscountRate(0);
      setTaxRate(18);
      setTerms(DEFAULT_TERMS);
      setNotes('');
      setItems([{ description: '', quantity: 1, rate: '', discount_percent: 0, tax_percent: 0 }]);
    }
  }, [isOpen, quotation, mode]);

  // Line item handlers
  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: '', quantity: 1, rate: '', discount_percent: 0, tax_percent: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      toast.warning('A quotation must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Live Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;

    const rowDetails = items.map((item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      const disc = Number(item.discount_percent) || 0;
      const tax = Number(item.tax_percent) || 0;

      const base = qty * rate;
      const discAmt = base * (disc / 100);
      const net = base - discAmt;
      const taxAmt = net * (tax / 100);
      const rowTotal = net + taxAmt;

      subtotal += net;

      return { rowTotal: Math.round(rowTotal * 100) / 100 };
    });

    const discRateNum = Number(discountRate) || 0;
    const discountAmount = Math.round(subtotal * (discRateNum / 100) * 100) / 100;

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRateNum = Number(taxRate) || 0;
    const taxAmount = Math.round(taxableAmount * (taxRateNum / 100) * 100) / 100;

    const grandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

    return {
      rowDetails,
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount,
      taxAmount,
      grandTotal
    };
  }, [items, discountRate, taxRate]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amt || 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!clientId) {
      setError('Please select a client for this quotation.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a quotation subject/title.');
      return;
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        setError(`Please enter a description for item #${i + 1}.`);
        return;
      }
      if (Number(it.rate) <= 0) {
        setError(`Please enter a valid rate greater than zero for item #${i + 1}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        client_id: clientId,
        project_id: projectId || null,
        title: title.trim(),
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        discount_rate: Number(discountRate) || 0,
        tax_rate: Number(taxRate) || 0,
        terms_and_conditions: terms.trim() || null,
        notes: notes.trim() || null,
        items: items.map((it, idx) => ({
          description: it.description.trim(),
          quantity: Number(it.quantity) || 1,
          rate: Number(it.rate) || 0,
          discount_percent: Number(it.discount_percent) || 0,
          tax_percent: Number(it.tax_percent) || 0,
          sort_order: idx
        }))
      };

      if (mode === 'revise') {
        await quotationService.reviseQuotation(quotation.id, payload);
        toast.success(`Revised quotation (v${Number(quotation.version || 1) + 1}) created successfully!`);
      } else if (mode === 'edit') {
        await quotationService.updateQuotation(quotation.id, payload);
        toast.success(`Quotation ${quotation.quotation_number} updated successfully!`);
      } else {
        const created = await quotationService.createQuotation(payload);
        toast.success(`Quotation ${created.data?.quotation_number || ''} generated successfully!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving quotation:', err);
      const msg = err.message || 'Failed to save quotation.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white shrink-0">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              {mode === 'revise'
                ? `Revise Quotation #${quotation?.quotation_number} (v${Number(quotation?.version || 1) + 1})`
                : mode === 'edit'
                ? `Edit Quotation #${quotation?.quotation_number}`
                : 'Create Quotation'}
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              {mode === 'revise'
                ? 'Creates a new version. The previous version will be preserved as Superseded.'
                : 'Specify client deliverables, rates, tax calculations, and terms.'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3.5 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary Meta Grid (Client, Project, Title) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#4689C8]" />
                <span>Client / Account <span className="text-[#f5365c] font-bold">*</span></span>
              </label>
              {loadingRefs ? (
                <div className="flex items-center gap-2 text-xs text-[#8898aa] py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4689C8]" />
                  <span>Loading clients...</span>
                </div>
              ) : (
                <select
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
                >
                  <option value="">-- Select Client --</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.company_name ? `(${c.company_name})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Linked Project (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#8898aa]" />
                <span>Link to Project (Optional)</span>
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                <option value="">-- No linked project / New Prospect --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.client_company || p.client_name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Proposal Title */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Quotation Subject / Proposal Title <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Enterprise CRM Software & Maintenance Retainer"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
            />
          </div>

          {/* Dates & Rates Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8f9fe] p-4 rounded-md border border-[#dee2e6]">
            <div>
              <label className="block text-[11px] font-semibold text-[#525f7f] mb-1">
                Issue Date <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#525f7f] mb-1">
                Valid Until <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#525f7f] mb-1">
                Overall Discount (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountRate}
                onChange={(e) => setDiscountRate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#525f7f] mb-1">
                GST / Tax (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
              />
            </div>
          </div>

          {/* Line Items Table Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-[#525f7f]">
                Deliverables & Line Items ({items.length}) <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-[#4689C8] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line Item</span>
              </button>
            </div>

            <div className="border border-[#dee2e6] rounded-md overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#f8f9fe] text-[10px] font-bold uppercase text-[#8898aa] border-b border-[#dee2e6]">
                  <tr>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[240px]">Description / Deliverable *</th>
                    <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right">Rate (₹) *</th>
                    <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                    <th className="py-2.5 px-3 w-20 text-right">Tax %</th>
                    <th className="py-2.5 px-3 w-28 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6] bg-white">
                  {items.map((item, index) => {
                    const rowCalc = calculations.rowDetails[index]?.rowTotal || 0;

                    return (
                      <tr key={index} className="hover:bg-[#f8f9fe] transition">
                        <td className="py-2 px-3 text-center text-[#8898aa] font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Next.js Frontend Architecture & API Integration"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs bg-white text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-center bg-white text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            required
                            placeholder="0"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-right bg-white text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.discount_percent}
                            onChange={(e) => handleItemChange(index, 'discount_percent', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs text-right bg-white text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            value={item.tax_percent}
                            onChange={(e) => handleItemChange(index, 'tax_percent', e.target.value)}
                            className="w-full px-2 py-1.5 text-xs text-right bg-white text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-[#172b4d]">
                          {formatCurrency(rowCalc)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            disabled={items.length <= 1}
                            className="p-1 rounded text-[#adb5bd] hover:text-[#f5365c] hover:bg-[#fdf2f2] disabled:opacity-30 disabled:hover:text-[#adb5bd] cursor-pointer"
                            title="Remove Line Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Calculation Summary Block */}
          <div className="flex justify-end pt-1">
            <div className="w-full sm:w-80 bg-[#f8f9fe] rounded-md border border-[#dee2e6] p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#525f7f]">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#172b4d]">{formatCurrency(calculations.subtotal)}</span>
              </div>

              {calculations.discountAmount > 0 && (
                <div className="flex items-center justify-between text-[#f5365c]">
                  <span>Discount ({discountRate}%):</span>
                  <span className="font-semibold">- {formatCurrency(calculations.discountAmount)}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-[#525f7f]">
                <span>GST / Tax ({taxRate}%):</span>
                <span className="font-semibold text-[#172b4d]">+ {formatCurrency(calculations.taxAmount)}</span>
              </div>

              <div className="pt-2 border-t border-[#dee2e6] flex items-center justify-between font-extrabold text-sm text-[#172b4d]">
                <span>Grand Total:</span>
                <span className="text-[#4689C8] text-base">{formatCurrency(calculations.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Terms & Conditions & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment terms, validity and milestones..."
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition resize-y"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Internal Remarks / Client Notes
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special considerations, delivery schedule notes..."
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition resize-y"
              />
            </div>
          </div>

          {/* Full-Width Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4689C8] hover:bg-[#3876b0] text-white font-bold text-sm rounded shadow-md shadow-[#4689C8]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Quotation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {mode === 'revise'
                      ? `Create Revised Version (v${Number(quotation?.version || 1) + 1})`
                      : mode === 'edit'
                      ? 'Update Quotation'
                      : 'Save & Generate Quotation'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
