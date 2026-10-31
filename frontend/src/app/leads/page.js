'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Sparkles,
  Eye,
  ExternalLink,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal
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

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOwner, setSelectedOwner] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [selectedFollowUpDue, setSelectedFollowUpDue] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      // 1. Status Filter
      if (selectedStatus !== 'All' && lead.status !== selectedStatus) return false;

      // 2. Owner Filter
      if (selectedOwner !== 'All') {
        if (lead.assigned_to !== selectedOwner && lead.assigned_to_name !== selectedOwner) {
          return false;
        }
      }

      // 3. Priority Filter
      if (selectedPriority !== 'All') {
        const p = lead.priority || 'Normal';
        if (p !== selectedPriority) return false;
      }

      // 4. Follow-up Due Date Filter
      if (selectedFollowUpDue !== 'All') {
        if (selectedFollowUpDue === 'overdue') {
          if (!lead.next_follow_up_at || new Date(lead.next_follow_up_at) >= new Date()) return false;
        } else if (selectedFollowUpDue === 'today') {
          if (!lead.next_follow_up_at) return false;
          const d = new Date(lead.next_follow_up_at);
          const now = new Date();
          const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          if (!isToday) return false;
        } else if (selectedFollowUpDue === 'upcoming') {
          if (!lead.next_follow_up_at) return false;
          const d = new Date(lead.next_follow_up_at);
          const now = new Date();
          const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          if (d <= now || d > sevenDays) return false;
        } else if (selectedFollowUpDue === 'none') {
          if (lead.next_follow_up_at) return false;
        }
      }

      // 5. Search query
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
  }, [leads, selectedStatus, selectedOwner, selectedPriority, selectedFollowUpDue, searchQuery]);

  // Sorted Leads
  const sortedLeads = useMemo(() => {
    const list = [...filteredLeads];
    const priorityWeights = { Urgent: 4, High: 3, Normal: 2, Low: 1 };

    list.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'priority') {
        aVal = priorityWeights[a.priority] || 2;
        bVal = priorityWeights[b.priority] || 2;
      } else if (sortField === 'estimated_budget') {
        aVal = Number(a.estimated_budget) || 0;
        bVal = Number(b.estimated_budget) || 0;
      } else if (sortField === 'created_at') {
        aVal = new Date(a.created_at || 0).getTime();
        bVal = new Date(b.created_at || 0).getTime();
      } else if (sortField === 'next_follow_up_at') {
        aVal = a.next_follow_up_at ? new Date(a.next_follow_up_at).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
        bVal = b.next_follow_up_at ? new Date(b.next_follow_up_at).getTime() : (sortDirection === 'asc' ? Infinity : -Infinity);
      } else {
        aVal = (aVal || '').toString().toLowerCase();
        bVal = (bVal || '').toString().toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [filteredLeads, sortField, sortDirection]);

  // Paginated Leads
  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedLeads.slice(start, start + itemsPerPage);
  }, [sortedLeads, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, selectedOwner, selectedPriority, selectedFollowUpDue, searchQuery, itemsPerPage]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const hasActiveFilters = 
    selectedStatus !== 'All' || 
    selectedOwner !== 'All' || 
    selectedPriority !== 'All' || 
    selectedFollowUpDue !== 'All' || 
    searchQuery.trim() !== '';

  const handleResetFilters = () => {
    setSelectedStatus('All');
    setSelectedOwner('All');
    setSelectedPriority('All');
    setSelectedFollowUpDue('All');
    setSearchQuery('');
  };

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
      {/* OJT Unified .mainCard Container */}
      <div className="card shadow-sm mb-4 bg-white border border-[#e9ecef] rounded-lg overflow-hidden min-h-[82vh]">
        {/* CARD HEADER (Exact OJT style: Title on left, Action buttons on right) */}
        <div className="card-header px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0">
              Leads Management
            </h2>
            <p className="text-xs text-[#8898aa] mt-0.5">
              Client Inquiries & Enterprise Deals Pipeline
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingLead(null);
                setIsLeadModalOpen(true);
              }}
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Lead</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#fb6340] hover:bg-[#eb4d2b] rounded shadow-sm transition cursor-pointer"
              title="Reset all search & filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="button"
              onClick={() => fetchLeads(true)}
              disabled={loading}
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Refresh records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* CARD BODY */}
        <div className="card-body p-4 sm:p-6 space-y-4">
          {/* Follow-up Reminders Alert Banner (if any) */}
          {reminders.totalCount > 0 && (
            <div className="border border-amber-200 bg-amber-50/60 rounded-md p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-amber-100 text-[#fb6340]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#172b4d]">Client Follow-up Reminders:</span>
                    {reminders.overdueCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5365c] text-white">
                        {reminders.overdueCount} Overdue
                      </span>
                    )}
                    {reminders.todayCount > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#fb6340] text-white">
                        {reminders.todayCount} Due Today
                      </span>
                    )}
                    {reminders.upcoming?.length > 0 && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#4689C8] text-white">
                        {reminders.upcoming.length} Upcoming
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRemindersList(!showRemindersList)}
                className="text-xs font-bold text-[#4689C8] hover:underline self-start sm:self-center cursor-pointer"
              >
                {showRemindersList ? 'Hide Reminders ▲' : `View Reminders (${reminders.totalCount}) ▼`}
              </button>
            </div>
          )}

          {/* Expanded Reminders List */}
          {showRemindersList && (
            <div className="p-3 bg-white border border-[#e9ecef] rounded-md divide-y divide-slate-100 max-h-60 overflow-y-auto">
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
                  <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase text-white ${
                        isOverdue ? 'bg-[#f5365c]' : 'bg-[#fb6340]'
                      }`}>
                        {isOverdue ? 'Overdue' : 'Due Soon'}
                      </span>
                      <strong className="text-[#172b4d]">{item.lead_name}</strong>
                      <span className="text-[#8898aa]">({item.lead_company || 'Individual'})</span>
                      <span className="text-[#8898aa] font-mono">• {item.lead_phone}</span>
                      <span className="text-[#525f7f]">• Scheduled: {formatDateTime(item.next_follow_up_at || item.follow_up_at)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLeadForFollowUp(matchedLead);
                        setIsFollowUpModalOpen(true);
                      }}
                      className="px-2 py-0.5 text-xs font-bold text-[#4689C8] hover:bg-blue-50 border border-blue-200 rounded cursor-pointer"
                    >
                      Action
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* OJT Top Controls Toolbar (DataTables Style) */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#e9ecef]">
            {/* Left: Show Entries & Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Show Entries Dropdown (Fixed 10 rows per page default) */}
              <div className="flex items-center gap-1.5 text-xs text-[#8898aa]">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="text-xs px-2 py-1 bg-white border border-[#e9ecef] rounded text-[#172b4d] font-bold outline-none focus:border-[#4689C8] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>entries</span>
              </div>

              <div className="h-4 w-[1px] bg-[#e9ecef] hidden sm:block" />

              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8898aa] mr-0.5">
                Filter:
              </span>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs px-2.5 py-1 bg-white border border-[#e9ecef] rounded text-[#525f7f] font-medium outline-none focus:border-[#4689C8] cursor-pointer"
              >
                <option value="All">Status (All)</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>

              {/* Owner Filter */}
              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value)}
                className="text-xs px-2.5 py-1 bg-white border border-[#e9ecef] rounded text-[#525f7f] font-medium outline-none focus:border-[#4689C8] cursor-pointer"
              >
                <option value="All">Owner (All)</option>
                {assignees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                ))}
              </select>

              {/* Priority Filter */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs px-2.5 py-1 bg-white border border-[#e9ecef] rounded text-[#525f7f] font-medium outline-none focus:border-[#4689C8] cursor-pointer"
              >
                <option value="All">Priority (All)</option>
                <option value="Urgent">Urgent Priority</option>
                <option value="High">High Priority</option>
                <option value="Normal">Normal Priority</option>
                <option value="Low">Low Priority</option>
              </select>

              {/* Follow-up Due Filter */}
              <select
                value={selectedFollowUpDue}
                onChange={(e) => setSelectedFollowUpDue(e.target.value)}
                className="text-xs px-2.5 py-1 bg-white border border-[#e9ecef] rounded text-[#525f7f] font-medium outline-none focus:border-[#4689C8] cursor-pointer"
              >
                <option value="All">Follow-ups (All)</option>
                <option value="overdue">🚨 Overdue</option>
                <option value="today">⏰ Due Today</option>
                <option value="upcoming">📅 Upcoming</option>
                <option value="none">No Follow-up</option>
              </select>
            </div>

            {/* Right: Search Box */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8898aa] font-medium">Search:</span>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Client, phone, company..."
                  className="text-xs pl-3 pr-7 py-1.5 bg-white border border-[#e9ecef] rounded text-[#172b4d] placeholder-[#adb5bd] outline-none focus:border-[#4689C8] w-56 sm:w-64"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1 text-sm text-[#8898aa] hover:text-[#172b4d] cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => fetchLeads(false)} className="font-bold underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {/* OJT TABLE: table-striped table-bordered table-hover table-sm */}
          <div className="table-responsive overflow-x-auto border border-[#e9ecef] rounded">
            <table className="w-full text-left text-xs text-[#525f7f] border-collapse">
              <thead className="thead-light bg-[#f6f9fc] border-b-2 border-[#e9ecef] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3.5 border-r border-[#e9ecef] text-center w-16">Sr #</th>
                  <th 
                    onClick={() => handleSort('name')}
                    className="py-3 px-3.5 border-r border-[#e9ecef] cursor-pointer select-none hover:text-[#172b4d]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Client & Contact</span>
                      {sortField === 'name' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#4689C8]" /> : <ArrowDown className="w-3 h-3 text-[#4689C8]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3.5 border-r border-[#e9ecef]">Service &amp; Scope</th>
                  <th 
                    onClick={() => handleSort('status')}
                    className="py-3 px-3.5 border-r border-[#e9ecef] cursor-pointer select-none hover:text-[#172b4d]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Pipeline Status</span>
                      {sortField === 'status' ? (
                        sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-[#4689C8]" /> : <ArrowDown className="w-3 h-3 text-[#4689C8]" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#adb5bd]" />
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e9ecef]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-[#8898aa]">
                      <Loader2 className="w-7 h-7 animate-spin text-[#4689C8] mx-auto mb-2" />
                      <span className="text-xs font-medium">Loading inquiries from database...</span>
                    </td>
                  </tr>
                ) : paginatedLeads.length > 0 ? (
                  paginatedLeads.map((lead, idx) => (
                    <tr 
                      key={lead.id} 
                      className={`transition-colors duration-150 ${
                        idx % 2 === 1 ? 'bg-[#f4f6f8]' : 'bg-white'
                      } hover:bg-[#eaf2fc]`}
                    >
                      {/* 1. Sr # / Lead Number */}
                      <td className="py-2.5 px-3 border-r border-[#e9ecef] text-center font-bold text-[#172b4d]">
                        <Link 
                          href={`/leads/view?id=${lead.id}`}
                          className="font-mono text-[11px] text-[#4689C8] hover:underline font-bold"
                          title="View Lead Pipeline & Activity History"
                        >
                          #{lead.lead_number || ((currentPage - 1) * itemsPerPage + idx + 1)}
                        </Link>
                      </td>

                      {/* 2. Client & Contact */}
                      <td className="py-2.5 px-3 border-r border-[#e9ecef]">
                        <div className="font-bold text-[#172b4d] text-xs">
                          <Link 
                            href={`/leads/view?id=${lead.id}`}
                            className="hover:text-[#4689C8] hover:underline transition"
                            title="View Lead Pipeline & Activity History"
                          >
                            {lead.name}
                          </Link>
                        </div>
                        {lead.company_name && (
                          <div className="text-[11px] text-[#525f7f] font-medium flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-[#4689C8] flex-shrink-0" />
                            <span>{lead.company_name}</span>
                          </div>
                        )}
                        {lead.phone && (() => {
                          const cleanDigits = String(lead.phone).replace(/\D/g, '');
                          const waPhone = cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits;
                          return (
                            <a
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-0.5 text-[11px] font-mono text-[#25D366] hover:text-[#1ebe57] font-semibold hover:underline transition"
                              title="Click to chat on WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                              <span>{lead.phone}</span>
                            </a>
                          );
                        })()}
                        {lead.email && (
                          <div className="text-[10px] text-[#adb5bd] truncate max-w-[150px]">
                            {lead.email}
                          </div>
                        )}
                      </td>


                      {/* 4. Service & Requirement */}
                      <td className="py-2.5 px-3 border-r border-[#e9ecef] max-w-[260px]">
                        <div className="text-xs font-semibold text-[#172b4d] truncate">
                          {lead.service_interest || 'Custom Software Solution'}
                        </div>
                        {lead.requirement && (
                          <div className="text-[11px] text-[#8898aa] truncate max-w-[240px] mt-0.5" title={lead.requirement}>
                            {lead.requirement}
                          </div>
                        )}
                      </td>


                      {/* 6. Pipeline Status (Exact OJT Badge Dropdown) */}
                      <td className="py-2.5 px-3 border-r border-[#e9ecef]">
                        <div className="flex flex-col items-start gap-1">
                          <select
                            value={lead.status}
                            onChange={(e) => handleStatusChange(lead, e.target.value)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider outline-none border cursor-pointer ${
                              lead.status === 'Won'
                                ? 'bg-[#2dce89] text-white border-[#2dce89]'
                                : lead.status === 'Lost'
                                ? 'bg-[#f5365c] text-white border-[#f5365c]'
                                : lead.status === 'New'
                                ? 'bg-[#fb6340] text-white border-[#fb6340]'
                                : lead.status === 'Contacted'
                                ? 'bg-[#11cdef] text-white border-[#11cdef]'
                                : lead.status === 'Qualified'
                                ? 'bg-[#4689C8] text-white border-[#4689C8]'
                                : lead.status === 'Quotation Sent'
                                ? 'bg-[#5603ad] text-white border-[#5603ad]'
                                : lead.status === 'Negotiation'
                                ? 'bg-[#8965e0] text-white border-[#8965e0]'
                                : 'bg-[#ffbb33] text-[#212529] border-[#ffbb33]'
                            }`}
                          >
                            {STATUS_OPTIONS.map((st) => (
                              <option key={st} value={st} className="bg-white text-[#172b4d] font-normal">
                                {st}
                              </option>
                            ))}
                          </select>

                          {lead.status === 'Lost' && lead.lost_reason && (
                            <p className="text-[10px] text-[#f5365c] truncate max-w-[140px]" title={lead.lost_reason}>
                              {lead.lost_reason}
                            </p>
                          )}
                          {lead.status === 'On Hold' && lead.on_hold_reason && (
                            <p className="text-[10px] text-[#fb6340] truncate max-w-[140px]" title={lead.on_hold_reason}>
                              Hold: {lead.on_hold_reason}
                            </p>
                          )}
                          {lead.status === 'Won' && !lead.converted_client_id && (
                            <button
                              type="button"
                              onClick={() => {
                                setLeadToConvert(lead);
                                setIsConvertModalOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold text-white bg-[#2dce89] hover:bg-[#229c68] shadow-2xs transition cursor-pointer"
                              title="Convert Won Inquiry to Active Client"
                            >
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>Convert</span>
                            </button>
                          )}
                          {lead.converted_client_id && (
                            <Link
                              href={`/projects?search=${encodeURIComponent(lead.name || '')}`}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#e8f7ee] text-[#2dce89] hover:bg-[#d4f2e0] border border-[#2dce89]/30 transition shadow-2xs"
                              title="View Project Contracts for this Client"
                            >
                              <UserCheck className="w-2.5 h-2.5 text-[#2dce89]" />
                              <span>Client #{lead.converted_client_number || 'Linked'}</span>
                            </Link>
                          )}
                        </div>
                      </td>

                      {/* 7. Action Buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* View Lead Pipeline & Activity History */}
                          <Link
                            href={`/leads/view?id=${lead.id}`}
                            className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold text-[#4689C8] bg-[#f0f7fd] hover:bg-[#e0effa] border border-[#4689C8]/30 transition shadow-2xs"
                            title="View Lead Pipeline & Activity History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </Link>

                          <button
                            onClick={() => {
                              setEditingLead(lead);
                              setIsLeadModalOpen(true);
                            }}
                            className="p-1.5 rounded text-[#4689C8] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                            title="Edit Inquiry Details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setLeadToDelete(lead);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded text-[#f5365c] hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-16 text-center text-[#8898aa]">
                      <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="text-xs font-bold text-[#172b4d]">No client inquiries found</p>
                      <p className="text-[11px] text-[#8898aa] mt-0.5">
                        Register a new business lead or adjust your filter query.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* OJT PAGINATION TOOLBAR (DataTables Style) */}
          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#525f7f]">
            <div>
              <span>
                Showing <strong className="text-[#172b4d]">{sortedLeads.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</strong> to{' '}
                <strong className="text-[#172b4d]">{Math.min(currentPage * itemsPerPage, sortedLeads.length)}</strong> of{' '}
                <strong className="text-[#172b4d]">{sortedLeads.length}</strong> entries
                {sortedLeads.length !== leads.length && (
                  <span className="text-[#8898aa] ml-1">(filtered from {leads.length} total entries)</span>
                )}
              </span>
            </div>

            {/* Page navigation (Exact OJT Bootstrap pagination buttons) */}
            <div className="flex items-center self-center">
              <nav aria-label="Table pagination">
                <ul className="inline-flex items-center -space-x-px text-xs rounded border border-[#dee2e6] overflow-hidden bg-white shadow-2xs">
                  <li>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 border-r border-[#dee2e6] bg-white text-[#525f7f] hover:bg-[#f6f9fc] hover:text-[#4689C8] disabled:text-[#adb5bd] disabled:bg-[#fcfcfd] disabled:cursor-not-allowed font-medium transition cursor-pointer"
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                    if (
                      pg === 1 || 
                      pg === totalPages || 
                      (pg >= currentPage - 1 && pg <= currentPage + 1)
                    ) {
                      const isActive = currentPage === pg;
                      return (
                        <li key={pg}>
                          <button
                            type="button"
                            onClick={() => setCurrentPage(pg)}
                            className={`px-3.5 py-1.5 border-r border-[#dee2e6] text-xs font-bold transition cursor-pointer ${
                              isActive
                                ? 'bg-[#4689C8] text-white'
                                : 'bg-white text-[#525f7f] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                            }`}
                          >
                            {pg}
                          </button>
                        </li>
                      );
                    } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                      return (
                        <li key={pg} className="px-2 py-1.5 border-r border-[#dee2e6] text-[#adb5bd] bg-[#fcfcfd]">
                          ...
                        </li>
                      );
                    }
                    return null;
                  })}

                  <li>
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white text-[#525f7f] hover:bg-[#f6f9fc] hover:text-[#4689C8] disabled:text-[#adb5bd] disabled:bg-[#fcfcfd] disabled:cursor-not-allowed font-medium transition cursor-pointer"
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
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
