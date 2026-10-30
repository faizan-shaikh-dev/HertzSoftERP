'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import quotationService from '@/services/quotationService';
import { useAuth } from '@/context/AuthContext';
import {
  FileSpreadsheet,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  FolderKanban,
  Trash2,
  Edit,
  Eye,
  GitBranch,
  Calendar,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Clock,
  XCircle,
  FileCheck,
  TrendingUp,
  Receipt,
  AlertCircle,
  Printer
} from 'lucide-react';
import {
  QuotationModal,
  QuotationPreviewModal,
  ConfirmDeleteModal
} from '@/components/modals';

const STATUS_OPTIONS = [
  'All',
  'Draft',
  'Sent',
  'Accepted',
  'Rejected',
  'Expired',
  'Superseded'
];

export default function QuotationsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [quotations, setQuotations] = useState([]);
  const [metrics, setMetrics] = useState({
    total_count: 0,
    total_value: 0,
    accepted_count: 0,
    accepted_value: 0,
    pending_count: 0,
    pending_value: 0,
    expired_count: 0,
    conversion_rate: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal States
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit' | 'revise'
  const [activeQuotation, setActiveQuotation] = useState(null);

  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewQuotation, setPreviewQuotation] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Quotations & Metrics
  const fetchData = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');

      const [quotesRes, metricsRes] = await Promise.all([
        quotationService.getQuotations(),
        quotationService.getQuotationMetrics().catch(() => null)
      ]);

      setQuotations(quotesRes.data || []);
      if (metricsRes?.data) {
        setMetrics(metricsRes.data);
      }

      if (isManual) {
        toast.success('Quotations and commercial metrics refreshed!');
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
      const msg = err.message || 'Could not fetch quotations. Check server connectivity.';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Status Change Handler
  const handleStatusChange = async (quotationId, newStatus) => {
    try {
      await quotationService.updateQuotationStatus(quotationId, newStatus);
      toast.success(`Quotation status updated to "${newStatus}".`);
      fetchData(false);
    } catch (err) {
      console.error('Failed to update quotation status:', err);
      toast.error(err.message || 'Failed to update quotation status.');
    }
  };

  // Delete Action Handler
  const confirmDeleteQuotation = async () => {
    if (!quotationToDelete) return;
    try {
      setDeleting(true);
      await quotationService.deleteQuotation(quotationToDelete.id);
      toast.success(`Quotation ${quotationToDelete.quotation_number} deleted.`);
      setIsDeleteModalOpen(false);
      setQuotationToDelete(null);
      fetchData(false);
    } catch (err) {
      console.error('Error deleting quotation:', err);
      toast.error(err.message || 'Failed to delete quotation.');
    } finally {
      setDeleting(false);
    }
  };

  // Open Preview Modal (fetch full details with items)
  const handleOpenPreview = async (quote) => {
    try {
      const fullQuote = await quotationService.getQuotationById(quote.id);
      setPreviewQuotation(fullQuote.data || fullQuote);
      setIsPreviewModalOpen(true);
    } catch (err) {
      toast.error('Failed to load quotation details.');
    }
  };

  // Open Edit or Revise Modal (fetch full details with items)
  const handleOpenEditOrRevise = async (quote, mode) => {
    try {
      const fullQuote = await quotationService.getQuotationById(quote.id);
      setActiveQuotation(fullQuote.data || fullQuote);
      setModalMode(mode);
      setIsQuotationModalOpen(true);
    } catch (err) {
      toast.error('Failed to load quotation details.');
    }
  };

  // Filtered Quotations
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      if (selectedStatus !== 'All' && q.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const numMatch = q.quotation_number?.toLowerCase().includes(query);
        const titleMatch = q.title?.toLowerCase().includes(query);
        const clientMatch = q.client_name?.toLowerCase().includes(query);
        const companyMatch = q.client_company?.toLowerCase().includes(query);

        if (!numMatch && !titleMatch && !clientMatch && !companyMatch) return false;
      }

      return true;
    });
  }, [quotations, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredQuotations.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredQuotations.slice(start, start + pageSize);
  }, [filteredQuotations, currentPage, pageSize]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
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
    <AppLayout title="Quotations & Commercial Proposals">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER OJT CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* Card Header (OJT Standard) */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[#4689C8]" />
                <span>Quotations & Commercial Proposals</span>
              </h2>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Create multi-item commercial proposals, track version revisions, and generate official client PDFs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveQuotation(null);
                  setModalMode('create');
                  setIsQuotationModalOpen(true);
                }}
                className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] rounded shadow-sm shadow-[#4689C8]/25 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quotation</span>
              </button>

              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh quotations ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-6">
            {/* Financial Metrics Cards (OJT Metric Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Total Proposals */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Total Proposals
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {formatCurrency(metrics.total_value)}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4689C8] to-[#5FC8D6] text-white flex items-center justify-center shadow-md shadow-[#4689C8]/25">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Drafted Quotes:</span>
                  <span className="font-bold text-[#172b4d]">{metrics.total_count} Proposals</span>
                </div>
              </div>

              {/* 2. Accepted Deals */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Accepted Deals
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {formatCurrency(metrics.accepted_value)}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Client Won:</span>
                  <span className="font-bold text-[#2dce89]">{metrics.accepted_count} Accepted</span>
                </div>
              </div>

              {/* 3. In Review / Pending */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      In Review / Sent
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {formatCurrency(metrics.pending_value)}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#fb6340] to-[#f5365c] text-white flex items-center justify-center shadow-md shadow-[#fb6340]/25">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Awaiting Decision:</span>
                  <span className="font-bold text-[#fb6340]">{metrics.pending_count} Quotes</span>
                </div>
              </div>

              {/* 4. Conversion Rate */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Conversion Rate
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {metrics.conversion_rate}%
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8965e0] to-[#5e72e4] text-white flex items-center justify-center shadow-md shadow-[#8965e0]/25">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Expired / Lost:</span>
                  <span className="font-bold text-[#8898aa]">{metrics.expired_count} Quotes</span>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex items-center justify-between text-[#f5365c] text-xs">
                <span>{error}</span>
                <button onClick={() => fetchData(false)} className="font-bold underline cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {/* DataTables Controls & Status Filter */}
            <div className="space-y-3 pt-2">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[#8898aa] font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">
                  Status:
                </span>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer shrink-0 ${
                      selectedStatus === st
                        ? 'bg-[#4689C8] text-white shadow-2xs'
                        : 'bg-white text-[#525f7f] border border-[#dee2e6] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* DataTables Toolbar: Show Entries & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-b border-[#dee2e6] py-3">
                {/* Show Entries */}
                <div className="flex items-center gap-2 text-xs text-[#525f7f] font-semibold">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#dee2e6] rounded text-xs font-bold text-[#172b4d] focus:outline-none focus:border-[#4689C8] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>

                {/* Search Box */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#525f7f] font-semibold">Search:</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search quote #, title, client..."
                      className="w-56 sm:w-64 pl-8 pr-7 py-1.5 text-xs bg-white border border-[#dee2e6] rounded text-[#172b4d] placeholder-[#8898aa] focus:outline-none focus:border-[#4689C8] transition"
                    />
                    <Search className="w-3.5 h-3.5 text-[#8898aa] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8898aa] hover:text-[#172b4d]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OJT Quotations Table */}
              <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                  <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Quote # & Version</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Client & Project</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Proposal Scope</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-right">Total Amount</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Validity Date</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center">Status</th>
                      <th className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {loading && quotations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#8898aa]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                          <span className="text-xs font-semibold">Loading commercial proposals...</span>
                        </td>
                      </tr>
                    ) : paginatedQuotations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#8898aa]">
                          <FileSpreadsheet className="w-8 h-8 mx-auto text-[#adb5bd] mb-2" />
                          <p className="text-xs font-semibold text-[#172b4d]">No quotations found matching your criteria</p>
                          <p className="text-[11px] text-[#8898aa] mt-0.5">
                            {searchQuery || selectedStatus !== 'All'
                              ? 'Try resetting the search or status filters.'
                              : 'Click "+ Create Quotation" above to draft the first estimate.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedQuotations.map((q, idx) => {
                        const isExpired = new Date(q.valid_until) < new Date() && q.status === 'Sent';

                        return (
                          <tr 
                            key={q.id} 
                            className={`hover:bg-[#f6f9fc] transition-colors ${
                              idx % 2 === 1 ? 'bg-[#fcfdfe]' : 'bg-white'
                            }`}
                          >
                            {/* 1. Quote Number & Version Badge */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <Link 
                                href={`/quotations/view?id=${q.id}`}
                                className="font-mono font-bold text-xs text-[#172b4d] hover:text-[#4689C8] transition inline-block"
                              >
                                {q.quotation_number}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30 font-mono">
                                  v{q.version}
                                </span>
                                {q.status === 'Superseded' && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    Superseded
                                  </span>
                                )}
                                <span className="text-[10px] text-[#8898aa] font-medium">
                                  {formatDate(q.quotation_date)}
                                </span>
                              </div>
                            </td>

                            {/* 2. Client & Project */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <div className="font-bold text-[#172b4d] text-xs flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#8898aa]" />
                                <span>{q.client_name}</span>
                              </div>
                              {q.client_company && (
                                <div className="text-[11px] text-[#525f7f] mt-0.5">
                                  {q.client_company}
                                </div>
                              )}
                              {q.project_title && (
                                <div className="text-[10px] text-[#4689C8] font-semibold flex items-center gap-1 mt-0.5">
                                  <FolderKanban className="w-3 h-3 text-[#4689C8]" />
                                  <Link
                                    href={`/projects/view?id=${q.project_id}`}
                                    className="truncate max-w-[180px] hover:underline"
                                  >
                                    {q.project_title}
                                  </Link>
                                </div>
                              )}
                            </td>

                            {/* 3. Proposal Scope */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <Link
                                href={`/quotations/view?id=${q.id}`}
                                className="text-xs font-semibold text-[#172b4d] hover:text-[#4689C8] transition line-clamp-1 block"
                                title={q.title}
                              >
                                {q.title}
                              </Link>
                              <div className="text-[10px] text-[#8898aa] mt-0.5">
                                {q.items_count || 1} line item(s) included
                              </div>
                            </td>

                            {/* 4. Total Amount */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-right">
                              <div className="font-mono font-bold text-xs text-[#172b4d]">
                                {formatCurrency(q.total_amount)}
                              </div>
                              <div className="text-[10px] text-[#8898aa]">
                                Sub: {formatCurrency(q.subtotal)}
                              </div>
                            </td>

                            {/* 5. Validity Date */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-xs">
                              <div className="flex items-center gap-1 text-[#525f7f]">
                                <Calendar className="w-3.5 h-3.5 text-[#8898aa]" />
                                <span>{formatDate(q.valid_until)}</span>
                              </div>
                              {isExpired && (
                                <div className="text-[10px] font-bold text-[#fb6340] mt-0.5 flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Expired</span>
                                </div>
                              )}
                            </td>

                            {/* 6. Status Selector Dropdown (OJT Colored Badges) */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-center">
                              <select
                                value={q.status}
                                disabled={q.status === 'Superseded'}
                                onChange={(e) => handleStatusChange(q.id, e.target.value)}
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border outline-none cursor-pointer transition ${
                                  q.status === 'Accepted'
                                    ? 'bg-[#e8f7ee] text-[#2dce89] border-[#2dce89]/30'
                                    : q.status === 'Sent'
                                    ? 'bg-[#f0f7fd] text-[#4689C8] border-[#4689C8]/30'
                                    : q.status === 'Draft'
                                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                                    : q.status === 'Rejected'
                                    ? 'bg-[#fdf2f2] text-[#f5365c] border-[#f5365c]/30'
                                    : q.status === 'Expired'
                                    ? 'bg-[#fef4e6] text-[#fb6340] border-[#fb6340]/30'
                                    : 'bg-purple-50 text-purple-700 border-purple-200 opacity-80 cursor-not-allowed'
                                }`}
                              >
                                <option value="Draft">Draft</option>
                                <option value="Sent">Sent</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Expired">Expired</option>
                                {q.status === 'Superseded' && <option value="Superseded">Superseded</option>}
                              </select>
                            </td>

                            {/* 7. Action Buttons */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Detailed View Page */}
                                <Link
                                  href={`/quotations/view?id=${q.id}`}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-[#f0f7fd] hover:bg-blue-100 border border-[#4689C8]/30 rounded shadow-2xs transition cursor-pointer"
                                  title="View Quotation Scope & Report"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </Link>

                                {/* PDF Preview */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(q)}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded shadow-2xs transition cursor-pointer"
                                  title="Preview & Download Official PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                {/* Revise Button (Only if not already Superseded) */}
                                {q.status !== 'Superseded' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditOrRevise(q, 'revise')}
                                    className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#8965e0] hover:bg-[#724ec7] rounded shadow-2xs transition cursor-pointer"
                                    title="Create Revised Version (vX)"
                                  >
                                    <GitBranch className="w-3.5 h-3.5" />
                                    <span>Revise</span>
                                  </button>
                                )}

                                {/* Edit Button (Only Drafts) */}
                                {q.status === 'Draft' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditOrRevise(q, 'edit')}
                                    className="p-1 rounded text-[#525f7f] hover:text-[#4689C8] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                                    title="Edit Draft"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Admin Delete */}
                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setQuotationToDelete(q);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1 rounded text-[#525f7f] hover:text-[#f5365c] hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                                    title="Delete Quotation"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* OJT Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-[#525f7f]">
                <div>
                  Showing{' '}
                  <span className="font-bold text-[#172b4d]">
                    {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-[#172b4d]">
                    {Math.min(currentPage * pageSize, totalEntries)}
                  </span>{' '}
                  of <span className="font-bold text-[#172b4d]">{totalEntries}</span> quotations
                </div>

                <div className="flex items-center border border-[#dee2e6] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] disabled:bg-[#fcfcfd] disabled:text-[#adb5bd] border-r border-[#dee2e6] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 border-r border-[#dee2e6] font-bold transition cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#4689C8] text-white'
                          : 'bg-white text-[#525f7f] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] disabled:bg-[#fcfcfd] disabled:text-[#adb5bd] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create / Edit / Revise Quotation Modal */}
      <QuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => {
          setIsQuotationModalOpen(false);
          setActiveQuotation(null);
        }}
        quotation={activeQuotation}
        mode={modalMode}
        onSuccess={() => fetchData(false)}
      />

      {/* Official Printable Preview Modal */}
      <QuotationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewQuotation(null);
        }}
        quotation={previewQuotation}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setQuotationToDelete(null);
        }}
        onConfirm={confirmDeleteQuotation}
        loading={deleting}
        title="Delete Commercial Quotation"
        message={`Are you sure you want to permanently delete quotation ${quotationToDelete?.quotation_number} (v${quotationToDelete?.version}) for ${quotationToDelete?.client_name}? This action cannot be undone.`}
      />
    </AppLayout>
  );
}
