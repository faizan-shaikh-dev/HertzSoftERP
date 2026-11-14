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
  UserPlus, 
  UserCheck, 
  ChevronRight, 
  FileText, 
  Check,
  TrendingUp,
  Tag,
  ShieldCheck,
  Compass,
  Target,
  Search,
  Handshake,
  Moon,
  Archive,
  Plus,
  Send,
  FolderKanban,
  ExternalLink
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

// 14 Comprehensive Lead Lifecycle Statuses
export const LEAD_STATUSES = [
  {
    number: 1,
    id: 'New Lead',
    label: 'New Lead',
    icon: UserPlus,
    color: 'bg-[#4689C8]',
    textColor: 'text-[#4689C8]',
    borderColor: 'border-l-[#4689C8]',
    lightBg: 'bg-[#EAF3FB]'
  },
  {
    number: 2,
    id: 'Contacted',
    label: 'Contacted',
    icon: Phone,
    color: 'bg-[#5FC8D6]',
    textColor: 'text-[#39AFC0]',
    borderColor: 'border-l-[#5FC8D6]',
    lightBg: 'bg-[#E8F8FA]'
  },
  {
    number: 3,
    id: 'Responded',
    label: 'Responded',
    icon: MessageSquare,
    color: 'bg-[#39AFC0]',
    textColor: 'text-[#39AFC0]',
    borderColor: 'border-l-[#39AFC0]',
    lightBg: 'bg-[#E8F8FA]'
  },
  {
    number: 4,
    id: 'Qualified',
    label: 'Qualified',
    icon: Target,
    color: 'bg-[#78A9D7]',
    textColor: 'text-[#3475B2]',
    borderColor: 'border-l-[#78A9D7]',
    lightBg: 'bg-[#EAF3FB]'
  },
  {
    number: 5,
    id: 'Meeting Scheduled',
    label: 'Meeting Scheduled',
    icon: Calendar,
    color: 'bg-[#8965E0]',
    textColor: 'text-[#8965E0]',
    borderColor: 'border-l-[#8965E0]',
    lightBg: 'bg-purple-50'
  },
  {
    number: 6,
    id: 'Requirement Analysis',
    label: 'Requirement Analysis',
    icon: Search,
    color: 'bg-[#5FC8D6]',
    textColor: 'text-[#39AFC0]',
    borderColor: 'border-l-[#5FC8D6]',
    lightBg: 'bg-[#E8F8FA]'
  },
  {
    number: 7,
    id: 'Proposal Sent',
    label: 'Proposal Sent',
    icon: FileText,
    color: 'bg-[#4689C8]',
    textColor: 'text-[#4689C8]',
    borderColor: 'border-l-[#4689C8]',
    lightBg: 'bg-[#EAF3FB]'
  },
  {
    number: 8,
    id: 'Negotiation',
    label: 'Negotiation',
    icon: Handshake,
    color: 'bg-[#8965E0]',
    textColor: 'text-[#8965E0]',
    borderColor: 'border-l-[#8965E0]',
    lightBg: 'bg-purple-50'
  },
  {
    number: 9,
    id: 'Follow-up',
    label: 'Follow-up',
    icon: Clock,
    color: 'bg-[#FB6340]',
    textColor: 'text-[#FB6340]',
    borderColor: 'border-l-[#FB6340]',
    lightBg: 'bg-orange-50'
  },
  {
    number: 10,
    id: 'Won',
    label: 'Won',
    icon: CheckCircle2,
    color: 'bg-[#20A36B]',
    textColor: 'text-[#20A36B]',
    borderColor: 'border-l-[#20A36B]',
    lightBg: 'bg-[#EAF8F1]'
  },
  {
    number: 11,
    id: 'Lost',
    label: 'Lost',
    icon: XCircle,
    color: 'bg-[#F5365C]',
    textColor: 'text-[#F5365C]',
    borderColor: 'border-l-[#F5365C]',
    lightBg: 'bg-[#FDF2F2]'
  },
  {
    number: 12,
    id: 'On Hold',
    label: 'On Hold',
    icon: Moon,
    color: 'bg-[#71869B]',
    textColor: 'text-[#71869B]',
    borderColor: 'border-l-[#71869B]',
    lightBg: 'bg-[#F4F8FC]'
  },
  {
    number: 13,
    id: 'Re-engage Later',
    label: 'Re-engage Later',
    icon: RefreshCw,
    color: 'bg-[#8965E0]',
    textColor: 'text-[#8965E0]',
    borderColor: 'border-l-[#8965E0]',
    lightBg: 'bg-purple-50'
  },
  {
    number: 14,
    id: 'Archived',
    label: 'Archived',
    icon: Archive,
    color: 'bg-[#71869B]',
    textColor: 'text-[#71869B]',
    borderColor: 'border-l-[#71869B]',
    lightBg: 'bg-[#F4F8FC]'
  }
];

// Helper to resolve status/outcome styling and icon
const getStatusMeta = (statusOrOutcome) => {
  if (!statusOrOutcome) {
    return LEAD_STATUSES[0];
  }
  const clean = String(statusOrOutcome).trim().toLowerCase();

  // Try direct match by id
  const exact = LEAD_STATUSES.find(s => s.id.toLowerCase() === clean);
  if (exact) return exact;

  // Semantic keyword matches
  if (clean.includes('new lead') || clean === 'new') return LEAD_STATUSES[0];
  if (clean.includes('contacted') || clean.includes('phone') || clean.includes('call')) return LEAD_STATUSES[1];
  if (clean.includes('responded') || clean.includes('response')) return LEAD_STATUSES[2];
  if (clean.includes('qualified')) return LEAD_STATUSES[3];
  if (clean.includes('meeting') || clean.includes('demo') || clean.includes('schedule')) return LEAD_STATUSES[4];
  if (clean.includes('requirement') || clean.includes('analysis') || clean.includes('scope')) return LEAD_STATUSES[5];
  if (clean.includes('proposal') || clean.includes('quotation') || clean.includes('quote')) return LEAD_STATUSES[6];
  if (clean.includes('negotiat') || clean.includes('price') || clean.includes('pricing')) return LEAD_STATUSES[7];
  if (clean.includes('follow-up') || clean.includes('follow up') || clean.includes('reminder')) return LEAD_STATUSES[8];
  if (clean.includes('won') || clean.includes('converted') || clean.includes('deal closed')) return LEAD_STATUSES[9];
  if (clean.includes('lost') || clean.includes('dropped') || clean.includes('rejected')) return LEAD_STATUSES[10];
  if (clean.includes('hold') || clean.includes('paused') || clean.includes('waiting')) return LEAD_STATUSES[11];
  if (clean.includes('re-engage') || clean.includes('reengage') || clean.includes('later')) return LEAD_STATUSES[12];
  if (clean.includes('archiv')) return LEAD_STATUSES[13];

  return {
    number: '•',
    id: statusOrOutcome,
    label: statusOrOutcome,
    icon: MessageSquare,
    color: 'bg-[#4689C8]',
    textColor: 'text-[#4689C8]',
    borderColor: 'border-l-[#4689C8]',
    lightBg: 'bg-blue-50'
  };
};

// Sales Pipeline Stages in chronological order
const PIPELINE_STAGES = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Proposal Sent',
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

  // Delete Activity / Follow-up Modal state
  const [isDeleteActivityModalOpen, setIsDeleteActivityModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Activity Logging form state
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityStatus, setNewActivityStatus] = useState('Contacted');
  const [newActivityRemark, setNewActivityRemark] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [syncLeadStatus, setSyncLeadStatus] = useState(true);

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

  // Trigger Delete Follow-up modal
  const openDeleteActivityModal = (activity) => {
    setActivityToDelete(activity);
    setIsDeleteActivityModalOpen(true);
  };

  // Confirm Delete Follow-up Item
  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;
    try {
      setDeletingActivity(true);
      await leadService.deleteFollowUp(activityToDelete.id);
      toast.success('Activity record removed.');
      setIsDeleteActivityModalOpen(false);
      setActivityToDelete(null);
      await fetchLeadDetails();
    } catch (err) {
      toast.error(err.message || 'Failed to delete activity.');
    } finally {
      setDeletingActivity(false);
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

  // Timeline datetime format matching Image 1: MM-DD-YYYY h:mm a (e.g. 11-16-2023 4:27 pm)
  const formatTimelineDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yyyy = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${mm}-${dd}-${yyyy} ${hours}:${minutes} ${ampm}`;
    } catch {
      return dateStr;
    }
  };

  // Create Activity & Remark Handler
  const handleCreateActivity = async (e) => {
    if (e) e.preventDefault();
    if (!newActivityRemark.trim()) {
      toast.error('Please enter a remark note for this activity.');
      return;
    }

    try {
      setSubmittingActivity(true);
      await leadService.createFollowUp(lead.id, {
        outcome: newActivityStatus,
        notes: newActivityRemark.trim(),
        follow_up_type: 'Other',
        follow_up_at: new Date().toISOString(),
        status: 'Completed'
      });

      if (syncLeadStatus && lead.status !== newActivityStatus) {
        try {
          await leadService.updateLeadStatus(lead.id, { status: newActivityStatus });
        } catch (statusErr) {
          console.warn('Could not auto-update lead status:', statusErr);
        }
      }

      toast.success('Activity and remark recorded successfully!');
      setNewActivityRemark('');
      setIsAddingActivity(false);
      await fetchLeadDetails();
    } catch (err) {
      console.error('Failed to log activity:', err);
      toast.error(err.message || 'Could not record activity.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  const targetWhatsapp = lead?.whatsapp_no || lead?.alternate_phone || lead?.phone;
  const cleanPhone = targetWhatsapp ? String(targetWhatsapp).replace(/\D/g, '') : '';
  const waPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  return (
    <AppLayout title="Lead Pipeline & Activity Details">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#DFEAF2] rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#DFEAF2] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Back Button */}
              <Link
                href="/leads"
                className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#F4F8FC] hover:bg-[#EAF3FB] text-[#19324D] border border-[#DFEAF2] transition cursor-pointer"
                title="Back to Leads Ledger"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0">
                    {lead?.name || 'Lead Details'}
                  </h2>
                  {lead?.lead_number && (
                    <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-[#EAF3FB] text-[#4689C8] border border-[#78A9D7]/30">
                      #{lead.lead_number}
                    </span>
                  )}
                  {lead?.status && (
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                      lead.status === 'Won'
                        ? 'bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30'
                        : lead.status === 'Lost'
                        ? 'bg-[#FDF2F2] text-[#F5365C] border border-[#F5365C]/30'
                        : lead.status === 'On Hold'
                        ? 'bg-amber-50 text-amber-700 border border-amber-300'
                        : 'bg-[#EAF3FB] text-[#4689C8] border border-[#78A9D7]/30'
                    }`}>
                      {lead.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71869B] mt-0.5">
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
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#20A36B] hover:bg-[#188a59] rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Convert to Client</span>
                  </button>
                )}

                {/* Linked Client Badge */}
                {lead.converted_client_id && (
                  <Link
                    href={`/projects?search=${encodeURIComponent(lead.name || '')}`}
                    className="btn btn-sm inline-flex items-center gap-1 px-3 py-2 text-xs font-bold bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/40 rounded-lg shadow-2xs"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Client #{lead.converted_client_number || 'Linked'}</span>
                  </Link>
                )}

                {/* Edit Lead Button */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#19324D] bg-white hover:bg-[#EAF3FB] border border-[#DFEAF2] rounded-lg shadow-xs transition cursor-pointer"
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
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none cursor-pointer"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stage #{s.number}: {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#F5365C] bg-[#FDF2F2] hover:bg-[#F5365C]/10 border border-[#F5365C]/30 rounded-lg shadow-xs transition cursor-pointer"
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
                  className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-[#EAF3FB] text-[#19324D] border border-[#DFEAF2] shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Reload details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 bg-[#F4F8FC]/50 space-y-6">
            {/* Loading */}
            {loading && !lead && (
              <div className="py-20 text-center text-[#71869B]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
                <p className="text-sm font-semibold">Loading lead information and activity history...</p>
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-6 text-center bg-white border border-red-200 rounded-xl shadow-xs my-6">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#19324D]">Unable to Load Lead View</h3>
                <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/leads"
                    className="btn btn-sm px-4 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg"
                  >
                    Return to Leads Ledger
                  </Link>
                </div>
              </div>
            )}

            {!loading && lead && (
              <>
                {/* 0. CONVERTED CLIENT & PROJECT TRACEABILITY BANNER */}
                {lead.converted_client_id && (
                  <div className="bg-white border border-[#DFEAF2] rounded-xl p-3 sm:p-4 shadow-2xs">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                        <span className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider mr-1">
                          Lifecycle Traceability:
                        </span>

                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#EAF3FB] text-[#4689C8] border border-[#78A9D7]/40">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Origin Lead #{lead.lead_number} (Won)</span>
                        </span>

                        <ChevronRight className="w-3.5 h-3.5 text-[#71869B]" />

                        <Link
                          href="/clients"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#EAF8F1] text-[#20A36B] hover:bg-[#20A36B] hover:text-white border border-[#20A36B]/40 transition group"
                          title="View Client in Clients Directory"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Converted to Client #{lead.converted_client_number || 'Linked'}</span>
                          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </Link>

                        <ChevronRight className="w-3.5 h-3.5 text-[#71869B]" />

                        <Link
                          href={`/projects?search=${encodeURIComponent(lead.name || '')}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#19324D] text-white hover:bg-[#3475B2] transition group shadow-2xs"
                          title="View Linked Client Projects"
                        >
                          <FolderKanban className="w-3.5 h-3.5 text-[#5FC8D6]" />
                          <span>View Client Projects</span>
                          <ExternalLink className="w-3 h-3 text-[#5FC8D6]" />
                        </Link>
                      </div>

                      <Link
                        href={`/projects?search=${encodeURIComponent(lead.name || '')}`}
                        className="text-xs font-bold text-[#20A36B] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open Projects Ledger</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* 1. LEAD & CLIENT INFORMATION CARD */}
                <div className="card shadow-sm border border-[#DFEAF2] rounded-xl overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#3475B2] via-[#4689C8] to-[#5FC8D6] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <User className="w-4 h-4 text-white" />
                      <span>Lead Profile &amp; Contact Information</span>
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      #{lead.lead_number || lead.id}
                    </span>
                  </div>

                  {/* 2-Column Grid of Bordered Field Boxes */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Name */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Client / Contact Person
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.name}</span>
                        </div>
                      </div>

                      {/* Business / Company Name */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Business / Company Name
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.company_name || 'Individual Client'}</span>
                        </div>
                      </div>

                      {/* Primary Contact Number */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Primary Contact No
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span className="font-mono">{lead.phone || '—'}</span>
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-xs text-[#4689C8] hover:underline font-semibold ml-auto"
                              title="Call"
                            >
                              Call
                            </a>
                          )}
                        </div>
                      </div>

                      {/* WhatsApp Number with direct chat link */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#20A36B]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          WhatsApp Number
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{lead.whatsapp_no || lead.alternate_phone || lead.phone || '—'}</span>
                          {waPhone && (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#20A36B]/10 text-[#20A36B] hover:bg-[#20A36B]/20 transition ml-auto"
                              title="Chat on WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-[#20A36B]" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Email */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Email Address
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#71869B]" />
                          {lead.email ? (
                            <a href={`mailto:${lead.email}`} className="text-[#4689C8] hover:underline">
                              {lead.email}
                            </a>
                          ) : (
                            <span className="text-[#71869B] font-normal">Not Provided</span>
                          )}
                        </div>
                      </div>

                      {/* Lead Inquiry */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition md:col-span-2">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Lead Inquiry
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5">
                          {lead.service_interest || lead.requirement || 'General Inquiry'}
                        </div>
                      </div>

                      {/* City / Location */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          City / Geographic Location
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#71869B]" />
                          <span>{lead.city || 'Not Specified'}</span>
                        </div>
                      </div>

                      {/* Lead Source */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Lead Generation Source
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Compass className="w-3.5 h-3.5 text-[#71869B]" />
                          <span>{lead.source || 'Website Inquiry'}</span>
                        </div>
                      </div>

                      {/* Assigned Employee / Owner */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Assigned Officer / Owner
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{lead.assigned_to_name || 'Admin'}</span>
                        </div>
                      </div>

                      {/* Logged Date */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Registration Date &amp; Time
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#71869B]" />
                          <span>{formatDateTime(lead.created_at)}</span>
                        </div>
                      </div>

                      {/* Remark */}
                      {lead.internal_notes && (
                        <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition md:col-span-2">
                          <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                            Remark / Notes
                          </div>
                          <div className="text-xs text-[#71869B] mt-1 leading-relaxed">
                            {lead.internal_notes}
                          </div>
                        </div>
                      )}

                      {/* Lost Reason */}
                      {lead.status === 'Lost' && (
                        <div className="border border-red-200 bg-red-50 p-2.5 rounded-lg md:col-span-2">
                          <div className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
                            Reason for Loss
                          </div>
                          <div className="text-xs text-red-700 mt-1 font-medium">
                            {lead.lost_reason || 'No specific loss reason recorded.'}
                          </div>
                        </div>
                      )}

                      {/* On Hold Reason */}
                      {lead.status === 'On Hold' && (
                        <div className="border border-amber-200 bg-amber-50 p-2.5 rounded-lg md:col-span-2">
                          <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                            On-Hold Reason &amp; Revisit Date
                          </div>
                          <div className="text-xs text-amber-800 mt-1 font-medium">
                            {lead.on_hold_reason || 'No on-hold reason recorded.'}
                            {lead.revisit_date && ` • Target Revisit: ${formatDate(lead.revisit_date)}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. ACTIVITY HISTORY SECTION (Vertical Timeline) */}
                <div className="card shadow-sm border border-[#DFEAF2] rounded-xl overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#19324D] to-[#3475B2] text-white px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                        <MessageSquare className="w-4 h-4 text-white" />
                        <span>Activity History ({followUps.length})</span>
                      </h5>
                      <p className="text-xs text-[#E8F8FA] mt-0.5 m-0">
                        Real-time interaction logs &amp; activity timeline
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingActivity(!isAddingActivity)}
                      className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingActivity ? 'Close Form' : 'Log Activity'}</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* Collapsible New Activity Form */}
                    {isAddingActivity && (
                      <div className="mb-6 p-4 sm:p-5 bg-[#F4F8FC] border border-[#DFEAF2] rounded-xl shadow-2xs">
                        <div className="flex items-center justify-between mb-3 border-b border-[#DFEAF2] pb-2">
                          <h6 className="text-xs font-bold text-[#19324D] uppercase tracking-wider flex items-center gap-1.5 m-0">
                            <Plus className="w-3.5 h-3.5 text-[#4689C8]" />
                            <span>Record New Activity / Remark</span>
                          </h6>
                          <button
                            type="button"
                            onClick={() => setIsAddingActivity(false)}
                            className="text-xs text-[#71869B] hover:text-[#19324D] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleCreateActivity} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-[#19324D] uppercase mb-1">
                                Lifecycle Status *
                              </label>
                              <select
                                value={newActivityStatus}
                                onChange={(e) => setNewActivityStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none cursor-pointer"
                              >
                                {LEAD_STATUSES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Stage #{s.number}: {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#19324D] pb-2 select-none">
                                <input
                                  type="checkbox"
                                  checked={syncLeadStatus}
                                  onChange={(e) => setSyncLeadStatus(e.target.checked)}
                                  className="rounded text-[#4689C8] focus:ring-[#4689C8]"
                                />
                                <span>Also sync current lead status to &quot;{newActivityStatus}&quot;</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#19324D] uppercase mb-1">
                              Remark / Notes *
                            </label>
                            <textarea
                              rows="3"
                              value={newActivityRemark}
                              onChange={(e) => setNewActivityRemark(e.target.value)}
                              placeholder="Enter conversation notes or interaction remarks here..."
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] placeholder-[#71869B] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none leading-relaxed resize-none"
                              required
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingActivity(false);
                                setNewActivityRemark('');
                              }}
                              className="btn btn-sm px-3.5 py-1.5 text-xs font-semibold text-[#19324D] bg-white border border-[#DFEAF2] hover:bg-[#EAF3FB] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingActivity}
                              className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{submittingActivity ? 'Saving...' : 'Save Activity Record'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* VERTICAL TIMELINE CONTAINER */}
                    {followUps.length === 0 ? (
                      <div className="py-12 text-center text-[#71869B] bg-[#F4F8FC] border border-dashed border-[#DFEAF2] rounded-xl">
                        <MessageSquare className="w-10 h-10 mx-auto text-[#71869B]/40 mb-2.5 opacity-60" />
                        <h4 className="font-bold text-sm text-[#19324D]">No interaction activities recorded yet</h4>
                        <p className="text-xs text-[#71869B] mt-1 max-w-sm mx-auto">
                          Click &quot;Log Activity&quot; above or update the pipeline stage to start capturing conversation remarks.
                        </p>
                      </div>
                    ) : (
                      <div className="relative pt-2 pb-4 px-1 sm:px-4">
                        {/* Continuous vertical timeline stem line */}
                        <div className="hidden sm:block absolute left-[169px] top-6 bottom-6 w-0.5 bg-[#DFEAF2]" />
                        <div className="sm:hidden absolute left-5 top-6 bottom-6 w-0.5 bg-[#DFEAF2]" />

                        <div className="space-y-7">
                          {followUps.map((item, idx) => {
                            const meta = getStatusMeta(item.outcome || item.status);
                            const StatusIcon = meta.icon;
                            const formattedDate = formatTimelineDateTime(item.follow_up_at || item.scheduled_at || item.created_at);

                            return (
                              <div
                                key={item.id || idx}
                                className="relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group"
                              >
                                {/* 1. Date & Time (Left column on desktop, above on mobile) */}
                                <div className="pl-12 sm:pl-0 sm:w-[130px] sm:text-right flex-shrink-0 pt-1">
                                  <span className="text-[11px] font-mono font-medium text-[#71869B] tracking-tight">
                                    {formattedDate}
                                  </span>
                                </div>

                                {/* 2. Timeline Circle Node (Centered on the line) */}
                                <div className="absolute left-1 sm:relative sm:left-auto flex-shrink-0 z-10">
                                  <div className={`w-8 h-8 rounded-full ${meta.color} flex items-center justify-center text-white ring-4 ring-white shadow-xs transition-transform group-hover:scale-110`}>
                                    <StatusIcon className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* 3. Status Title & Remark Card (Right column) */}
                                <div className="pl-12 sm:pl-0 flex-1 min-w-0">
                                  {/* Status Name Header */}
                                  <div className="flex items-center gap-2 mb-2 pt-0.5">
                                    <h4 className="text-sm font-bold text-[#19324D] tracking-tight m-0">
                                      {meta.label}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.lightBg} ${meta.textColor} border border-current/20`}>
                                      Stage #{meta.number}
                                    </span>
                                  </div>

                                  {/* Sub-branch Connector & Single Remark Card */}
                                  <div className="flex items-start gap-2.5">
                                    {/* Branch connector line with circle */}
                                    <div className="flex items-center h-6 text-[#DFEAF2] select-none pt-1">
                                      <span className="w-3.5 h-0.5 bg-[#DFEAF2] inline-block" />
                                      <span className="w-2 h-2 rounded-full border border-[#DFEAF2] bg-white inline-block -ml-0.5" />
                                    </div>

                                    {/* Remark Card */}
                                    <div className={`flex-1 bg-[#F8FAFD] border border-[#DFEAF2] border-l-4 ${meta.borderColor} rounded-r-xl p-3.5 shadow-2xs relative hover:bg-white hover:border-[#CBDCEB] transition duration-150`}>
                                      <div className="text-xs sm:text-sm text-[#19324D] leading-relaxed pr-8 whitespace-pre-wrap">
                                        {item.notes || 'Activity recorded without additional remarks.'}
                                      </div>

                                      {/* Hover Delete Action Button */}
                                      {isAdmin && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                          <button
                                            type="button"
                                            onClick={() => openDeleteActivityModal(item)}
                                            className="p-1.5 text-[#71869B] hover:text-[#F5365C] hover:bg-[#FDF2F2] rounded-md border border-transparent hover:border-[#F5365C]/30 transition cursor-pointer"
                                            title="Delete Activity Record"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
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

      {/* Confirm Delete Activity / Interaction Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteActivityModalOpen}
        onClose={() => {
          setIsDeleteActivityModalOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={confirmDeleteActivity}
        loading={deletingActivity}
        title="Delete Activity Record"
        message="Are you sure you want to delete this interaction note? This entry will be permanently removed from the lead activity history."
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
            <p className="text-sm font-semibold text-[#71869B]">Loading lead view...</p>
          </div>
        </AppLayout>
      }
    >
      <LeadViewContent />
    </Suspense>
  );
}

