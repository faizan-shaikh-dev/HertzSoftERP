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
        {/* MASTER CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#DFEAF2] rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#DFEAF2] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0 flex items-center gap-2">
                <FileSpreadsheet className="w-6 h-6 text-[#4689C8]" />
                <span>Quotations & Commercial Proposals</span>
              </h2>
              <p className="text-xs text-[#71869B] mt-0.5">
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
                className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Quotation</span>
              </button>

              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#71869B] bg-white hover:bg-[#EAF3FB] hover:text-[#4689C8] border border-[#DFEAF2] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh quotations ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0077B6]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-6">
            {/* Financial Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {/* 1. Total Proposals */}
              <div className="bg-white border border-[#DFEAF2] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#71869B]">
                      Total Proposals
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#19324D] tracking-tight mt-1 font-mono">
                      {formatCurrency(metrics.total_value)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#EAF3FB] border border-[#0077B6]/20 text-[#0077B6] flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5 text-[#0077B6]" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DFEAF2] flex items-center justify-between text-xs text-[#71869B]">
                  <span>Drafted Quotes:</span>
                  <span className="font-bold text-[#19324D]">{metrics.total_count} Proposals</span>
                </div>
              </div>

              {/* 2. Accepted Deals */}
              <div className="bg-white border border-[#DFEAF2] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#71869B]">
                      Accepted Deals
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#20A36B] tracking-tight mt-1 font-mono">
                      {formatCurrency(metrics.accepted_value)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#EAF8F1] border border-[#20A36B]/20 text-[#20A36B] flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-[#20A36B]" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DFEAF2] flex items-center justify-between text-xs text-[#71869B]">
                  <span>Client Won:</span>
                  <span className="font-bold text-[#20A36B]">{metrics.accepted_count} Accepted</span>
                </div>
              </div>

              {/* 3. In Review / Pending */}
              <div className="bg-white border border-[#DFEAF2] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#71869B]">
                      In Review / Sent
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#FB6340] tracking-tight mt-1 font-mono">
                      {formatCurrency(metrics.pending_value)}
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#FEF4E6] border border-[#FB6340]/20 text-[#FB6340] flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-[#FB6340]" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DFEAF2] flex items-center justify-between text-xs text-[#71869B]">
                  <span>Awaiting Decision:</span>
                  <span className="font-bold text-[#FB6340]">{metrics.pending_count} Quotes</span>
                </div>
              </div>

              {/* 4. Conversion Rate */}
              <div className="bg-white border border-[#DFEAF2] rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#71869B]">
                      Conversion Rate
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold text-[#0077B6] tracking-tight mt-1 font-mono">
                      {metrics.conversion_rate}%
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[#EAF3FB] border border-[#0077B6]/20 text-[#0077B6] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#0077B6]" />
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#DFEAF2] flex items-center justify-between text-xs text-[#71869B]">
                  <span>Expired / Lost:</span>
                  <span className="font-bold text-[#71869B]">{metrics.expired_count} Quotes</span>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-md bg-[#FDF2F2] border border-[#F5365C]/30 flex items-center justify-between text-[#F5365C] text-xs">
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
                <span className="text-[#71869B] font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">
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
                        ? 'bg-[#4689C8] text-white shadow-xs'
                        : 'bg-white text-[#71869B] border border-[#DFEAF2] hover:bg-[#EAF3FB] hover:text-[#4689C8]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* DataTables Toolbar: Show Entries & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-b border-[#DFEAF2] py-3">
                {/* Show Entries */}
                <div className="flex items-center gap-2 text-xs text-[#71869B] font-semibold">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#DFEAF2] rounded text-xs font-bold text-[#19324D] focus:outline-none focus:border-[#4689C8] cursor-pointer"
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
                  <span className="text-xs text-[#71869B] font-semibold">Search:</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search quote #, title, client..."
                      className="w-56 sm:w-64 pl-8 pr-7 py-1.5 text-xs bg-white border border-[#DFEAF2] rounded text-[#19324D] placeholder-[#71869B] focus:outline-none focus:border-[#4689C8] transition"
                    />
                    <Search className="w-3.5 h-3.5 text-[#71869B] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#71869B] hover:text-[#19324D]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quotations Table */}
              <div className="w-full overflow-x-auto border border-[#DFEAF2] rounded-md shadow-xs bg-white">
                <table className="table table-hover table-striped table-bordered w-full min-w-[980px] text-xs text-left">
                  <thead className="thead-light bg-[#EAF3FB] text-[#19324D] text-[11px] font-bold uppercase tracking-wider border-b border-[#DFEAF2]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[150px] whitespace-nowrap">Quote # &amp; Version</th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[200px]">Client &amp; Project</th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[220px]">Proposal Scope</th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[130px] whitespace-nowrap text-right">Total Amount</th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[120px] whitespace-nowrap">Validity Date</th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[120px] whitespace-nowrap text-center">Status</th>
                      <th className="py-3 px-3.5 min-w-[170px] whitespace-nowrap text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFEAF2]">
                    {loading && quotations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#71869B]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                          <span className="text-xs font-semibold">Loading commercial proposals...</span>
                        </td>
                      </tr>
                    ) : paginatedQuotations.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-[#71869B]">
                          <FileSpreadsheet className="w-8 h-8 mx-auto text-[#71869B] mb-2" />
                          <p className="text-xs font-semibold text-[#19324D]">No quotations found matching your criteria</p>
                          <p className="text-[11px] text-[#71869B] mt-0.5">
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
                            className={`transition-colors duration-150 ${
                              idx % 2 === 1 ? 'bg-[#F8FAFD]' : 'bg-white'
                            } hover:bg-[#EAF3FB]`}
                          >
                            {/* 1. Quote Number & Version Badge */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              <Link 
                                href={`/quotations/view?id=${q.id}`}
                                className="font-mono font-bold text-xs text-[#19324D] hover:text-[#4689C8] transition inline-block"
                              >
                                {q.quotation_number}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#EAF3FB] text-[#4689C8] border border-[#4689C8]/30 font-mono">
                                  v{q.version}
                                </span>
                                {q.status === 'Superseded' && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                    Superseded
                                  </span>
                                )}
                                <span className="text-[10px] text-[#71869B] font-medium">
                                  {formatDate(q.quotation_date)}
                                </span>
                              </div>
                            </td>

                            {/* 2. Client & Project */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              <div className="font-bold text-[#19324D] text-xs flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#71869B]" />
                                <span>{q.client_name}</span>
                              </div>
                              {q.client_company && (
                                <div className="text-[11px] text-[#71869B] mt-0.5">
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
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              <Link
                                href={`/quotations/view?id=${q.id}`}
                                className="text-xs font-semibold text-[#19324D] hover:text-[#4689C8] transition line-clamp-1 block"
                                title={q.title}
                              >
                                {q.title}
                              </Link>
                              <div className="text-[10px] text-[#71869B] mt-0.5">
                                {q.items_count || 1} line item(s) included
                              </div>
                            </td>

                            {/* 4. Total Amount */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2] text-right">
                              <div className="font-mono font-bold text-xs text-[#19324D]">
                                {formatCurrency(q.total_amount)}
                              </div>
                              <div className="text-[10px] text-[#71869B]">
                                Sub: {formatCurrency(q.subtotal)}
                              </div>
                            </td>

                            {/* 5. Validity Date */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2] text-xs">
                              <div className="flex items-center gap-1 text-[#71869B]">
                                <Calendar className="w-3.5 h-3.5 text-[#71869B]" />
                                <span>{formatDate(q.valid_until)}</span>
                              </div>
                              {isExpired && (
                                <div className="text-[10px] font-bold text-[#FB6340] mt-0.5 flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3" />
                                  <span>Expired</span>
                                </div>
                              )}
                            </td>

                            {/* 6. Status Selector Dropdown */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2] text-center">
                              <select
                                value={q.status}
                                disabled={q.status === 'Superseded'}
                                onChange={(e) => handleStatusChange(q.id, e.target.value)}
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border outline-none cursor-pointer transition ${
                                  q.status === 'Accepted'
                                    ? 'bg-[#EAF8F1] text-[#20A36B] border-[#20A36B]/30'
                                    : q.status === 'Sent'
                                    ? 'bg-[#EAF3FB] text-[#4689C8] border-[#4689C8]/30'
                                    : q.status === 'Draft'
                                    ? 'bg-[#F4F8FC] text-[#71869B] border-[#DFEAF2]'
                                    : q.status === 'Rejected'
                                    ? 'bg-[#FDF2F2] text-[#F5365C] border-[#F5365C]/30'
                                    : q.status === 'Expired'
                                    ? 'bg-[#FEF4E6] text-[#FB6340] border-[#FB6340]/30'
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
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                {/* Detailed View Page */}
                                <Link
                                  href={`/quotations/view?id=${q.id}`}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-[#EAF3FB] hover:bg-[#4689C8] hover:text-white border border-[#4689C8]/30 rounded shadow-2xs transition cursor-pointer"
                                  title="View Quotation Scope & Report"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </Link>

                                {/* PDF Preview */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPreview(q)}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#5FC8D6] hover:bg-[#39AFC0] rounded shadow-2xs transition cursor-pointer"
                                  title="Preview & Download Official PDF"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>PDF</span>
                                </button>

                                {/* Revise Button */}
                                {q.status !== 'Superseded' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditOrRevise(q, 'revise')}
                                    className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#8965E0] hover:bg-[#724ec7] rounded shadow-2xs transition cursor-pointer"
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
                                    className="p-1 rounded text-[#71869B] hover:text-[#4689C8] hover:bg-[#EAF3FB] border border-transparent hover:border-[#DFEAF2] transition cursor-pointer"
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
                                    className="p-1 rounded text-[#71869B] hover:text-[#F5365C] hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
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

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-[#71869B]">
                <div>
                  Showing{' '}
                  <span className="font-bold text-[#19324D]">
                    {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-[#19324D]">
                    {Math.min(currentPage * pageSize, totalEntries)}
                  </span>{' '}
                  of <span className="font-bold text-[#19324D]">{totalEntries}</span> quotations
                </div>

                <div className="flex items-center border border-[#DFEAF2] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF3FB] hover:text-[#4689C8] disabled:bg-[#F4F8FC] disabled:text-[#71869B]/50 border-r border-[#DFEAF2] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 border-r border-[#DFEAF2] font-bold transition cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#4689C8] text-white'
                          : 'bg-white text-[#71869B] hover:bg-[#EAF3FB] hover:text-[#4689C8]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF3FB] hover:text-[#4689C8] disabled:bg-[#F4F8FC] disabled:text-[#71869B]/50 font-semibold transition cursor-pointer disabled:cursor-not-allowed"
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
