'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  XCircle, 
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              Convert Won Lead to Client
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              Create an active Client account while preserving this lead record in your historical pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Lead Summary Snapshot Card */}
        <div className="px-6 pt-4 pb-0 bg-white">
          <div className="p-3.5 bg-[#f8f9fe] rounded-md border border-[#dee2e6] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#2dce89] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                Lead #{lead.lead_number}
              </span>
              <span className="font-bold text-[#172b4d]">{lead.name}</span>
              {lead.company_name && (
                <span className="text-[#525f7f] font-medium">({lead.company_name})</span>
              )}
            </div>

            {lead.estimated_budget && (
              <span className="font-bold text-[#2dce89]">
                Deal Value: ₹{Number(lead.estimated_budget).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Name & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Client Contact Person <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enterprise or Business Name"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* 2. Phone & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Primary Phone Number <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Billing / Corporate Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="billing@company.com"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* 3. Website & City/Billing Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Website URL
              </label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Billing / Office Address
              </label>
              <input
                type="text"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                placeholder="City, State, Country"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* 4. Onboarding Status */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Client Onboarding Status
            </label>
            <select
              value={onboardingStatus}
              onChange={(e) => setOnboardingStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer font-medium"
            >
              <option value="Pending">Pending (Awaiting Kickoff / Paperwork)</option>
              <option value="In Progress">In Progress (Active Project Setup)</option>
              <option value="Completed">Completed (Fully Onboarded)</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* 5. Combined Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Client Account Notes & Requirements
            </label>
            <textarea
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              rows={3}
              placeholder="Internal scope notes, agreement terms, billing details..."
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition resize-y"
            />
          </div>

          {/* Preserved Record Guarantee Alert */}
          <div className="p-3.5 bg-[#f8f9fe] rounded-md border border-[#dee2e6] text-[#525f7f] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#172b4d]">
              <CheckCircle2 className="w-4 h-4 text-[#2dce89]" />
              <span>Preserves Lead Record & Link</span>
            </div>
            <p className="text-[11px] text-[#8898aa] leading-relaxed">
              Converting will NOT delete this lead. It will mark the lead as officially Won and permanently link it with the resulting Client profile for audit and project invoicing.
            </p>
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
                  <span>Converting to Client...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
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
