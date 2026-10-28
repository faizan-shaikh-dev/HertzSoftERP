'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import leadService from '@/services/leadService';
import { useAuth } from '@/context/AuthContext';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  Search, 
  Plus, 
  Filter, 
  ArrowUpDown, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Building2, 
  IndianRupee, 
  Loader2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle 
} from 'lucide-react';
import { LeadModal, ConfirmDeleteModal } from '@/components/modals';

const STATUS_OPTIONS = ['New', 'Contacted', 'In Discussion', 'Won', 'Lost'];

export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Student' | 'Client'
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch leads from backend
  const fetchLeads = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await leadService.getLeads();
      // res.data contains array of leads
      setLeads(res.data || []);
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
  }, []);

  // Quick Inline Status Update
  const handleStatusChange = async (leadId, newStatus) => {
    try {
      let lostReason = null;
      if (newStatus === 'Lost') {
        const inputReason = window.prompt('Please enter the reason for marking this lead as Lost (optional):');
        if (inputReason === null) {
          // User canceled the prompt, abort status change
          return;
        }
        lostReason = inputReason.trim() || 'Not specified';
      }

      await leadService.updateLeadStatus(leadId, { 
        status: newStatus,
        lost_reason: lostReason
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: newStatus, lost_reason: lostReason } : l))
      );
      toast.success(`Inquiry status updated to "${newStatus}"`);
    } catch (err) {
      console.error('Failed to update status:', err);
      toast.error(err.message || 'Failed to update pipeline status.');
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
      // Tab filter
      if (activeTab === 'Student' && lead.lead_type !== 'Student') return false;
      if (activeTab === 'Client' && lead.lead_type !== 'Client') return false;

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
  }, [leads, activeTab, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = leads.length;
    const students = leads.filter((l) => l.lead_type === 'Student').length;
    const clients = leads.filter((l) => l.lead_type === 'Client').length;
    const won = leads.filter((l) => l.status === 'Won').length;
    return { total, students, clients, won };
  }, [leads]);

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

  return (
    <AppLayout title="Leads & Inquiries Management">
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-5 rounded-lg border border-blue-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Centralized Inquiries Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage dual streams for student academic admissions and enterprise software contracts.
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
            <span>Register New Inquiry</span>
          </button>
        </div>
      </div>

      {/* Metric Counters Banner (template-hz style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Inquiries
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.total}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
            Student Stream
          </span>
          <div className="text-2xl font-black text-sky-900 mt-1">
            {metrics.students}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
            Client Proposals
          </span>
          <div className="text-2xl font-black text-indigo-900 mt-1">
            {metrics.clients}
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Won Deals / Enrolled
          </span>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {metrics.won}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Stream Tabs & Search Filter Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Stream Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/60 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('All')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'All'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>All ({metrics.total})</span>
              </button>

              <button
                onClick={() => setActiveTab('Student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'Student'
                    ? 'bg-white text-sky-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Students ({metrics.students})</span>
              </button>

              <button
                onClick={() => setActiveTab('Client')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'Client'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Clients ({metrics.clients})</span>
              </button>
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
                placeholder="Search by name, phone, course, company..."
                className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
              Status Filter:
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
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-4 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchLeads(false)} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Leads Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Inquiry & Contact</th>
                <th className="py-3 px-4">Stream & Source</th>
                <th className="py-3 px-4">Requirement / Course</th>
                <th className="py-3 px-4">Budget / Value</th>
                <th className="py-3 px-4">Pipeline Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && leads.length === 0 ? (
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
                      <div className="font-bold text-slate-900 text-xs">
                        {lead.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {lead.phone}
                        </span>
                        {lead.email && (
                          <span className="truncate max-w-[150px] text-slate-400">
                            • {lead.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 2. Stream & Source */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          lead.lead_type === 'Student'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                        }`}>
                          {lead.lead_type === 'Student' ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <Briefcase className="w-3 h-3" />
                          )}
                          {lead.lead_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {lead.source || 'Direct'}
                        </span>
                      </div>
                    </td>

                    {/* 3. Requirement / Course */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800">
                        {lead.service_interest || lead.requirement || 'General Inquiry'}
                      </div>
                      {lead.company_name && (
                        <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{lead.company_name}</span>
                        </div>
                      )}
                      {lead.requirement && lead.requirement !== lead.service_interest && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
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
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* 5. Pipeline Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider outline-none border cursor-pointer ${
                          lead.status === 'Won'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lead.status === 'Lost'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : lead.status === 'In Discussion'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : lead.status === 'Contacted'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {STATUS_OPTIONS.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </select>
                    </td>

                    {/* 6. Action Buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingLead(lead);
                            setIsLeadModalOpen(true);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit details"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => {
                              setLeadToDelete(lead);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete lead"
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
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No inquiries found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query or stream filters.
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
    </AppLayout>
  );
}

