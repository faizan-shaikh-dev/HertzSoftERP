'use client';

import { useState, useEffect, useMemo } from 'react';
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
  AlertCircle
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
  const itemsPerPage = 10;

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
        toast.success('Quotations and conversion metrics refreshed!');
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
  const totalPages = Math.ceil(filteredQuotations.length / itemsPerPage) || 1;
  const paginatedQuotations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredQuotations.slice(start, start + itemsPerPage);
  }, [filteredQuotations, currentPage, itemsPerPage]);

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
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-5 rounded-lg border border-blue-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quotations & Commercial Proposals</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create multi-item estimates, preserve revisions with versioning, and download official client PDFs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchData(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setActiveQuotation(null);
              setModalMode('create');
              setIsQuotationModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Quotes Generated */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Proposals</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">
              {formatCurrency(metrics.total_value)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.total_count} quotes drafted</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        {/* Value of Accepted Quotes */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Accepted Deals</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(metrics.accepted_value)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.accepted_count} client accepted</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending / In Review */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">In Review / Sent</p>
            <h3 className="text-xl font-extrabold text-blue-600 mt-1">
              {formatCurrency(metrics.pending_value)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">{metrics.pending_count} awaiting decision</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Win / Acceptance Rate */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acceptance Rate</p>
            <h3 className="text-xl font-extrabold text-indigo-600 mt-1">
              {metrics.conversion_rate}%
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Won vs Total ratio</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Quotations Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Header Toolbar (Clean, No Scrollbar) */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search & Status Selector Group */}
            <div className="flex flex-1 flex-wrap sm:flex-nowrap items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[240px] max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search quote #, proposal title, or client..."
                  className="w-full pl-9 pr-8 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter Dropdown */}
              <div className="relative min-w-[170px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8.5 pr-8 py-2 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none transition cursor-pointer appearance-none shadow-2xs"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st === 'All' ? 'All Statuses' : st}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Reset filter action */}
              {(selectedStatus !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedStatus('All');
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Results Count Badge */}
            <div className="text-xs text-slate-500 font-medium shrink-0">
              Showing <span className="font-bold text-slate-800">{filteredQuotations.length}</span> of {quotations.length} quotes
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-4 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchData(false)} className="font-bold underline cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {/* Quotations Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Quote # & Version</th>
                <th className="py-3 px-4">Client & Project</th>
                <th className="py-3 px-4 min-w-[200px]">Proposal Title</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Validity Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && quotations.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <span className="text-xs font-medium">Loading commercial quotations...</span>
                  </td>
                </tr>
              ) : paginatedQuotations.length > 0 ? (
                paginatedQuotations.map((q) => {
                  const isExpired = new Date(q.valid_until) < new Date() && q.status === 'Sent';

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Quote Number & Version Badge */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {q.quotation_number}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                            v{q.version}
                          </span>
                          {q.status === 'Superseded' && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                              Superseded
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-medium">
                            {formatDate(q.quotation_date)}
                          </span>
                        </div>
                      </td>

                      {/* 2. Client & Project */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{q.client_name}</span>
                        </div>
                        {q.client_company && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {q.client_company}
                          </div>
                        )}
                        {q.project_title && (
                          <div className="text-[10px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                            <FolderKanban className="w-3 h-3 text-indigo-400" />
                            <span className="truncate max-w-[180px]">{q.project_title}</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Proposal Title */}
                      <td className="py-3 px-4">
                        <div className="text-xs font-semibold text-slate-800 line-clamp-1" title={q.title}>
                          {q.title}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {q.items_count || 1} line item(s) included
                        </div>
                      </td>

                      {/* 4. Total Amount */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          {formatCurrency(q.total_amount)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: {formatCurrency(q.subtotal)}
                        </div>
                      </td>

                      {/* 5. Validity Date */}
                      <td className="py-3 px-4 text-xs">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(q.valid_until)}</span>
                        </div>
                        {isExpired && (
                          <div className="text-[10px] font-bold text-amber-600 mt-0.5 flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />
                            <span>Expired</span>
                          </div>
                        )}
                      </td>

                      {/* 6. Status Selector Dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={q.status}
                          disabled={q.status === 'Superseded'}
                          onChange={(e) => handleStatusChange(q.id, e.target.value)}
                          className={`px-2 py-1 text-[11px] font-bold uppercase rounded border outline-none cursor-pointer ${
                            q.status === 'Accepted'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : q.status === 'Sent'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : q.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700 border-slate-200'
                              : q.status === 'Rejected'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : q.status === 'Expired'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
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
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View / Print PDF */}
                          <button
                            onClick={() => handleOpenPreview(q)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                            title="Preview / Print PDF"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>

                          {/* Revise Button (Only if not already Superseded) */}
                          {q.status !== 'Superseded' && (
                            <button
                              onClick={() => handleOpenEditOrRevise(q, 'revise')}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors cursor-pointer"
                              title="Create Revised Version (vX)"
                            >
                              <GitBranch className="w-3.5 h-3.5" />
                              <span>Revise</span>
                            </button>
                          )}

                          {/* Edit Button (Only Drafts) */}
                          {q.status === 'Draft' && (
                            <button
                              onClick={() => handleOpenEditOrRevise(q, 'edit')}
                              className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Edit Draft"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setQuotationToDelete(q);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
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
              ) : (
                <tr>
                  <td colSpan="7" className="py-16 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No quotations found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                      {searchQuery || selectedStatus !== 'All'
                        ? 'Try clearing your search or status filters.'
                        : 'Generate your first commercial quotation for a client.'}
                    </p>
                    {!searchQuery && selectedStatus === 'All' && (
                      <button
                        onClick={() => {
                          setActiveQuotation(null);
                          setModalMode('create');
                          setIsQuotationModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create Quotation</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredQuotations.length > itemsPerPage && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredQuotations.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredQuotations.length}</span> quotes
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
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

