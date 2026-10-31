'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import leadService from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import { 
  X, 
  XCircle,
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
  const [serviceInterest, setServiceInterest] = useState('');
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
      setServiceInterest(lead.service_interest || lead.requirement || '');
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
      setServiceInterest('');
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

    if (!serviceInterest.trim()) {
      setError('Service & Scope is required.');
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
      alternate_phone: null,
      email: email.trim() || null,
      company_name: companyName.trim() || null,
      designation: designation.trim() || null,
      city: city.trim() || null,
      website: website.trim() || null,
      requirement: serviceInterest.trim() || 'General Inquiry',
      service_interest: serviceInterest.trim() || requirement.trim() || null,
      source,
      source_details: sourceDetails.trim() || null,
      estimated_budget: null,
      expected_decision_date: null,
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
        {/* Modal Header (Hertzsoft Branded) */}
        <div className="px-6 pt-5 pb-4 flex items-center justify-between bg-white flex-shrink-0 border-b border-[#e9ecef]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#326fa8] to-[#4689C8] text-white flex items-center justify-center shadow-sm shadow-[#4689C8]/25 flex-shrink-0">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="lead-modal-title" className="text-lg sm:text-xl font-bold text-[#172b4d] tracking-tight m-0">
                {isEdit ? 'Edit Lead Record' : 'Register New Lead'}
              </h2>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Client inquiry, service & scope, and team assignment.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#8898aa] hover:text-[#172b4d] transition cursor-pointer p-1 rounded-full hover:bg-[#f6f9fc]"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-md font-medium flex items-center gap-2 flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body (Exact OJT clean input fields with red asterisk) */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name* (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Name<span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter client / POC full name"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            {/* Company Name (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Business / Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Acme Technologies Pvt Ltd"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            {/* Service & Scope* (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Service &amp; Scope<span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={serviceInterest}
                onChange={(e) => setServiceInterest(e.target.value)}
                placeholder="e.g. Website Development, Mobile App, E-Commerce, ERP Portal, SEO..."
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            {/* Contact No* */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#525f7f]">
                  Contact No<span className="text-[#f5365c] font-bold ml-0.5">*</span>
                </label>
                {checkingDuplicate && (
                  <span className="text-[10px] text-[#4689C8] flex items-center gap-1 font-medium">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    Checking...
                  </span>
                )}
              </div>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+91 98765 43210"
                className={`w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border outline-none transition font-mono ${
                  duplicateMatches.length > 0 
                    ? 'border-amber-400 bg-amber-50/20 focus:border-amber-500' 
                    : 'border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8]'
                }`}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>


            {/* City / Location */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                City / Location
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Mumbai, Maharashtra"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>


            {/* Lead Source */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>

            {/* Assigned Employee / Owner* */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Assigned Employee / Owner<span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <select
                required
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer font-semibold"
              >
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.full_name} ({a.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Pipeline Status* */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Pipeline Status<span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <select
                required
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#4689C8] font-bold text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {PRIORITY_OPTIONS.map((pr) => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </div>


            {/* Domain Available */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Domain Available?
              </label>
              <select
                value={domainAvailable}
                onChange={(e) => setDomainAvailable(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            {/* Hosting Available */}
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Hosting Available?
              </label>
              <select
                value={hostingAvailable}
                onChange={(e) => setHostingAvailable(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {AVAILABILITY_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>


            {/* Conditional: Lost Reason (Required when Lost) */}
            {status === 'Lost' && (
              <div className="md:col-span-2 p-3.5 rounded-md bg-red-50 border border-red-200">
                <label className="block text-xs font-bold text-[#f5365c] mb-1.5">
                  Reason for Loss<span className="text-[#f5365c] font-bold ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={lostReason}
                  onChange={(e) => setLostReason(e.target.value)}
                  placeholder="e.g. Budget constraint, client selected competitor, project postponed..."
                  className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-red-300 focus:border-[#f5365c] outline-none"
                />
              </div>
            )}

            {/* Conditional: On Hold Reason & Revisit Date (Required when On Hold) */}
            {status === 'On Hold' && (
              <div className="md:col-span-2 p-3.5 rounded-md bg-amber-50 border border-amber-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-[#fb6340] mb-1.5">
                    Reason for On-Hold<span className="text-[#f5365c] font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={onHoldReason}
                    onChange={(e) => setOnHoldReason(e.target.value)}
                    placeholder="e.g. Awaiting Q4 budget approval, client traveling till next month..."
                    className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-amber-300 focus:border-[#fb6340] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                    Revisit Date
                  </label>
                  <input
                    type="date"
                    value={revisitDate}
                    onChange={(e) => setRevisitDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-amber-300 focus:border-[#fb6340] outline-none"
                  />
                </div>
              </div>
            )}

            {/* Duplicate Phone Warning Box */}
            {duplicateMatches.length > 0 && (
              <div className="md:col-span-2 p-3.5 rounded-md bg-amber-50 border border-amber-200 text-xs">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#fb6340] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold text-[#172b4d]">
                      Duplicate Phone Detected ({duplicateMatches.length} matching record found)
                    </p>
                    <div className="mt-1.5 space-y-1">
                      {duplicateMatches.map((m, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-amber-200">
                          <div>
                            <span className="font-semibold text-[#172b4d]">{m.name || 'Unnamed'}</span>
                            <span className="text-[#8898aa] text-[11px] ml-2">({m.company_name || 'Individual'})</span>
                          </div>
                          <span className="text-[10px] font-bold text-[#fb6340] bg-amber-100 px-2 py-0.5 rounded">
                            {m.status || 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                    <label className="mt-2.5 flex items-center gap-2 cursor-pointer font-semibold text-[#172b4d]">
                      <input
                        type="checkbox"
                        checked={duplicateOverride}
                        onChange={(e) => setDuplicateOverride(e.target.checked)}
                        className="rounded border-slate-300 text-[#4689C8] focus:ring-[#4689C8]"
                      />
                      <span>Allow duplicate phone number registration</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Remark (Full width) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Remark
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Enter remarks or notes about this lead..."
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition leading-relaxed"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#e9ecef] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white hover:bg-[#f6f9fc] border border-[#dee2e6] text-[#525f7f] font-semibold text-xs sm:text-sm rounded shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] text-white font-bold text-xs sm:text-sm rounded shadow-sm shadow-[#4689C8]/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
              <span>{isEdit ? 'Update Lead' : 'Save Lead'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
