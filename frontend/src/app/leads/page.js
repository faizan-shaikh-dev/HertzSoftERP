'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import leadService from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Briefcase, 
  Building2, 
  IndianRupee, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Layers,
  MessageSquare,
  Bell,
  ChevronDown,
  ChevronUp,
  Calendar,
  AlertTriangle,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { 
  LeadModal, 
  ConfirmDeleteModal, 
  LostReasonModal, 
  OnHoldModal, 
  FollowUpModal,
  ConvertToClientModal
} from '@/components/modals';

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

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [leadForLostStatus, setLeadForLostStatus] = useState(null);
  const [updatingLost, setUpdatingLost] = useState(false);

  const [isOnHoldModalOpen, setIsOnHoldModalOpen] = useState(false);
  const [leadForOnHoldStatus, setLeadForOnHoldStatus] = useState(null);
  const [updatingOnHold, setUpdatingOnHold] = useState(false);

  // Convert to Client Modal State
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState(null);

  // Follow-up & Reminders State
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [selectedLeadForFollowUp, setSelectedLeadForFollowUp] = useState(null);
  const [assignees, setAssignees] = useState([]);
  const [reminders, setReminders] = useState({
    overdue: [],
    today: [],
    upcoming: [],
    totalCount: 0,
    overdueCount: 0,
    todayCount: 0
  });
  const [showRemindersList, setShowRemindersList] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Fetch reminders
  const fetchReminders = async () => {
    try {
      setLoadingReminders(true);
      const res = await leadService.getReminders();
      setReminders(res.data || {
        overdue: [],
        today: [],
        upcoming: [],
        totalCount: 0,
        overdueCount: 0,
        todayCount: 0
      });
    } catch (err) {
      console.error('Failed to load follow-up reminders:', err);
    } finally {
      setLoadingReminders(false);
    }
  };

  // Fetch assignees
  const fetchAssignees = async () => {
    try {
      const res = await leadService.getAssignees();
      setAssignees(res.data || []);
    } catch (err) {
      console.error('Failed to load assignees:', err);
    }
  };

  // Fetch leads from backend
  const fetchLeads = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await leadService.getLeads();
      setLeads(res.data || []);
      fetchReminders();
      if (isManual) {
        toast.success('Leads list refreshed with latest inquiries!');
      }
    } catch (err) {
      console.error('Failed to load leads:', err);
      const msg = err.message || 'Could not fetch leads. Please check server connectivity.';
      setError(msg);
      if (isManual) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(false);
    fetchAssignees();
  }, []);

  // Quick Inline Status Update
  const handleStatusChange = async (lead, newStatus) => {
    if (newStatus === 'Lost') {
      setLeadForLostStatus(lead);
      setIsLostModalOpen(true);
      return;
    }

    if (newStatus === 'On Hold') {
      setLeadForOnHoldStatus(lead);
      setIsOnHoldModalOpen(true);
      return;
    }

    if (newStatus === 'Won') {
      try {
        await leadService.updateLeadStatus(lead.id, { status: 'Won' });
        setLeads((prev) =>
          prev.map((l) => (l.id === lead.id ? { ...l, status: 'Won' } : l))
        );
        toast.success(`Inquiry marked as WON! 🎉`);
        if (!lead.converted_client_id) {
          setLeadToConvert({ ...lead, status: 'Won' });
          setIsConvertModalOpen(true);
        }
      } catch (err) {
        console.error('Failed to update status:', err);
        toast.error(err.message || 'Failed to update pipeline status.');
      }
      return;
    }

    try {
      await leadService.updateLeadStatus(lead.id, { status: newStatus });
      setLeads((prev) =>
        prev.map((l) => (l.id === lead.id ? { ...l, status: newStatus } : l))
      );
      toast.success(`Inquiry status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.message || 'Failed to update pipeline status.');
    }
  };

  const handleConfirmOnHold = async ({ reason, revisitDate }) => {
    if (!leadForOnHoldStatus) return;
    try {
      setUpdatingOnHold(true);
      await leadService.updateLeadStatus(leadForOnHoldStatus.id, {
        status: 'On Hold',
        on_hold_reason: reason,
        revisit_date: revisitDate
      });
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadForOnHoldStatus.id
            ? { ...l, status: 'On Hold', on_hold_reason: reason, revisit_date: revisitDate }
            : l
        )
      );
      toast.success('Inquiry placed On Hold');
      setIsOnHoldModalOpen(false);
      setLeadForOnHoldStatus(null);
    } catch (err) {
      console.error('Failed to put lead on hold:', err);
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setUpdatingOnHold(false);
    }
  };

  const handleConfirmLostReason = async (reason) => {
    if (!leadForLostStatus) return;
    try {
      setUpdatingLost(true);
      await leadService.updateLeadStatus(leadForLostStatus.id, {
        status: 'Lost',
        lost_reason: reason
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadForLostStatus.id ? { ...l, status: 'Lost', lost_reason: reason } : l))
      );
      toast.success(`Inquiry marked as Lost`);
      setIsLostModalOpen(false);
      setLeadForLostStatus(null);
    } catch (err) {
      console.error('Failed to mark lead as lost:', err);
      toast.error(err.message || 'Failed to update status.');
    } finally {
      setUpdatingLost(false);
    }
  };

  // Delete Action
  const confirmDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      setDeleting(true);
      await leadService.deleteLead(leadToDelete.id);
      setLeads((prev) => prev.filter((l) => l.id !== leadToDelete.id));
      toast.success(`Inquiry for "${leadToDelete.name}" deleted successfully.`);
      setIsDeleteModalOpen(false);
      setLeadToDelete(null);
    } catch (err) {
      console.error('Error deleting lead:', err);
      toast.error(err.message || 'Failed to delete lead.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Status filter
      if (selectedStatus !== 'All' && lead.status !== selectedStatus) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = lead.name?.toLowerCase().includes(q);
        const phoneMatch = lead.phone?.includes(q);
        const emailMatch = lead.email?.toLowerCase().includes(q);
        const companyMatch = lead.company_name?.toLowerCase().includes(q);
        const interestMatch = lead.service_interest?.toLowerCase().includes(q);
        const reqMatch = lead.requirement?.toLowerCase().includes(q);

        if (!nameMatch && !phoneMatch && !emailMatch && !companyMatch && !interestMatch && !reqMatch) {
          return false;
        }
      }

      return true;
    });
  }, [leads, selectedStatus, searchQuery]);

  const formatCurrency = (amount) => {
    if (!amount) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <AppLayout title="Client Leads & Business Inquiries">
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-5 rounded-lg border border-blue-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Client Inquiries & Deals Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage prospective enterprise software clients, project requirements, budgets, and deal conversions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchLeads(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Lead</span>
          </button>
        </div>
      </div>

      {/* Follow-up Reminders Alert Card */}
      {reminders.totalCount > 0 && (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden transition-all">
          <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-50/60 via-white to-red-50/40 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Client Follow-up Reminders
                  </h3>
                  {reminders.overdueCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700 border border-red-200">
                      <AlertTriangle className="w-3 h-3" />
                      {reminders.overdueCount} Overdue
                    </span>
                  )}
                  {reminders.todayCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      <Clock className="w-3 h-3" />
                      {reminders.todayCount} Due Today
                    </span>
                  )}
                  {reminders.upcoming?.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {reminders.upcoming.length} Upcoming
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Scheduled phone calls, demos, and pending touchpoints for client inquiries.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRemindersList(!showRemindersList)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition cursor-pointer self-start sm:self-center"
            >
              <span>{showRemindersList ? 'Hide Schedule' : `View Reminders (${reminders.totalCount})`}</span>
              {showRemindersList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Expanded Reminders List */}
          {showRemindersList && (
            <div className="p-4 bg-slate-50/50 divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {[...reminders.overdue, ...reminders.today, ...reminders.upcoming].map((item) => {
                const dueTime = new Date(item.next_follow_up_at || item.follow_up_at);
                const isOverdue = dueTime < new Date();
                const matchedLead = leads.find((l) => l.id === item.lead_id) || {
                  id: item.lead_id,
                  lead_number: item.lead_number,
                  name: item.lead_name,
                  phone: item.lead_phone,
                  company_name: item.lead_company,
                  status: item.lead_status,
                  assigned_to: item.owner_id,
                  assigned_to_name: item.owner_name
                };

                return (
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        isOverdue
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Due Soon'}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">
                            {item.lead_name}
                          </span>
                          {item.lead_company && (
                            <span className="text-[11px] text-slate-500">
                              ({item.lead_company})
                            </span>
                          )}
                          <span className="text-[11px] font-mono text-slate-400">
                            • {item.lead_phone}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{item.follow_up_type}</span>
                          {item.outcome && <span>• {item.outcome}</span>}
                          <span>• Scheduled for: <strong className="text-slate-800">{formatDateTime(item.next_follow_up_at || item.follow_up_at)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadForFollowUp(matchedLead);
                        setIsFollowUpModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded transition cursor-pointer self-start sm:self-center shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Follow-up Action</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Search & Status Filter Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
                Filter Status:
              </span>
              {['All', ...STATUS_OPTIONS].map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Search Input Bar */}
            <div className="relative min-w-[240px] sm:min-w-[300px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by client, company, service..."
                className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-4 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchLeads(false)} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Leads Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Client & Contact</th>
                <th className="py-3 px-4">Company / Business</th>
                <th className="py-3 px-4">Service & Scope</th>
                <th className="py-3 px-4">Estimated Budget</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <span className="text-xs font-medium">Loading inquiries pipeline...</span>
                  </td>
                </tr>
              ) : filteredLeads.length > 0 ? (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                    {/* 1. Name & Contact */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        {lead.lead_number && (
                          <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            #{lead.lead_number}
                          </span>
                        )}
                        <span>{lead.name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="truncate max-w-[140px] text-slate-400">
                            • {lead.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Company & Owner */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col items-start gap-0.5">
                        <div className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                          <span>{lead.company_name || 'Individual Client'}</span>
                        </div>
                        {lead.assigned_to_name ? (
                          <span className="text-[10px] text-slate-500 font-medium">
                            Owner: <span className="text-slate-700">{lead.assigned_to_name}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            Source: {lead.source || 'Direct'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Service Interest & Scope */}
                    <td className="py-3 px-4 max-w-[280px]">
                      <div className="text-xs font-medium text-slate-900 truncate">
                        {lead.service_interest || 'Custom Software Solution'}
                      </div>
                      {lead.requirement && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[260px] mt-0.5" title={lead.requirement}>
                          {lead.requirement}
                        </div>
                      )}
                    </td>

                    {/* 4. Budget / Value */}
                    <td className="py-3 px-4 font-semibold text-xs text-slate-700">
                      {lead.estimated_budget ? (
                        <span className="text-emerald-700 font-bold">
                          {formatCurrency(lead.estimated_budget)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">Negotiable</span>
                      )}
                    </td>

                    {/* 5. Pipeline Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead, e.target.value)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider outline-none border cursor-pointer ${
                          lead.status === 'Won'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lead.status === 'Lost'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : lead.status === 'Qualified'
                            ? 'bg-teal-50 text-teal-700 border-teal-200'
                            : lead.status === 'Quotation Sent'
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : lead.status === 'Negotiation'
                            ? 'bg-violet-50 text-violet-700 border-violet-200'
                            : lead.status === 'On Hold'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : lead.status === 'Contacted'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                      {lead.status === 'Lost' && lead.lost_reason && (
                        <p className="text-[10px] text-red-500 truncate max-w-[150px] mt-0.5" title={lead.lost_reason}>
                          {lead.lost_reason}
                        </p>
                      )}
                      {lead.status === 'On Hold' && lead.on_hold_reason && (
                        <p className="text-[10px] text-amber-600 truncate max-w-[150px] mt-0.5" title={lead.on_hold_reason}>
                          Hold: {lead.on_hold_reason}
                        </p>
                      )}
                      {lead.status === 'Won' && !lead.converted_client_id && (
                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setLeadToConvert(lead);
                              setIsConvertModalOpen(true);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-2xs transition cursor-pointer"
                            title="Convert Won Inquiry to Active Client"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Convert to Client</span>
                          </button>
                        </div>
                      )}
                      {lead.converted_client_id && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <UserCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Client #{lead.converted_client_number || 'Linked'}</span>
                          </span>
                        </div>
                      )}
                      {lead.next_follow_up_at && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            new Date(lead.next_follow_up_at) < new Date()
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <Clock className="w-2.5 h-2.5" />
                            <span>{new Date(lead.next_follow_up_at) < new Date() ? 'Overdue: ' : 'Next: '}</span>
                            <span>{formatDateTime(lead.next_follow_up_at)}</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* 6. Row Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedLeadForFollowUp(lead);
                            setIsFollowUpModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition cursor-pointer shadow-2xs mr-1"
                          title="Log & View Follow-ups"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                          <span className="hidden sm:inline">Follow-up</span>
                          {Number(lead.follow_ups_count) > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                              {lead.follow_ups_count}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsLeadModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                          title="Edit Inquiry Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setLeadToDelete(lead);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No client inquiries found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Register a new business lead or adjust your filter query.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lead Create / Edit Modal */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => {
          setIsLeadModalOpen(false);
          setEditingLead(null);
        }}
        lead={editingLead}
        onSuccess={fetchLeads}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setLeadToDelete(null);
        }}
        onConfirm={confirmDeleteLead}
        loading={deleting}
        title="Delete Inquiry Record"
        message={`Are you sure you want to permanently delete the inquiry for "${leadToDelete?.name}"? This action cannot be undone.`}
      />

      {/* Lost Reason Modal (replaces browser prompt) */}
      <LostReasonModal
        isOpen={isLostModalOpen}
        onClose={() => {
          setIsLostModalOpen(false);
          setLeadForLostStatus(null);
        }}
        onConfirm={handleConfirmLostReason}
        leadName={leadForLostStatus?.name}
        loading={updatingLost}
      />

      {/* On Hold Reason & Revisit Date Modal */}
      <OnHoldModal
        isOpen={isOnHoldModalOpen}
        onClose={() => {
          setIsOnHoldModalOpen(false);
          setLeadForOnHoldStatus(null);
        }}
        onConfirm={handleConfirmOnHold}
        leadName={leadForOnHoldStatus?.name}
        loading={updatingOnHold}
      />

      {/* Follow-up Logging & History Modal */}
      <FollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => {
          setIsFollowUpModalOpen(false);
          setSelectedLeadForFollowUp(null);
        }}
        lead={selectedLeadForFollowUp}
        assignees={assignees}
        onSuccess={() => {
          fetchLeads(false);
          fetchReminders();
        }}
      />

      {/* Convert Won Lead to Client Modal */}
      <ConvertToClientModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setLeadToConvert(null);
        }}
        lead={leadToConvert}
        onSuccess={fetchLeads}
      />
    </AppLayout>
  );
}
