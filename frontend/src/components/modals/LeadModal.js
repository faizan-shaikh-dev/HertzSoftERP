'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import leadService from '@/services/leadService';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Building2, 
  GraduationCap, 
  Briefcase, 
  FileText, 
  IndianRupee, 
  Loader2, 
  Sparkles,
  Layers
} from 'lucide-react';

const COURSE_OPTIONS = [
  'FullStack Development (MERN)',
  'Data Science & AI',
  'Python Development',
  'Cloud & DevOps Engineering',
  'Digital Marketing & SEO',
  'UI/UX Design',
  'Other Professional Training'
];

const SOURCE_OPTIONS = [
  'Direct Walk-in',
  'Official Website',
  'LinkedIn',
  'Referral / Alumni',
  'Social Media (Instagram/FB)',
  'Partner / Corporate'
];

const STATUS_OPTIONS = [
  'New',
  'Contacted',
  'In Discussion',
  'Won',
  'Lost'
];

export default function LeadModal({ isOpen, onClose, lead = null, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const isEdit = !!lead;

  const [leadType, setLeadType] = useState('Student');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [serviceInterest, setServiceInterest] = useState(COURSE_OPTIONS[0]);
  const [requirement, setRequirement] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [source, setSource] = useState('Direct Walk-in');
  const [priority, setPriority] = useState('Normal');
  const [status, setStatus] = useState('New');
  const [internalNotes, setInternalNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (lead && isOpen) {
      setLeadType(lead.lead_type || 'Student');
      setName(lead.name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setCompanyName(lead.company_name || '');
      setServiceInterest(lead.service_interest || COURSE_OPTIONS[0]);
      setRequirement(lead.requirement || '');
      setEstimatedBudget(lead.estimated_budget ? String(lead.estimated_budget) : '');
      setSource(lead.source || 'Direct Walk-in');
      setPriority(lead.priority || 'Normal');
      setStatus(lead.status || 'New');
      setInternalNotes(lead.internal_notes || '');
      setError('');
    } else if (isOpen) {
      setLeadType('Student');
      setName('');
      setPhone('');
      setEmail('');
      setCompanyName('');
      setServiceInterest(COURSE_OPTIONS[0]);
      setRequirement('');
      setEstimatedBudget('');
      setSource('Direct Walk-in');
      setPriority('Normal');
      setStatus('New');
      setInternalNotes('');
      setError('');
    }
  }, [lead, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide the lead full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Contact phone number is required.');
      return;
    }

    const finalRequirement = requirement.trim() || (leadType === 'Student' ? serviceInterest : 'Custom Enterprise Software');

    const payload = {
      lead_type: leadType,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || null,
      company_name: leadType === 'Client' ? companyName.trim() || null : null,
      service_interest: leadType === 'Student' ? serviceInterest : (companyName.trim() || 'Software Service'),
      requirement: finalRequirement,
      estimated_budget: estimatedBudget ? Number(estimatedBudget) : null,
      source,
      priority,
      status,
      internal_notes: internalNotes.trim() || null
    };

    setLoading(true);

    try {
      if (isEdit) {
        await leadService.updateLead(lead.id, payload);
        toast.success(`Inquiry "${name}" updated successfully!`);
      } else {
        await leadService.createLead(payload);
        toast.success(`New ${leadType} inquiry added to pipeline!`);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving lead:', err);
      const msg = err.message || 'Failed to save lead record. Please check inputs.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50/90 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              leadType === 'Student' 
                ? 'bg-sky-100 text-sky-700 border border-sky-200' 
                : 'bg-indigo-100 text-indigo-700 border border-indigo-200'
            }`}>
              {leadType === 'Student' ? <GraduationCap className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Inquiry / Lead' : 'Register New Inquiry'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? `Updating record #${lead.id} (${lead.name})` : 'Capture dual stream student registration or client project request'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Stream Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Inquiry Stream Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLeadType('Student')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  leadType === 'Student'
                    ? 'bg-sky-50 text-sky-800 border-sky-300 ring-2 ring-sky-500/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-sky-600" />
                <span>Student / Course Lead</span>
              </button>

              <button
                type="button"
                onClick={() => setLeadType('Client')}
                className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  leadType === 'Client'
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-300 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Client / Enterprise Project</span>
              </button>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Section 1: Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
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
                  placeholder={leadType === 'Student' ? 'e.g. Faizan Khan' : 'e.g. Rajesh Singhania'}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
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
                  placeholder="contact@domain.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Lead Source
              </label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer"
              >
                {SOURCE_OPTIONS.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Stream-Specific Details */}
          {leadType === 'Student' ? (
            <div className="p-4 rounded-lg bg-sky-50/60 border border-sky-100 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-900 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-sky-600" />
                <span>Student Academic & Course Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Course / Interest Program
                  </label>
                  <select
                    value={serviceInterest}
                    onChange={(e) => setServiceInterest(e.target.value)}
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    {COURSE_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Education / College / City
                  </label>
                  <input
                    type="text"
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="e.g. B.Tech Computer Science, 3rd Year"
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-indigo-50/60 border border-indigo-100 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                <span>Client Business & Requirement Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                      placeholder="e.g. Alpha Solutions Pvt Ltd"
                      className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

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
                      placeholder="e.g. 150000"
                      className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Project Requirement & Scope
                  </label>
                  <textarea
                    rows={2}
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="e.g. Need Custom Operations ERP with Multi-role authorization and real-time reporting."
                    className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Status & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Pipeline Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer"
              >
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Internal Remarks / Staff Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal details, next follow-up dates or notes..."
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Save Changes' : 'Register Inquiry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

