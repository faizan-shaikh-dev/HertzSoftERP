'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  UserCheck, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  MapPin, 
  Loader2, 
  AlertCircle,
  FileText,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import leadService from '@/services/leadService';

export default function ConvertToClientModal({
  isOpen,
  onClose,
  lead,
  onSuccess
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Editable Form Fields for Client Profile
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [onboardingStatus, setOnboardingStatus] = useState('Pending');
  const [internalNotes, setInternalNotes] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pre-fill fields whenever modal opens with a lead
  useEffect(() => {
    if (isOpen && lead) {
      setName(lead.name || '');
      setCompanyName(lead.company_name || '');
      setPhone(lead.phone || '');
      setEmail(lead.email || '');
      setWebsite(lead.website || '');
      setBillingAddress(lead.city || '');
      setOnboardingStatus('Pending');
      
      const notesArr = [];
      if (lead.requirement) notesArr.push(`Project Requirement: ${lead.requirement}`);
      if (lead.service_interest) notesArr.push(`Service Interest: ${lead.service_interest}`);
      if (lead.internal_notes) notesArr.push(`Inquiry Notes: ${lead.internal_notes}`);
      setInternalNotes(notesArr.join('\n\n'));
      setError('');
    }
  }, [isOpen, lead]);

  if (!isOpen || !mounted || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Client Contact Name is required.');
      return;
    }

    if (!phone.trim()) {
      setError('Contact Phone Number is required.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const payload = {
        name: name.trim(),
        company_name: companyName.trim() || null,
        phone: phone.trim(),
        email: email.trim() || null,
        billing_email: email.trim() || null,
        website: website.trim() || null,
        billing_address: billingAddress.trim() || null,
        onboarding_status: onboardingStatus,
        internal_notes: internalNotes.trim() || null
      };

      const res = await leadService.convertToClient(lead.id, payload);
      const clientNumber = res.data?.client?.client_number || '';
      
      toast.success(`Deal Won! Lead converted to Client #${clientNumber} successfully!`);
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to convert lead to client:', err);
      setError(err.message || 'Failed to convert lead to client. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-emerald-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shadow-2xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Convert Won Lead to Client
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Won Deal
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Create an active Client account while preserving this lead record in your historical pipeline.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Summary Snapshot Card */}
        <div className="px-4 sm:px-5 pt-3 pb-0">
          <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-[10px]">
                Lead #{lead.lead_number}
              </span>
              <span className="font-bold text-slate-900">{lead.name}</span>
              {lead.company_name && (
                <span className="text-slate-500 font-medium">({lead.company_name})</span>
              )}
            </div>

            {lead.estimated_budget && (
              <span className="font-bold text-emerald-800">
                Deal Value: INR {Number(lead.estimated_budget).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Contact Person <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enterprise or Business Name"
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 2. Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Primary Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billing / Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 3. Website & City/Billing Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Website URL
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Billing / Office Address
              </label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="City, State, Country"
                className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* 4. Onboarding Status */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client Onboarding Status
            </label>
            <select
              value={onboardingStatus}
              onChange={(e) => setOnboardingStatus(e.target.value)}
              className="w-full px-3 py-1.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none font-medium cursor-pointer"
            >
              <option value="Pending">Pending (Awaiting Kickoff / Paperwork)</option>
              <option value="In Progress">In Progress (Active Project Setup)</option>
              <option value="Completed">Completed (Fully Onboarded)</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* 5. Combined Notes */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Client Account Notes & Requirements
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Internal scope notes, agreement terms, billing details..."
              className="w-full p-2.5 bg-white text-slate-900 border border-slate-300 rounded-md focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Preserved Record Guarantee Alert */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Preserves Lead Record & Link</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Converting will NOT delete this lead. It will mark the lead as officially Won and permanently link it with the resulting Client profile for audit and project invoicing.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting to Client...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Confirm & Convert to Client</span>
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

