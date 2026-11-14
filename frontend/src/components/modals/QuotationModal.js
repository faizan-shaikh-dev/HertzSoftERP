'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import quotationService from '@/services/quotationService';
import projectService from '@/services/projectService';
import {
  X,
  Plus,
  Trash2,
  Building2,
  FolderKanban,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  DollarSign,
  Server,
  Clock,
  Calendar,
  Percent,
  FileText
} from 'lucide-react';

const DEFAULT_TERMS = `Estimate valid for 15 days. Third party fees (hosting, domain, app store accounts, SMS / WhatsApp / email credits, paid APIs and gateway transaction fees) are extra. Client to provide content, branding and access credentials. Additional features / scope changes will be quoted separately. Includes 30 day defect fix warranty after handover; ongoing maintenance is excluded. GST invoicing will follow applicable law. This estimate is not a tax invoice or receipt.`;

const DEFAULT_SCOPE_MODULES = [
  { module: 'User App', deliverables: 'Login / registration, profile, dashboard, browse services / products, search and basic filters.' },
  { module: 'Payment Gateway', deliverables: 'Booking / order request flow, history, one payment gateway integration, push notifications and contact form' },
  { module: 'Admin Panel', deliverables: 'Admin login, user and listing management, booking / order status, basic reports, database and APIs' },
  { module: 'Testing & Deployment', deliverables: 'Testing, bug fixing, production build and deployment assistance.' }
];

const DEFAULT_THIRD_PARTY_COSTS = [
  { service: 'Domain Registration', billing_basis: 'Yearly', amount: '2000' },
  { service: 'Shared Hosting', billing_basis: 'Yearly', amount: '1500' },
  { service: 'SMS Gateway', billing_basis: 'Usage based', amount: 'As per Provider' },
  { service: 'Google Map API', billing_basis: 'Usage based', amount: 'As per hit' },
  { service: 'Admin Panel Management', billing_basis: 'Monthly', amount: '5000' }
];

const DEFAULT_PAYMENT_MILESTONES = [
  { percent: 40, condition: 'on confirmation & kick off' },
  { percent: 40, condition: 'on UAT build / core completion' },
  { percent: 20, condition: 'before final handover' }
];

const DEFAULT_ITEMS = [
  { description: 'Flutter Application Development Hybrid', quantity: 1, rate: '150000', discount_percent: 0, tax_percent: 0 },
  { description: 'Admin Panel', quantity: 1, rate: '40000', discount_percent: 0, tax_percent: 0 },
  { description: 'Static Website', quantity: 1, rate: '15000', discount_percent: 0, tax_percent: 0 },
  { description: 'Testing & Deployment', quantity: 1, rate: '15000', discount_percent: 0, tax_percent: 0 },
  { description: 'Handover', quantity: 1, rate: '10000', discount_percent: 0, tax_percent: 0 }
];

export default function QuotationModal({
  isOpen,
  onClose,
  quotation = null,
  mode = 'create', // 'create' | 'edit' | 'revise'
  onSuccess
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'scope' | 'pricing' | 'thirdparty' | 'terms'

  // Reference data
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  // Tab 1: General Info
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [title, setTitle] = useState('');
  const [projectType, setProjectType] = useState('Mobile Application');
  const [timeline, setTimeline] = useState('45 Days');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10));
  const [validUntil, setValidUntil] = useState('');

  // Tab 2: Scope Modules
  const [scopeModules, setScopeModules] = useState(DEFAULT_SCOPE_MODULES);

  // Tab 3: Cost & Discount
  const [items, setItems] = useState(DEFAULT_ITEMS);
  const [discountType, setDiscountType] = useState('flat'); // 'flat' | 'percent'
  const [flatDiscount, setFlatDiscount] = useState('30000');
  const [discountRate, setDiscountRate] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  // Tab 4: Third Party Costs
  const [thirdPartyCosts, setThirdPartyCosts] = useState(DEFAULT_THIRD_PARTY_COSTS);

  // Tab 5: Milestones & Terms
  const [paymentMilestones, setPaymentMilestones] = useState(DEFAULT_PAYMENT_MILESTONES);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clients and projects
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
    setActiveTab('details');

    if (quotation && (mode === 'edit' || mode === 'revise')) {
      setClientId(quotation.client_id || '');
      setProjectId(quotation.project_id || '');
      setTitle(quotation.title || '');
      setProjectType(quotation.project_type || 'Mobile Application');
      setTimeline(quotation.timeline || '45 Days');
      setQuotationDate(
        quotation.quotation_date
          ? quotation.quotation_date.slice(0, 10)
          : new Date().toISOString().slice(0, 10)
      );

      if (mode === 'revise') {
        const d = new Date();
        d.setDate(d.getDate() + 15);
        setValidUntil(d.toISOString().slice(0, 10));
      } else {
        setValidUntil(quotation.valid_until ? quotation.valid_until.slice(0, 10) : '');
      }

      // Discount
      if (Number(quotation.discount_amount) > 0) {
        setDiscountType('flat');
        setFlatDiscount(String(quotation.discount_amount));
        setDiscountRate(0);
      } else {
        setDiscountType('percent');
        setDiscountRate(Number(quotation.discount_rate) || 0);
        setFlatDiscount('0');
      }

      setTaxRate(Number(quotation.tax_rate) || 0);
      setTerms(quotation.terms_and_conditions || DEFAULT_TERMS);
      setNotes(quotation.notes || '');

      // Scope
      if (quotation.scope_modules && Array.isArray(quotation.scope_modules) && quotation.scope_modules.length > 0) {
        setScopeModules(quotation.scope_modules);
      } else {
        setScopeModules(DEFAULT_SCOPE_MODULES);
      }

      // Third party
      if (quotation.third_party_costs && Array.isArray(quotation.third_party_costs) && quotation.third_party_costs.length > 0) {
        setThirdPartyCosts(quotation.third_party_costs);
      } else {
        setThirdPartyCosts(DEFAULT_THIRD_PARTY_COSTS);
      }

      // Milestones
      if (quotation.payment_milestones && Array.isArray(quotation.payment_milestones) && quotation.payment_milestones.length > 0) {
        setPaymentMilestones(quotation.payment_milestones);
      } else {
        setPaymentMilestones(DEFAULT_PAYMENT_MILESTONES);
      }

      // Line items
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
        setItems(DEFAULT_ITEMS);
      }
    } else {
      // Create mode default values
      const today = new Date();
      const fifteenDays = new Date();
      fifteenDays.setDate(today.getDate() + 15);

      setClientId('');
      setProjectId('');
      setTitle('Maths4All Mobile Application');
      setProjectType('Mobile Application');
      setTimeline('45 Days');
      setQuotationDate(today.toISOString().slice(0, 10));
      setValidUntil(fifteenDays.toISOString().slice(0, 10));
      setDiscountType('flat');
      setFlatDiscount('30000');
      setDiscountRate(0);
      setTaxRate(0);
      setTerms(DEFAULT_TERMS);
      setNotes('');
      setScopeModules(DEFAULT_SCOPE_MODULES);
      setThirdPartyCosts(DEFAULT_THIRD_PARTY_COSTS);
      setPaymentMilestones(DEFAULT_PAYMENT_MILESTONES);
      setItems(DEFAULT_ITEMS);
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
      toast.warning('An estimate must contain at least one line item.');
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

  // Scope handlers
  const handleAddScope = () => {
    setScopeModules((prev) => [...prev, { module: '', deliverables: '' }]);
  };
  const handleRemoveScope = (idx) => {
    setScopeModules((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleScopeChange = (idx, field, value) => {
    setScopeModules((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Third party handlers
  const handleAddThirdParty = () => {
    setThirdPartyCosts((prev) => [...prev, { service: '', billing_basis: 'Yearly', amount: '' }]);
  };
  const handleRemoveThirdParty = (idx) => {
    setThirdPartyCosts((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleThirdPartyChange = (idx, field, value) => {
    setThirdPartyCosts((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  // Milestone handlers
  const handleAddMilestone = () => {
    setPaymentMilestones((prev) => [...prev, { percent: 20, condition: '' }]);
  };
  const handleRemoveMilestone = (idx) => {
    setPaymentMilestones((prev) => prev.filter((_, i) => i !== idx));
  };
  const handleMilestoneChange = (idx, field, value) => {
    setPaymentMilestones((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
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

    let discountAmount = 0;
    if (discountType === 'flat') {
      discountAmount = Math.round(Number(flatDiscount) * 100) / 100 || 0;
    } else {
      const discRateNum = Number(discountRate) || 0;
      discountAmount = Math.round(subtotal * (discRateNum / 100) * 100) / 100;
    }

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
  }, [items, discountType, flatDiscount, discountRate, taxRate]);

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
      setError('Please select a client for this estimate.');
      setActiveTab('details');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a project/estimate title.');
      setActiveTab('details');
      return;
    }

    // Validate line items
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        setError(`Please enter a description for item #${i + 1}.`);
        setActiveTab('pricing');
        return;
      }
      if (Number(it.rate) <= 0) {
        setError(`Please enter a valid rate greater than zero for item #${i + 1}.`);
        setActiveTab('pricing');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        client_id: clientId,
        project_id: projectId || null,
        title: title.trim(),
        timeline: timeline.trim(),
        project_type: projectType.trim(),
        quotation_date: quotationDate,
        valid_until: validUntil || null,
        discount_rate: discountType === 'percent' ? Number(discountRate) || 0 : 0,
        discount_amount: discountType === 'flat' ? Number(flatDiscount) || 0 : calculations.discountAmount,
        tax_rate: Number(taxRate) || 0,
        terms_and_conditions: terms.trim() || null,
        notes: notes.trim() || null,
        scope_modules: scopeModules.filter(s => s.module.trim()),
        third_party_costs: thirdPartyCosts.filter(t => t.service.trim()),
        payment_milestones: paymentMilestones.filter(m => Number(m.percent) > 0),
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
        toast.success(`Revised Estimate (v${Number(quotation.version || 1) + 1}) created successfully!`);
      } else if (mode === 'edit') {
        await quotationService.updateQuotation(quotation.id, payload);
        toast.success(`Estimate ${quotation.quotation_number} updated successfully!`);
      } else {
        const created = await quotationService.createQuotation(payload);
        toast.success(`Estimate ${created.data?.quotation_number || ''} generated successfully!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving quotation:', err);
      const msg = err.message || 'Failed to save estimate.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0077B6] text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {mode === 'revise'
                  ? `Revise Estimate #${quotation?.quotation_number} (Create v${Number(quotation?.version || 1) + 1})`
                  : mode === 'edit'
                  ? `Edit Estimate #${quotation?.quotation_number} (v${quotation?.version || 1})`
                  : 'New Commercial Estimate (HE26001)'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {mode === 'revise'
                  ? 'Revisions allow updating rates and scope while archiving prior proposals in the audit ledger.'
                  : 'Customize deliverables, line items, third-party costs, discounts, and payment terms.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-700 transition cursor-pointer p-1.5 rounded-full hover:bg-slate-100"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50/70 overflow-x-auto text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'details'
                ? 'border-[#0077B6] text-[#0077B6] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>1. General & Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scope')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'scope'
                ? 'border-[#0077B6] text-[#0077B6] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2. Scope of Work ({scopeModules.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'pricing'
                ? 'border-[#0077B6] text-[#0077B6] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>3. Cost Breakdown ({items.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thirdparty')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'thirdparty'
                ? 'border-[#0077B6] text-[#0077B6] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>4. Third Party Costs</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`py-3 px-3.5 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-[#0077B6] text-[#0077B6] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>5. Milestones & Terms</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: GENERAL & TIMELINE */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-[#0077B6]" />
                    <span>Client / Account <span className="text-red-500 font-bold">*</span></span>
                  </label>
                  {loadingRefs ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0077B6]" />
                      <span>Loading clients...</span>
                    </div>
                  ) : (
                    <select
                      required
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-lg border border-slate-300 focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 outline-none cursor-pointer"
                    >
                      <option value="">-- Select Client --</option>
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.phone}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Linked Project */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                    <span>Link to Project (Optional)</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-lg border border-slate-300 focus:border-[#0077B6] focus:ring-2 focus:ring-[#0077B6]/20 outline-none cursor-pointer"
                  >
                    <option value="">-- No linked project / New Proposal --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.client_company || p.client_name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title & Project Type */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Project / Proposal Title <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Maths4All Mobile Application"
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-lg border border-slate-300 focus:border-[#0077B6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Project Type
                  </label>
                  <input
                    type="text"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value)}
                    placeholder="e.g. Mobile Application / ERP"
                    className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-lg border border-slate-300 focus:border-[#0077B6] outline-none"
                  />
                </div>
              </div>

              {/* Timeline, Date, Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Timeline (Duration) <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    placeholder="e.g. 45 Days / 2 Months"
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimate Date <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={quotationDate}
                    onChange={(e) => setQuotationDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Until <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SCOPE OF WORK */}
          {activeTab === 'scope' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Scope Deliverables & Included Modules</h4>
                  <p className="text-xs text-slate-500">Defines the functional modules included in the official Estimate scope.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddScope}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Module</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3 w-1/3">Included Module</th>
                      <th className="py-2.5 px-3">Key Deliverables</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {scopeModules.map((sm, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 align-top">
                          <input
                            type="text"
                            required
                            placeholder="e.g. User App / Admin Panel"
                            value={sm.module}
                            onChange={(e) => handleScopeChange(idx, 'module', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-900 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                          />
                        </td>
                        <td className="p-2.5 align-top">
                          <textarea
                            rows={2}
                            required
                            placeholder="e.g. Login, profile, dashboard, browse services..."
                            value={sm.deliverables}
                            onChange={(e) => handleScopeChange(idx, 'deliverables', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-700 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleRemoveScope(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Remove Module"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: COST BREAKDOWN */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Cost Breakdown & Negotiation Pricing</h4>
                  <p className="text-xs text-slate-500">Edit line items, rates, and one-time discount to reach client agreed price.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3 min-w-[240px]">Description *</th>
                      <th className="py-2.5 px-3 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Base Amount (₹) *</th>
                      <th className="py-2.5 px-3 w-28 text-right">Total (₹)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {items.map((item, index) => {
                      const qty = Number(item.quantity) || 1;
                      const rate = Number(item.rate) || 0;
                      const rowTotal = qty * rate;

                      return (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Flutter Application Development Hybrid"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white text-slate-900 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              required
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 text-xs text-center bg-white text-slate-900 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
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
                              className="w-full px-2 py-1.5 text-xs text-right bg-white text-slate-900 rounded border border-slate-300 focus:border-[#0077B6] outline-none font-mono font-semibold"
                            />
                          </td>
                          <td className="py-2 px-3 text-right font-bold font-mono text-slate-900">
                            {formatCurrency(rowTotal)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              disabled={items.length <= 1}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30 cursor-pointer"
                              title="Remove"
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

              {/* Discount Controls & Calculation Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Left: Discount Selection */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Negotiation / One-Time Discount
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="discountType"
                        checked={discountType === 'flat'}
                        onChange={() => setDiscountType('flat')}
                        className="text-[#0077B6] focus:ring-[#0077B6]"
                      />
                      <span className="font-semibold text-slate-800">Flat Amount (₹)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="discountType"
                        checked={discountType === 'percent'}
                        onChange={() => setDiscountType('percent')}
                        className="text-[#0077B6] focus:ring-[#0077B6]"
                      />
                      <span className="font-semibold text-slate-800">Percentage (%)</span>
                    </label>
                  </div>

                  {discountType === 'flat' ? (
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Enter Discount Amount in ₹ (e.g. 30000 or 20000)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={flatDiscount}
                        onChange={(e) => setFlatDiscount(e.target.value)}
                        placeholder="e.g. 30000"
                        className="w-full px-3 py-2 bg-white text-slate-900 text-sm rounded border border-slate-300 font-mono font-bold focus:border-[#0077B6] outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] text-slate-600 font-medium mb-1">
                        Enter Discount Percentage % (e.g. 10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="any"
                        value={discountRate}
                        onChange={(e) => setDiscountRate(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full px-3 py-2 bg-white text-slate-900 text-sm rounded border border-slate-300 font-mono font-bold focus:border-[#0077B6] outline-none"
                      />
                    </div>
                  )}

                  <div className="pt-1">
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">
                      GST / Tax Rate % (0% if exempt / not included in initial estimate)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={taxRate}
                      onChange={(e) => setTaxRate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 text-sm rounded border border-slate-300 font-mono focus:border-[#0077B6] outline-none"
                    />
                  </div>
                </div>

                {/* Right: Summary Card */}
                <div className="bg-[#F8FAFD] border border-slate-200 rounded-lg p-4 space-y-2.5 text-xs">
                  <div className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-200 pb-2">
                    Commercial Proposal Summary
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-900 font-mono text-sm">
                      {formatCurrency(calculations.subtotal)}
                    </span>
                  </div>

                  {calculations.discountAmount > 0 && (
                    <div className="flex items-center justify-between text-emerald-600 font-medium">
                      <span>One-Time Discount:</span>
                      <span className="font-mono font-bold">
                        - {formatCurrency(calculations.discountAmount)}
                      </span>
                    </div>
                  )}

                  {calculations.taxAmount > 0 && (
                    <div className="flex items-center justify-between text-slate-600">
                      <span>GST / Tax ({taxRate}%):</span>
                      <span className="font-mono font-semibold text-slate-900">
                        + {formatCurrency(calculations.taxAmount)}
                      </span>
                    </div>
                  )}

                  <div className="pt-3 border-t-2 border-[#0077B6] bg-[#E0F2FE] p-3 rounded flex items-center justify-between font-extrabold text-[#0077B6]">
                    <span className="text-xs uppercase tracking-wider">GRAND TOTAL:</span>
                    <span className="text-lg font-mono">{formatCurrency(calculations.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: THIRD PARTY COSTS */}
          {activeTab === 'thirdparty' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Third Party Services & Costs</h4>
                  <p className="text-xs text-slate-500">Domain, Hosting, SMS gateway, Google Maps, and maintenance subscriptions.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddThirdParty}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wide">
                    <tr>
                      <th className="py-2.5 px-3">Service</th>
                      <th className="py-2.5 px-3 w-40">Billing Basis</th>
                      <th className="py-2.5 px-3 w-40 text-right">Amount (₹ or Basis)</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {thirdPartyCosts.map((tp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Domain Registration"
                            value={tp.service}
                            onChange={(e) => handleThirdPartyChange(idx, 'service', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-900 font-semibold rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            placeholder="e.g. Yearly / Monthly / Usage based"
                            value={tp.billing_basis}
                            onChange={(e) => handleThirdPartyChange(idx, 'billing_basis', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-slate-700 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="text"
                            required
                            placeholder="e.g. 2000 or As per hit"
                            value={tp.amount}
                            onChange={(e) => handleThirdPartyChange(idx, 'amount', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-xs text-right font-mono text-slate-900 font-semibold rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveThirdParty(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: MILESTONES & TERMS */}
          {activeTab === 'terms' && (
            <div className="space-y-4">
              {/* Payment Milestones */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Payment Milestones Schedule</h4>
                    <p className="text-xs text-slate-500">e.g. 40% Kick-off, 40% UAT Build, 20% Handover.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddMilestone}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Milestone</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#0077B6] text-white text-[11px] font-bold uppercase tracking-wide">
                      <tr>
                        <th className="py-2.5 px-3 w-28 text-center">Percent (%)</th>
                        <th className="py-2.5 px-3">Condition / Milestone Stage</th>
                        <th className="py-2.5 px-2 w-10 text-center"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {paymentMilestones.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5">
                            <input
                              type="number"
                              min="1"
                              max="100"
                              required
                              placeholder="40"
                              value={m.percent}
                              onChange={(e) => handleMilestoneChange(idx, 'percent', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs text-center font-bold text-slate-900 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                            />
                          </td>
                          <td className="p-2.5">
                            <input
                              type="text"
                              required
                              placeholder="e.g. on confirmation & kick off"
                              value={m.condition}
                              onChange={(e) => handleMilestoneChange(idx, 'condition', e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs text-slate-800 rounded border border-slate-300 focus:border-[#0077B6] outline-none"
                            />
                          </td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Terms Textarea */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Official Terms & Warranty Conditions
                </label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-slate-800 text-xs rounded-lg border border-slate-300 focus:border-[#0077B6] outline-none leading-relaxed"
                />
              </div>

              {/* Internal Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Internal Negotiation Remarks / History Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Client requested ₹20k discount on final handover milestone."
                  className="w-full px-3.5 py-2 bg-white text-slate-800 text-xs rounded-lg border border-slate-300 focus:border-[#0077B6] outline-none"
                />
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 mt-4 shrink-0">
            <div className="text-xs text-slate-500 font-medium">
              Grand Total: <strong className="text-[#0077B6] font-mono text-sm">{formatCurrency(calculations.grandTotal)}</strong>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded-md transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#0077B6] hover:bg-[#005f92] text-white font-bold text-xs sm:text-sm rounded-md shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Estimate...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {mode === 'revise'
                        ? `Save Revised Estimate (v${Number(quotation?.version || 1) + 1})`
                        : mode === 'edit'
                        ? 'Update Estimate'
                        : 'Save & Issue Estimate'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
