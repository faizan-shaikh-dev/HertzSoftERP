'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  User, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  MessageSquare, 
  Sparkles, 
  UserCheck, 
  ChevronRight, 
  FileText, 
  Check,
  TrendingUp,
  Tag,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import leadService from '@/services/leadService';
import { 
  LeadModal, 
  ConvertToClientModal, 
  ConfirmDeleteModal 
} from '@/components/modals';
import { useAuth } from '@/context/AuthContext';

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// Sales Pipeline Stages in chronological order
const PIPELINE_STAGES = [
  'New',
  'Contacted',
  'Qualified',
  'Quotation Sent',
  'Negotiation',
  'Won'
];

function LeadViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const leadId = searchParams.get('id') || searchParams.get('lead_id');

  const [lead, setLead] = useState(null);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch Lead details and Follow-up activities
  const fetchLeadDetails = useCallback(async () => {
    if (!leadId) {
      setError('No lead ID specified.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [leadRes, followUpsRes] = await Promise.all([
        leadService.getLeadById(leadId),
        leadService.getFollowUps(leadId).catch(() => ({ data: [] }))
      ]);

      if (leadRes?.data) {
        setLead(leadRes.data);
      } else {
        setError('Lead record not found.');
      }

      setFollowUps(followUpsRes?.data || []);
    } catch (err) {
      console.error('Failed to load lead view:', err);
      setError(err.message || 'Could not load lead information.');
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    fetchLeadDetails();
  }, [fetchLeadDetails]);

  // Status Change Handler
  const handleStatusChange = async (newStatus) => {
    if (!lead || lead.status === newStatus) return;
    try {
      setUpdatingStatus(true);
      await leadService.updateLeadStatus(lead.id, { status: newStatus });
      try {
        await leadService.createFollowUp(lead.id, {
          follow_up_type: 'Other',
          notes: `Pipeline stage transitioned from "${lead.status}" to "${newStatus}"`,
          outcome: newStatus,
          status: 'Completed',
          scheduled_at: new Date().toISOString()
        });
      } catch (logErr) {
        console.warn('Could not auto-log status transition:', logErr);
      }
      toast.success(`Pipeline stage updated to: ${newStatus}`);
      await fetchLeadDetails();
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error(err.message || 'Failed to update pipeline stage.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Delete Follow-up Item
  const handleDeleteFollowUp = async (followUpId) => {
    if (!confirm('Are you sure you want to delete this activity record?')) return;
    try {
      await leadService.deleteFollowUp(followUpId);
      toast.success('Activity record removed.');
      await fetchLeadDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to delete activity.');
    }
  };

  // Delete Lead
  const confirmDeleteLead = async () => {
    if (!lead) return;
    try {
      setDeleting(true);
      await leadService.deleteLead(lead.id);
      toast.success('Lead deleted successfully.');
      router.push('/leads');
    } catch (err) {
      toast.error(err.message || 'Failed to delete lead.');
      setDeleting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  const cleanPhone = lead?.phone ? String(lead.phone).replace(/\D/g, '') : '';
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return (
    <AppLayout title="Lead Pipeline & Activity Details">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER OJT CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* Card Header (OJT Standard) */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Link
                href="/leads"
                className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded bg-[#f6f9fc] hover:bg-[#e9ecef] text-[#525f7f] border border-[#dee2e6] transition cursor-pointer"
                title="Back to Leads Ledger"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0">
                    {lead?.name || 'Lead Details'}
                  </h2>
                  {lead?.lead_number && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30">
                      #{lead.lead_number}
                    </span>
                  )}
                  {lead?.status && (
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      lead.status === 'Won'
                        ? 'bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30'
                        : lead.status === 'Lost'
                        ? 'bg-[#fdf2f2] text-[#f5365c] border border-[#f5365c]/30'
                        : lead.status === 'On Hold'
                        ? 'bg-amber-50 text-amber-700 border border-amber-300'
                        : 'bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30'
                    }`}>
                      {lead.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8898aa] mt-0.5">
                  Client inquiry profile, sales pipeline lifecycle, and comprehensive interaction history.
                </p>
              </div>
            </div>

            {/* Action Buttons Bar */}
            {lead && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Convert to Client (Won Only) */}
                {lead.status === 'Won' && !lead.converted_client_id && (
                  <button
                    type="button"
                    onClick={() => setIsConvertModalOpen(true)}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#2dce89] to-[#20a36b] hover:opacity-90 rounded shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Convert to Client</span>
                  </button>
                )}

                {/* Linked Client Badge */}
                {lead.converted_client_id && (
                  <Link
                    href={`/projects?search=${encodeURIComponent(lead.name || '')}`}
                    className="btn btn-sm inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/40 rounded shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Client #{lead.converted_client_number || 'Linked'}</span>
                  </Link>
                )}

                {/* Edit Lead Button */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#dee2e6] rounded shadow-xs transition cursor-pointer"
                  title="Edit Inquiry Details"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#4689C8]" />
                  <span>Edit Lead</span>
                </button>

                {/* Pipeline Stage Quick Selector */}
                <div className="inline-flex items-center gap-1">
                  <select
                    value={lead.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#dee2e6] bg-white text-[#172b4d] focus:border-[#4689C8] outline-none cursor-pointer"
                  >
                    <option value="New">Stage: New</option>
                    <option value="Contacted">Stage: Contacted</option>
                    <option value="Qualified">Stage: Qualified</option>
                    <option value="Quotation Sent">Stage: Quotation Sent</option>
                    <option value="Negotiation">Stage: Negotiation</option>
                    <option value="Won">Stage: Won</option>
                    <option value="Lost">Stage: Lost</option>
                    <option value="On Hold">Stage: On Hold</option>
                  </select>
                </div>

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#f5365c] bg-[#fdf2f2] hover:bg-[#fad2d2] border border-[#f5365c]/30 rounded shadow-xs transition cursor-pointer"
                    title="Delete Lead"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchLeadDetails}
                  disabled={loading}
                  className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded bg-white hover:bg-[#f6f9fc] text-[#525f7f] border border-[#dee2e6] shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Reload details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 bg-[#f8f9fe]/40 space-y-6">
            {/* Loading */}
            {loading && !lead && (
              <div className="py-20 text-center text-[#8898aa]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
                <p className="text-sm font-semibold">Loading lead information and activity history...</p>
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-6 text-center bg-white border border-red-200 rounded-lg shadow-xs my-6">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#172b4d]">Unable to Load Lead View</h3>
                <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/leads"
                    className="btn btn-sm px-4 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded"
                  >
                    Return to Leads Ledger
                  </Link>
                </div>
              </div>
            )}

            {!loading && lead && (
              <>
                {/* 1. OJT LEAD & CLIENT INFORMATION CARD (Exact students-view.php report-card style) */}
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <User className="w-4 h-4 text-white" />
                      <span>Lead Profile &amp; Contact Information</span>
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      #{lead.lead_number || lead.id}
                    </span>
                  </div>

                  {/* 2-Column Grid of Bordered Field Boxes (Exact OJT .profile-item) */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Name */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Client / Contact Person
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.name}</span>
                        </div>
                      </div>

                      {/* Business / Company Name */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Business / Company Name
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.company_name || 'Individual Client'}</span>
                        </div>
                      </div>

                      {/* Contact Number with WhatsApp link */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Primary Contact No
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{lead.phone || '—'}</span>
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition"
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366]" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Email Address
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#8898aa]" />
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text-[#4689C8] hover:underline">
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-[#adb5bd] font-normal">Not Provided</span>
                          )}
                        </div>
                      </div>

                      {/* Service & Scope */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition md:col-span-2">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Service &amp; Scope
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5">
                          {lead.service_interest || lead.requirement || 'General Inquiry'}
                        </div>
                      </div>

                      {/* City / Location */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          City / Geographic Location
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>{lead.city || 'Not Specified'}</span>
                        </div>
                      </div>

                      {/* Lead Source */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Lead Generation Source
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>{lead.source || 'Website Inquiry'}</span>
                        </div>
                      </div>

                      {/* Assigned Employee / Owner */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Assigned Officer / Owner
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.assigned_to_name || 'Admin'}</span>
                        </div>
                      </div>

                      {/* Logged Date */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Registration Date &amp; Time
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>{formatDateTime(lead.created_at)}</span>
                        </div>
                      </div>

                      {/* Remark */}
                      {lead.internal_notes && (
                        <div className="border border-[#dee2e6] p-2.5 rounded bg-white hover:border-[#4689C8]/40 transition md:col-span-2">
                          <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                            Remark / Notes
                          </div>
                          <div className="text-xs text-[#525f7f] mt-1 leading-relaxed">
                            {lead.internal_notes}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SALES PIPELINE PROGRESSION STEPPER */}
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <TrendingUp className="w-4 h-4 text-white" />
                      <span>Sales Pipeline Progression</span>
                    </h5>
                    <span className="text-xs text-[#e0f7fa]">
                      Current Stage: <strong className="text-white uppercase">{lead.status}</strong>
                    </span>
                  </div>

                  <div className="p-5 sm:p-6">
                    {/* Stepper Bar */}
                    <div className="relative">
                      <div className="hidden sm:block absolute top-1/2 left-0 right-0 h-1 bg-[#e9ecef] -translate-y-1/2 z-0" />
                      
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 relative z-10">
                        {PIPELINE_STAGES.map((stage, idx) => {
                          const currentIdx = PIPELINE_STAGES.indexOf(lead.status);
                          const isCompleted = currentIdx >= 0 && idx < currentIdx;
                          const isCurrent = lead.status === stage;

                          return (
                            <button
                              key={stage}
                              type="button"
                              onClick={() => handleStatusChange(stage)}
                              className={`p-3 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                                isCurrent
                                  ? 'bg-[#f0f7fd] border-[#4689C8] shadow-sm ring-2 ring-[#4689C8]/20'
                                  : isCompleted
                                  ? 'bg-[#e8f7ee] border-[#2dce89]/40 hover:bg-[#d8f3e3]'
                                  : 'bg-white border-[#dee2e6] hover:bg-[#f6f9fc]'
                              }`}
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                                isCurrent
                                  ? 'bg-[#4689C8] text-white shadow-xs animate-pulse'
                                  : isCompleted
                                  ? 'bg-[#2dce89] text-white'
                                  : 'bg-slate-100 text-[#8898aa]'
                              }`}>
                                {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                              </div>
                              <span className={`text-xs font-bold leading-tight ${
                                isCurrent ? 'text-[#4689C8]' : isCompleted ? 'text-[#2dce89]' : 'text-[#525f7f]'
                              }`}>
                                {stage}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Handling Lost & On Hold Statuses */}
                    {(lead.status === 'Lost' || lead.status === 'On Hold') && (
                      <div className={`mt-4 p-3.5 rounded-lg border text-xs flex items-center justify-between ${
                        lead.status === 'Lost'
                          ? 'bg-[#fdf2f2] border-[#f5365c]/30 text-[#f5365c]'
                          : 'bg-amber-50 border-amber-300 text-amber-800'
                      }`}>
                        <div>
                          <strong>{lead.status} State:</strong> {lead.lost_reason || lead.on_hold_reason || 'Marked as non-active stage.'}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleStatusChange('Contacted')}
                          className="px-3 py-1 rounded bg-white border border-current font-bold text-xs hover:opacity-90 transition cursor-pointer"
                        >
                          Reopen Pipeline
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. ACTIVITY & FOLLOW-UP HISTORY LEDGER + LOG INTERACTION SECTION */}
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#172b4d] to-[#213a63] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <MessageSquare className="w-4 h-4 text-white" />
                      <span>Activity &amp; Follow-up History ({followUps.length})</span>
                    </h5>
                    <span className="text-xs text-slate-300">
                      Real-time conversation logs &amp; touchpoint trail
                    </span>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* FOLLOW-UP TIMELINE TABLE */}
                    <div className="table-responsive border border-[#cbd5e1] rounded-lg overflow-hidden shadow-xs">
                      <table className="w-full text-xs text-left border-collapse">
                        <thead className="bg-[#e9ecef] text-[#334155] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#cbd5e1]">
                          <tr>
                            <th className="py-3 px-3.5 border-r border-[#cbd5e1] w-40">Channel / Type</th>
                            <th className="py-3 px-3.5 border-r border-[#cbd5e1] w-44">Logged On</th>
                            <th className="py-3 px-3.5 border-r border-[#cbd5e1]">Notes &amp; Discussion</th>
                            <th className="py-3 px-3.5 border-r border-[#cbd5e1] w-48">Outcome</th>
                            <th className="py-3 px-3.5 text-center w-20">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                          {followUps.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="py-10 text-center text-[#64748b] bg-white">
                                <MessageSquare className="w-9 h-9 mx-auto text-[#94a3b8] mb-2.5 opacity-70" />
                                <p className="font-semibold text-xs text-[#334155]">No interaction activities recorded yet</p>
                                <p className="text-[11px] text-[#64748b] mt-0.5">
                                  Activity history and pipeline stage transitions will appear here automatically.
                                </p>
                              </td>
                            </tr>
                          ) : (
                            followUps.map((item, idx) => {
                              const isEven = idx % 2 === 0;
                              return (
                                <tr 
                                  key={item.id} 
                                  className={`transition-colors duration-150 ${
                                    isEven ? 'bg-white' : 'bg-[#f4f6f8]'
                                  } hover:bg-[#eaf2fc]`}
                                >
                                  {/* Channel / Type */}
                                  <td className="py-3 px-3.5 border-r border-[#e2e8f0] font-semibold text-[#1e293b]">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${
                                      item.follow_up_type === 'Call'
                                        ? 'bg-blue-50 text-[#326fa8] border-[#4689C8]/30'
                                        : item.follow_up_type === 'Meeting'
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : item.follow_up_type === 'Email'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : item.follow_up_type === 'Message'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-100 text-slate-700 border-slate-300'
                                    }`}>
                                      {item.follow_up_type === 'Call' && <Phone className="w-3.5 h-3.5 text-[#4689C8]" />}
                                      {item.follow_up_type === 'Meeting' && <Calendar className="w-3.5 h-3.5 text-purple-600" />}
                                      {item.follow_up_type === 'Email' && <Mail className="w-3.5 h-3.5 text-amber-600" />}
                                      {item.follow_up_type === 'Message' && <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />}
                                      {item.follow_up_type === 'Other' && <FileText className="w-3.5 h-3.5 text-slate-600" />}
                                      <span>{item.follow_up_type || 'Touchpoint'}</span>
                                    </span>
                                  </td>

                                  {/* Logged On */}
                                  <td className="py-3 px-3.5 border-r border-[#e2e8f0] font-mono text-[11px] text-[#475569]">
                                    <div className="flex items-center gap-1.5">
                                      <Clock className="w-3 h-3 text-[#94a3b8] flex-shrink-0" />
                                      <span>{formatDateTime(item.scheduled_at || item.created_at)}</span>
                                    </div>
                                  </td>

                                  {/* Notes & Discussion */}
                                  <td className="py-3 px-3.5 border-r border-[#e2e8f0]">
                                    <div className="text-xs text-[#0f172a] font-semibold leading-relaxed">
                                      {item.notes}
                                    </div>
                                  </td>

                                  {/* Outcome */}
                                  <td className="py-3 px-3.5 border-r border-[#e2e8f0]">
                                    <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold bg-white text-[#334155] border border-[#cbd5e1] shadow-2xs">
                                      {item.outcome || 'Logged'}
                                    </span>
                                  </td>

                                  {/* Action */}
                                  <td className="py-3 px-3.5 text-center">
                                    {isAdmin && (
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteFollowUp(item.id)}
                                        className="p-1.5 text-[#ef4444] hover:bg-red-50 hover:text-red-700 rounded-md transition cursor-pointer"
                                        title="Delete Activity"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Edit Lead Modal */}
      {lead && (
        <LeadModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          lead={lead}
          onSuccess={() => fetchLeadDetails()}
        />
      )}

      {/* Convert Won Lead to Client Modal */}
      {lead && (
        <ConvertToClientModal
          isOpen={isConvertModalOpen}
          onClose={() => setIsConvertModalOpen(false)}
          lead={lead}
          onSuccess={() => {
            fetchLeadDetails();
            router.push('/projects');
          }}
        />
      )}

      {/* Confirm Delete Lead Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteLead}
        loading={deleting}
        title="Delete Lead Record"
        message={`Are you sure you want to permanently delete lead inquiry #${lead?.lead_number || lead?.id} for ${lead?.name}? This will remove all associated activity history.`}
      />
    </AppLayout>
  );
}

export default function LeadViewPage() {
  return (
    <Suspense
      fallback={
        <AppLayout title="Lead Pipeline & Activity Details">
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#4689C8] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#525f7f]">Loading lead view...</p>
          </div>
        </AppLayout>
      }
    >
      <LeadViewContent />
    </Suspense>
  );
}

