'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import leadService from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  Briefcase, 
  FileText, 
  IndianRupee, 
  Loader2, 
  Sparkles,
  Layers,
  Globe,
  MapPin,
  Calendar,
  Server,
  HardDrive,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  UserCheck,
  Compass
} from 'lucide-react';

const SERVICE_OPTIONS = [
  'Custom Web Application (React / Next.js / Node.js)',
  'Mobile App Development (Android / iOS / Flutter)',
  'Enterprise ERP & Operations Portal',
  'Cloud Architecture & DevOps Infrastructure',
  'UI/UX Design & Digital Product Prototyping',
  'API Integration & Microservices Backend',
  'E-Commerce & Payment Solutions',
  'Custom Enterprise Software'
];

const SOURCE_OPTIONS = [
  'Official Website Inquiry',
  'LinkedIn',
  'Direct Walk-in / In-Person',
  'Referral / Partner',
  'Cold Outreach / Email / Call',
  'Social Media (Instagram / Facebook)',
  'Tech Expo / Conference',
  'Other'
];

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'Qualified',
  'Quotation Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold'
];

const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];
const AVAILABILITY_OPTIONS = ['Unknown', 'Yes', 'No'];

export default function LeadModal({ isOpen, onClose, lead = null, onSuccess }) {
  const { user: currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isEdit = !!lead;

  // 1. Contact Info
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [alternatePhone, setAlternatePhone] = useState('');
  const [email, setEmail] = useState('');

  // 2. Organization Info
  const [companyName, setCompanyName] = useState('');
  const [designation, setDesignation] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');

  // 3. Requirement & Technical
  const [requirement, setRequirement] = useState('');
  const [serviceInterest, setServiceInterest] = useState(SERVICE_OPTIONS[0]);
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [expectedDecisionDate, setExpectedDecisionDate] = useState('');
  const [domainAvailable, setDomainAvailable] = useState('Unknown');
  const [hostingAvailable, setHostingAvailable] = useState('Unknown');

  // 4. Pipeline & Assignment
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState('New');
  const [priority, setPriority] = useState('Normal');
  const [source, setSource] = useState(SOURCE_OPTIONS[0]);
  const [sourceDetails, setSourceDetails] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [onHoldReason, setOnHoldReason] = useState('');
  const [revisitDate, setRevisitDate] = useState('');

  // 5. Notes & Duplicate
  const [internalNotes, setInternalNotes] = useState('');
  const [duplicateOverride, setDuplicateOverride] = useState(false);

  // Assignees list from backend
  const [assignees, setAssignees] = useState([]);
  const [loadingAssignees, setLoadingAssignees] = useState(false);

  // Duplicate phone warning
  const [duplicateMatches, setDuplicateMatches] = useState([]);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const phoneCheckTimer = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch Team Assignees on mount
  useEffect(() => {
    if (isOpen) {
      const fetchAssignees = async () => {
        try {
          setLoadingAssignees(true);
          const res = await leadService.getAssignees();
          const list = res.data || [];
          setAssignees(list);
          // Default to current user or first assignee if creating new
          if (!lead && !assignedTo) {
            const currentMatch = list.find((a) => a.id === currentUser?.id);
            setAssignedTo(currentMatch ? currentMatch.id : (list[0]?.id || ''));
          }
        } catch (err) {
          console.error('Failed to load assignees:', err);
        } finally {
          setLoadingAssignees(false);
        }
      };
      fetchAssignees();
    }
  }, [isOpen]);

  // Populate or reset form fields
  useEffect(() => {
    if (lead && isOpen) {
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setAlternatePhone(lead.alternate_phone || '');
      setEmail(lead.email || '');
      setCompanyName(lead.company_name || '');
      setDesignation(lead.designation || '');
      setCity(lead.city || '');
      setWebsite(lead.website || '');
      setRequirement(lead.requirement || '');
      setServiceInterest(lead.service_interest || SERVICE_OPTIONS[0]);
      setEstimatedBudget(lead.estimated_budget ? String(lead.estimated_budget) : '');
      setExpectedDecisionDate(lead.expected_decision_date ? lead.expected_decision_date.slice(0, 10) : '');
      setDomainAvailable(lead.domain_available || 'Unknown');
      setHostingAvailable(lead.hosting_available || 'Unknown');
      setAssignedTo(lead.assigned_to || currentUser?.id || '');
      setStatus(lead.status || 'New');
      setPriority(lead.priority || 'Normal');
      setSource(lead.source || SOURCE_OPTIONS[0]);
      setSourceDetails(lead.source_details || '');
      setLostReason(lead.lost_reason || '');
      setOnHoldReason(lead.on_hold_reason || '');
      setRevisitDate(lead.revisit_date ? lead.revisit_date.slice(0, 10) : '');
      setInternalNotes(lead.internal_notes || '');
      setDuplicateOverride(Boolean(lead.duplicate_override));
      setDuplicateMatches([]);
      setError('');
    } else if (isOpen) {
      setName('');
      setPhone('');
      setAlternatePhone('');
      setEmail('');
      setCompanyName('');
      setDesignation('');
      setCity('');
      setWebsite('');
      setRequirement('');
      setServiceInterest(SERVICE_OPTIONS[0]);
      setEstimatedBudget('');
      setExpectedDecisionDate('');
      setDomainAvailable('Unknown');
      setHostingAvailable('Unknown');
      setAssignedTo(currentUser?.id || '');
      setStatus('New');
      setPriority('Normal');
      setSource(SOURCE_OPTIONS[0]);
      setSourceDetails('');
      setLostReason('');
      setOnHoldReason('');
      setRevisitDate('');
      setInternalNotes('');
      setDuplicateOverride(false);
      setDuplicateMatches([]);
      setError('');
    }
  }, [lead, isOpen, currentUser]);

  // Real-time Phone Duplicate Checking (Debounced)
  const handlePhoneChange = (val) => {
    setPhone(val);
    const cleanDigits = val.replace(/\D/g, '');

    if (phoneCheckTimer.current) {
      clearTimeout(phoneCheckTimer.current);
    }

    if (cleanDigits.length >= 10) {
      phoneCheckTimer.current = setTimeout(async () => {
        try {
          setCheckingDuplicate(true);
          const res = await leadService.checkDuplicatePhone(val, isEdit ? lead?.id : null);
          if (res.data?.isDuplicate && res.data.matches?.length > 0) {
            setDuplicateMatches(res.data.matches);
          } else {
            setDuplicateMatches([]);
          }
        } catch (err) {
          console.error('Duplicate check error:', err);
        } finally {
          setCheckingDuplicate(false);
        }
      }, 350);
    } else {
      setDuplicateMatches([]);
    }
  };

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations (Required fields: name, phone, requirement, status, assigned_to)
    if (!name.trim()) {
      setError('Client / POC name is required.');
      return;
    }

    if (!phone.trim()) {
      setError('Primary phone number is required.');
      return;
    }

    if (!requirement.trim()) {
      setError('Project requirement and scope is required.');
      return;
    }

    if (!status) {
      setError('Pipeline status is required.');
      return;
    }

    if (!assignedTo) {
      setError('Please select an Assigned Employee for this lead.');
      return;
    }

    if (status === 'Lost' && !lostReason.trim()) {
      setError('Lost reason is required when marking a lead as Lost.');
      return;
    }

    if (status === 'On Hold' && !onHoldReason.trim()) {
      setError('On Hold reason is required when marking a lead On Hold.');
      return;
    }

    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      alternate_phone: alternatePhone.trim() || null,
      email: email.trim() || null,
      company_name: companyName.trim() || null,
      designation: designation.trim() || null,
      city: city.trim() || null,
      website: website.trim() || null,
      requirement: requirement.trim(),
      service_interest: serviceInterest,
      source,
      source_details: sourceDetails.trim() || null,
      estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
      expected_decision_date: expectedDecisionDate || null,
      domain_available: domainAvailable,
      hosting_available: hostingAvailable,
      status,
      priority,
      assigned_to: assignedTo,
      lost_reason: status === 'Lost' ? (lostReason.trim() || 'Not specified') : null,
      on_hold_reason: status === 'On Hold' ? (onHoldReason.trim() || 'Not specified') : null,
      revisit_date: status === 'On Hold' ? (revisitDate || null) : null,
      internal_notes: internalNotes.trim() || null,
      duplicate_override: duplicateOverride || (duplicateMatches.length > 0 ? 1 : 0)
    };

    setLoading(true);

    try {
      if (isEdit) {
        await leadService.updateLead(lead.id, payload);
        toast.success(`Lead "${name}" updated successfully!`);
      } else {
        await leadService.createLead(payload);
        toast.success(`New lead "${name}" registered successfully!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving lead:', err);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to save lead. Please check inputs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div 
        className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden my-4 sm:my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-slate-200/80 flex items-center justify-between bg-gradient-to-r from-blue-50/70 via-slate-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center border border-blue-200 shadow-2xs">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="lead-modal-title" className="text-base font-bold text-slate-900 tracking-tight">
                  {isEdit ? 'Edit Lead Details' : 'Register New Lead'}
                </h3>
                {isEdit && lead?.lead_number && (
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-mono text-[11px] font-bold border border-blue-200">
                    Lead #{lead.lead_number}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Required fields are marked with an asterisk (*). Lead ID and creator timestamps are automated.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* SECTION 1: Contact Details */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                1. Contact Information
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Name * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Client / POC Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rajesh Singhania"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition font-medium"
                  />
                </div>
              </div>

              {/* Primary Phone * */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Primary Phone Number *
                  </label>
                  {checkingDuplicate && (
                    <span className="text-[10px] text-blue-600 flex items-center gap-1">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Checking duplicate...
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={`w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border outline-none transition font-mono ${
                      duplicateMatches.length > 0 
                        ? 'border-amber-400 bg-amber-50/30 focus:border-amber-500' 
                        : 'border-slate-200 focus:border-blue-600'
                    }`}
                  />
                </div>
              </div>

              {/* Alternate Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alternate Phone (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    value={alternatePhone}
                    onChange={(e) => setAlternatePhone(e.target.value)}
                    placeholder="e.g. Landline or Secondary mobile"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="rajesh@apexlogistics.in"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Duplicate Phone Warning Box (Non-blocking with Override per spec) */}
            {duplicateMatches.length > 0 && (
              <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-amber-800">
                      Duplicate Phone Detected ({duplicateMatches.length} matching record found)
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {duplicateMatches.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/80 p-2 rounded border border-amber-200/60">
                          <div>
                            <span className="font-semibold text-slate-800">
                              {m.name || 'Unnamed'}
                            </span>
                            {m.company_name && (
                              <span className="text-slate-500 ml-1.5">
                                • {m.company_name}
                              </span>
                            )}
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                              {m.type === 'lead' ? `Lead #${m.lead_number || ''}` : `Client #${m.client_number || ''}`}
                            </span>
                          </div>
                          {m.status && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {m.status}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 mt-2.5 cursor-pointer text-[11px] font-semibold text-amber-900">
                      <input
                        type="checkbox"
                        checked={duplicateOverride}
                        onChange={(e) => setDuplicateOverride(e.target.checked)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span>Record duplicate override (System will allow saving without merging or blocking)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Organization & Designation */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                2. Business & Organization Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Company Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Apex Global Logistics"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition font-medium"
                  />
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  placeholder="e.g. Managing Director, Founder, CTO"
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  City / Location
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai, Bengaluru, Delhi"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Website URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://apexlogistics.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: Requirement & Technical Scope */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                3. Project Scope & Technical Requirements
              </h4>
            </div>

            <div className="space-y-4">
              {/* Requirement & Scope * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Requirement & Scope *
                </label>
                <textarea
                  required
                  rows={3}
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  placeholder="Describe client's operational software requirements, desired workflows, and key features..."
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Service Interest */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Primary Service Interest
                  </label>
                  <select
                    value={serviceInterest}
                    onChange={(e) => setServiceInterest(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer"
                  >
                    {SERVICE_OPTIONS.map((srv) => (
                      <option key={srv} value={srv}>{srv}</option>
                    ))}
                  </select>
                </div>

                {/* Estimated Budget */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Estimated Budget (INR)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      value={estimatedBudget}
                      onChange={(e) => setEstimatedBudget(e.target.value)}
                      placeholder="e.g. 350000"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition font-semibold"
                    />
                  </div>
                </div>

                {/* Expected Decision Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Decision Date (Target Close)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <input
                      type="date"
                      value={expectedDecisionDate}
                      onChange={(e) => setExpectedDecisionDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                    />
                  </div>
                </div>

                {/* Domain & Hosting Availability (Yes / No / Unknown) */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Domain Available?
                    </label>
                    <select
                      value={domainAvailable}
                      onChange={(e) => setDomainAvailable(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer font-medium"
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Hosting Available?
                    </label>
                    <select
                      value={hostingAvailable}
                      onChange={(e) => setHostingAvailable(e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer font-medium"
                    >
                      {AVAILABILITY_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Pipeline, Assignment & Status */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
              <Compass className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                4. Pipeline Stage & Team Assignment
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Assigned Employee * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Employee / Owner *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <select
                    required
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer font-semibold"
                  >
                    {assignees.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pipeline Status * */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pipeline Status *
                </label>
                <select
                  required
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer font-bold text-blue-700"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer font-semibold"
                >
                  {PRIORITY_OPTIONS.map((pr) => (
                    <option key={pr} value={pr}>{pr}</option>
                  ))}
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Generation Source
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition cursor-pointer"
                >
                  {SOURCE_OPTIONS.map((src) => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              {/* Source / Reference Details */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reference / Source Details
                </label>
                <input
                  type="text"
                  value={sourceDetails}
                  onChange={(e) => setSourceDetails(e.target.value)}
                  placeholder="e.g. Referred by Manish Gupta from Tech India Summit, or Campaign ID #204"
                  className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition"
                />
              </div>

              {/* Conditional: Lost Reason (Required when Lost) */}
              {status === 'Lost' && (
                <div className="sm:col-span-2 p-3.5 rounded-lg bg-red-50 border border-red-200">
                  <label className="block text-xs font-bold text-red-800 mb-1">
                    Reason for Loss * (Required)
                  </label>
                  <input
                    type="text"
                    required
                    value={lostReason}
                    onChange={(e) => setLostReason(e.target.value)}
                    placeholder="e.g. Budget constraint, client selected competitor, project postponed..."
                    className="w-full px-3 py-2 bg-white text-red-900 text-xs rounded-md border border-red-300 focus:border-red-600 outline-none"
                  />
                </div>
              )}

              {/* Conditional: On Hold Reason & Revisit Date (Required when On Hold) */}
              {status === 'On Hold' && (
                <div className="sm:col-span-2 p-3.5 rounded-lg bg-amber-50 border border-amber-200 space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">
                      Reason for On-Hold * (Required)
                    </label>
                    <input
                      type="text"
                      required
                      value={onHoldReason}
                      onChange={(e) => setOnHoldReason(e.target.value)}
                      placeholder="e.g. Awaiting Q4 budget approval, client traveling till next month..."
                      className="w-full px-3 py-2 bg-white text-amber-950 text-xs rounded-md border border-amber-300 focus:border-amber-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 mb-1">
                      Optional Revisit Date
                    </label>
                    <input
                      type="date"
                      value={revisitDate}
                      onChange={(e) => setRevisitDate(e.target.value)}
                      className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-amber-300 focus:border-amber-600 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: Internal Notes */}
          <div>
            <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-100">
              <FileText className="w-4 h-4 text-blue-600" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                5. Internal Strategy & Notes
              </h4>
            </div>

            <textarea
              rows={2}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Private team observations, client temperament, technical bottlenecks, or discussion agenda..."
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 outline-none transition leading-relaxed"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Update Lead' : 'Save Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
