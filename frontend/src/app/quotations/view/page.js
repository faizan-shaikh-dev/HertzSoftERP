'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Building2, 
  FolderKanban, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Printer, 
  GitBranch, 
  Trash2, 
  Receipt, 
  ExternalLink,
  User,
  Mail,
  Phone,
  FileCheck,
  Percent,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import quotationService from '@/services/quotationService';
import { 
  QuotationModal, 
  QuotationPreviewModal, 
  ConfirmDeleteModal,
  TaxInvoiceModal
} from '@/components/modals';
import { useAuth } from '@/context/AuthContext';

function QuotationViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  // Support ?id=... or ?quotation_id=...
  const quotationId = searchParams.get('id') || searchParams.get('quotation_id');

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'revise'
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isTaxInvoiceOpen, setIsTaxInvoiceOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch Quotation Details
  const fetchQuotationDetails = useCallback(async () => {
    if (!quotationId) {
      setLoading(false);
      setError('No Quotation ID provided in URL.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await quotationService.getQuotationById(quotationId);
      if (res.data || res) {
        setQuotation(res.data || res);
      } else {
        setError('Quotation record not found or failed to load.');
      }
    } catch (err) {
      console.error('Error fetching quotation details:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  }, [quotationId]);

  useEffect(() => {
    fetchQuotationDetails();
  }, [fetchQuotationDetails]);

  // Status Change Handler
  const handleStatusChange = async (newStatus) => {
    if (!quotation) return;
    try {
      await quotationService.updateQuotationStatus(quotation.id, newStatus);
      toast.success(`Quotation status updated to "${newStatus}".`);
      fetchQuotationDetails();
    } catch (err) {
      console.error('Failed to update quotation status:', err);
      toast.error(err.message || 'Failed to update quotation status.');
    }
  };

  // Delete Action Handler
  const confirmDeleteQuotation = async () => {
    if (!quotation) return;
    try {
      setDeleting(true);
      await quotationService.deleteQuotation(quotation.id);
      toast.success(`Quotation ${quotation.quotation_number} deleted.`);
      setIsDeleteModalOpen(false);
      router.push('/quotations');
    } catch (err) {
      console.error('Error deleting quotation:', err);
      toast.error(err.message || 'Failed to delete quotation.');
    } finally {
      setDeleting(false);
    }
  };

  // Format currency in Indian Rupees
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(val));
  };

  // Format date
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

  const isExpired = quotation?.valid_until && new Date(quotation.valid_until) < new Date() && quotation.status === 'Sent';

  // Validity calculation
  const getValidityDays = () => {
    if (!quotation?.valid_until) return null;
    const diffTime = new Date(quotation.valid_until) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };
  const validityDays = getValidityDays();

  return (
    <AppLayout title="Quotation Details & Scope Report">
      <div className="container-fluid px-0 sm:px-2">
        {/* MAIN MASTER OJT CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* OJT Card Header with Back Button and Actions */}
          <div className="card-header bg-white border-b border-[#e9ecef] py-4 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/quotations')}
                className="btn btn-sm inline-flex items-center justify-center w-9 h-9 rounded bg-[#4689C8] hover:bg-[#3876b0] text-white shadow-xs transition cursor-pointer flex-shrink-0"
                title="Back to Quotations Ledger"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0">
                    Quotation Details & Scope Report
                  </h2>
                  {quotation && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-[#172b4d] border border-slate-300">
                        {quotation.quotation_number}
                      </span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30">
                        v{quotation.version}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        quotation.status === 'Accepted'
                          ? 'bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30'
                          : quotation.status === 'Sent'
                          ? 'bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30'
                          : quotation.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : quotation.status === 'Rejected'
                          ? 'bg-[#fdf2f2] text-[#f5365c] border border-[#f5365c]/30'
                          : quotation.status === 'Expired'
                          ? 'bg-[#fef4e6] text-[#fb6340] border border-[#fb6340]/30'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {quotation.status}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#8898aa] mt-0.5">
                  Official commercial proposal breakdown, deliverables scope, and version audit ledger.
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons (OJT Style) */}
            {quotation && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tax Invoice Button */}
                <button
                  type="button"
                  onClick={() => setIsTaxInvoiceOpen(true)}
                  className={`btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded shadow-xs transition cursor-pointer ${
                    quotation.status === 'Accepted'
                      ? 'bg-gradient-to-r from-[#2dce89] to-[#24a46d] hover:opacity-90 text-white'
                      : 'bg-white hover:bg-[#f6f9fc] text-[#525f7f] border border-[#dee2e6]'
                  }`}
                  title="View and Print Official GST Tax Invoice"
                >
                  <FileText className={`w-3.5 h-3.5 ${quotation.status === 'Accepted' ? 'text-white' : 'text-[#4689C8]'}`} />
                  <span>{quotation.status === 'Accepted' ? 'Tax Invoice' : 'Tax Invoice Preview'}</span>
                </button>

                {/* Print / PDF Button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded shadow-xs transition cursor-pointer"
                  title="Generate or Print Official PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF / Print</span>
                </button>

                {/* Revise Version (Only if not superseded) */}
                {quotation.status !== 'Superseded' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('revise');
                      setIsQuotationModalOpen(true);
                    }}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#8965e0] hover:bg-[#724ec7] rounded shadow-xs transition cursor-pointer"
                    title="Create next version (vX)"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Revise (v{Number(quotation.version || 1) + 1})</span>
                  </button>
                )}

                {/* Edit Button (Draft Only) */}
                {quotation.status === 'Draft' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('edit');
                      setIsQuotationModalOpen(true);
                    }}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#dee2e6] rounded shadow-xs transition cursor-pointer"
                    title="Edit Draft Details"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#4689C8]" />
                    <span>Edit Draft</span>
                  </button>
                )}

                {/* Status Selector Dropdown */}
                <div className="inline-flex items-center gap-1">
                  <select
                    value={quotation.status}
                    disabled={quotation.status === 'Superseded'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded border border-[#dee2e6] bg-white text-[#172b4d] focus:border-[#4689C8] outline-none cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Expired">Expired</option>
                    {quotation.status === 'Superseded' && <option value="Superseded">Superseded</option>}
                  </select>
                </div>

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#f5365c] bg-[#fdf2f2] hover:bg-[#fad2d2] border border-[#f5365c]/30 rounded shadow-xs transition cursor-pointer"
                    title="Delete Quotation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchQuotationDetails}
                  disabled={loading}
                  className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded bg-white hover:bg-[#f6f9fc] text-[#525f7f] border border-[#dee2e6] shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Reload details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* OJT Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-6">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#4689C8] mx-auto mb-3" />
                <p className="text-sm font-semibold text-[#525f7f]">Loading quotation details & scope reports...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-10 h-10 text-[#f5365c] mb-2" />
                <h4 className="text-base font-bold text-[#f5365c] mb-1">Failed to Load Quotation</h4>
                <p className="text-xs text-[#525f7f] max-w-md mb-4">{error}</p>
                <button
                  onClick={() => router.push('/quotations')}
                  className="btn btn-sm px-4 py-2 bg-[#4689C8] text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Return to Quotations
                </button>
              </div>
            ) : quotation ? (
              <>
                {/* 1. OJT REPORT CARD: Quotation & Client Information */}
                <div className="card report-card border-none rounded-xl shadow-sm overflow-hidden mb-4">
                  {/* Purple/Indigo OJT Gradient Header */}
                  <div className="report-card-header bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white py-3.5 px-5 flex items-center justify-between">
                    <h5 className="mb-0 text-sm font-bold flex items-center gap-2 text-white">
                      <FileSpreadsheet className="w-4 h-4 text-white" />
                      <span>Quotation & Commercial Scope Information</span>
                    </h5>
                    <span className="text-[11px] font-mono bg-white/20 px-2 py-0.5 rounded text-white font-semibold">
                      ID: {quotation.quotation_number} (v{quotation.version})
                    </span>
                  </div>

                  {/* Body with 2-Column Bordered .profile-item Boxes (Exact OJT students-view.php pattern) */}
                  <div className="card-body p-4 sm:p-6 bg-white border border-t-0 border-[#dee2e6] rounded-b-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Quotation Subject */}
                      <div className="col-span-1 md:col-span-2 border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Proposal Subject / Title
                        </div>
                        <div className="profile-item-value text-sm font-bold text-[#172b4d] mt-1">
                          {quotation.title}
                        </div>
                      </div>

                      {/* Client Account */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>Client / Organization</span>
                        </div>
                        <div className="profile-item-value text-sm font-bold text-[#172b4d] mt-1">
                          {quotation.client_name}
                        </div>
                        {quotation.client_company && (
                          <div className="text-xs text-[#525f7f] mt-0.5">
                            Company: <span className="font-semibold">{quotation.client_company}</span>
                          </div>
                        )}
                        {quotation.client_billing_address && (
                          <div className="text-[11px] text-[#8898aa] mt-0.5">
                            {quotation.client_billing_address}
                          </div>
                        )}
                      </div>

                      {/* Linked Project */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa] flex items-center gap-1.5">
                          <FolderKanban className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>Linked Project</span>
                        </div>
                        <div className="profile-item-value text-sm font-bold text-[#172b4d] mt-1">
                          {quotation.project_title ? (
                            <Link
                              href={`/projects/view?id=${quotation.project_id}`}
                              className="inline-flex items-center gap-1 text-[#4689C8] hover:underline"
                            >
                              <span>{quotation.project_title}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-[#8898aa] font-normal italic">
                              Standalone Proposal (No linked project)
                            </span>
                          )}
                        </div>
                        {quotation.project_id && (
                          <div className="text-[11px] text-[#8898aa] mt-0.5">
                            Project ID: {quotation.project_id}
                          </div>
                        )}
                      </div>

                      {/* Client Contact Info */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa] flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>Client Contact Info</span>
                        </div>
                        <div className="profile-item-value text-xs text-[#525f7f] mt-1 space-y-0.5">
                          {quotation.client_email && (
                            <div className="flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#8898aa]" />
                              <span>{quotation.client_email}</span>
                            </div>
                          )}
                          {quotation.client_phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-[#8898aa]" />
                              <span>{quotation.client_phone}</span>
                            </div>
                          )}
                          {!quotation.client_email && !quotation.client_phone && (
                            <span className="text-[#8898aa] italic">No direct contact info provided</span>
                          )}
                        </div>
                      </div>

                      {/* Issue Date & Validity */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa] flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>Proposal Dates</span>
                        </div>
                        <div className="profile-item-value text-xs text-[#172b4d] mt-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[#8898aa]">Issue Date:</span>
                            <span className="font-semibold">{formatDate(quotation.quotation_date)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#8898aa]">Valid Until:</span>
                            <span className={`font-semibold ${isExpired ? 'text-[#f5365c]' : ''}`}>
                              {formatDate(quotation.valid_until)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Version & Status */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Version & Status
                        </div>
                        <div className="profile-item-value text-xs text-[#172b4d] mt-1 flex items-center gap-2">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30">
                            Version {quotation.version}
                          </span>
                          <span className="font-semibold text-[#525f7f]">
                            Status: <span className="font-bold">{quotation.status}</span>
                          </span>
                        </div>
                      </div>

                      {/* Prepared By */}
                      <div className="border border-[#dee2e6] rounded-md p-3 profile-item bg-[#fcfdfe]">
                        <div className="profile-item-label text-[11px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Prepared By
                        </div>
                        <div className="profile-item-value text-xs text-[#172b4d] mt-1">
                          <span className="font-semibold">{quotation.created_by_name || 'Hertzsoft Operations'}</span>
                          {quotation.created_at && (
                            <span className="text-[11px] text-[#8898aa] ml-2">
                              ({formatDate(quotation.created_at)})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. OJT STATS CARDS: Financial & Scope Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card A: Financial Valuation (Pink/Red Gradient) */}
                  <div className="card stats-card bg-gradient-to-r from-[#f093fb] to-[#f5576c] text-white rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                      <h5 className="text-sm font-bold m-0 flex items-center gap-2 text-white">
                        <Receipt className="w-4 h-4 text-white" />
                        <span>Commercial Valuation</span>
                      </h5>
                      <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded font-mono font-bold text-white">
                        INR (₹)
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                      <div className="bg-white/10 p-2.5 rounded-lg backdrop-blur-xs">
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                          {formatCurrency(quotation.total_amount)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 mt-0.5">
                          Total Amount (Net)
                        </div>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-lg backdrop-blur-xs">
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                          {formatCurrency(quotation.subtotal)}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 mt-0.5">
                          Base Subtotal
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 text-xs flex items-center justify-between text-white/90">
                      <span>GST Tax ({quotation.tax_rate}%):</span>
                      <span className="font-bold font-mono">+{formatCurrency(quotation.tax_amount)}</span>
                    </div>
                    {Number(quotation.discount_amount) > 0 && (
                      <div className="mt-1 text-xs flex items-center justify-between text-white/90">
                        <span>Discount ({quotation.discount_rate}%):</span>
                        <span className="font-bold font-mono">-{formatCurrency(quotation.discount_amount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Card B: Proposal Validity & Action Readiness (Purple/Indigo Gradient) */}
                  <div className="card stats-card bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between pb-3 border-b border-white/20">
                      <h5 className="text-sm font-bold m-0 flex items-center gap-2 text-white">
                        <Clock className="w-4 h-4 text-white" />
                        <span>Validity & Conversion</span>
                      </h5>
                      <span className="text-[11px] bg-white/25 px-2 py-0.5 rounded font-semibold text-white">
                        {quotation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4 text-center">
                      <div className="bg-white/10 p-2.5 rounded-lg backdrop-blur-xs">
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                          {validityDays !== null ? (validityDays > 0 ? `${validityDays}d` : 'Expired') : '—'}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 mt-0.5">
                          Validity Window
                        </div>
                      </div>

                      <div className="bg-white/10 p-2.5 rounded-lg backdrop-blur-xs">
                        <div className="text-xl sm:text-2xl font-black tracking-tight text-white font-mono">
                          {(quotation.items || []).length}
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/90 mt-0.5">
                          Line Items / Deliverables
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 text-xs flex items-center justify-between text-white/90">
                      <span>Offer Expiry Date:</span>
                      <span className="font-bold">{formatDate(quotation.valid_until)}</span>
                    </div>
                    <div className="mt-1 text-xs flex items-center justify-between text-white/90">
                      <span>Accounting Status:</span>
                      <span className="font-semibold italic">Non-statutory commercial estimate</span>
                    </div>
                  </div>
                </div>

                {/* 3. LINE ITEMS & DELIVERABLES SCOPE TABLE (OJT DataTable) */}
                <div className="card border border-[#dee2e6] rounded-xl overflow-hidden shadow-2xs">
                  <div className="card-header bg-[#f6f9fc] border-b border-[#dee2e6] py-3.5 px-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-[#4689C8]" />
                      <h4 className="text-sm font-bold text-[#172b4d] m-0">
                        Deliverables Scope & Line Items ({(quotation.items || []).length})
                      </h4>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover table-striped table-bordered w-full text-xs text-left mb-0">
                      <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center border-r border-[#dee2e6]">#</th>
                          <th className="py-2.5 px-3 min-w-[250px] border-r border-[#dee2e6]">Scope / Deliverable Description</th>
                          <th className="py-2.5 px-3 w-16 text-center border-r border-[#dee2e6]">Qty</th>
                          <th className="py-2.5 px-3 w-28 text-right border-r border-[#dee2e6]">Unit Rate</th>
                          <th className="py-2.5 px-3 w-20 text-right border-r border-[#dee2e6]">Disc %</th>
                          <th className="py-2.5 px-3 w-20 text-right border-r border-[#dee2e6]">Tax %</th>
                          <th className="py-2.5 px-3 w-32 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dee2e6] bg-white">
                        {(quotation.items || []).length === 0 ? (
                          <tr>
                            <td colSpan="7" className="py-8 text-center text-[#8898aa] italic">
                              No line items recorded for this quotation.
                            </td>
                          </tr>
                        ) : (
                          quotation.items.map((item, idx) => (
                            <tr key={item.id || idx} className="hover:bg-[#f6f9fc]">
                              <td className="py-2.5 px-3 text-center text-[#8898aa] font-mono border-r border-[#dee2e6]">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-[#172b4d] border-r border-[#dee2e6]">
                                {item.description}
                              </td>
                              <td className="py-2.5 px-3 text-center text-[#525f7f] border-r border-[#dee2e6]">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#525f7f] border-r border-[#dee2e6]">
                                {formatCurrency(item.rate)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#8898aa] border-r border-[#dee2e6]">
                                {Number(item.discount_percent) > 0 ? `${item.discount_percent}%` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-[#8898aa] border-r border-[#dee2e6]">
                                {Number(item.tax_percent) > 0 ? `${item.tax_percent}%` : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-[#172b4d]">
                                {formatCurrency(item.amount)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Financial Totals Breakdown in Table Footer */}
                  <div className="bg-[#f8f9fe] border-t border-[#dee2e6] p-4 flex justify-end">
                    <div className="w-full sm:w-80 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[#525f7f]">
                        <span>Subtotal:</span>
                        <span className="font-semibold font-mono text-[#172b4d]">
                          {formatCurrency(quotation.subtotal)}
                        </span>
                      </div>

                      {Number(quotation.discount_amount) > 0 && (
                        <div className="flex items-center justify-between text-[#f5365c]">
                          <span>Discount ({quotation.discount_rate}%):</span>
                          <span className="font-semibold font-mono">
                            - {formatCurrency(quotation.discount_amount)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[#525f7f]">
                        <span>GST / Tax ({quotation.tax_rate}%):</span>
                        <span className="font-semibold font-mono text-[#172b4d]">
                          + {formatCurrency(quotation.tax_amount)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-[#dee2e6] flex items-center justify-between font-extrabold text-sm text-[#172b4d]">
                        <span>Grand Total:</span>
                        <span className="text-[#4689C8] text-base font-mono">
                          {formatCurrency(quotation.total_amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. TERMS & CONDITIONS AND INTERNAL REMARKS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Terms & Conditions */}
                  <div className="card border border-[#dee2e6] rounded-xl p-4 bg-white shadow-2xs">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#525f7f] mb-2 flex items-center gap-1.5">
                      <span>Terms & Conditions</span>
                    </h5>
                    <div className="text-xs text-[#525f7f] leading-relaxed whitespace-pre-wrap bg-[#f8f9fe] p-3 rounded border border-[#dee2e6]">
                      {quotation.terms_and_conditions || 'Standard company payment and validity terms apply.'}
                    </div>
                  </div>

                  {/* Internal Remarks / Deliverable Notes */}
                  <div className="card border border-[#dee2e6] rounded-xl p-4 bg-white shadow-2xs">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#525f7f] mb-2 flex items-center gap-1.5">
                      <span>Proposal Notes & Remarks</span>
                    </h5>
                    <div className="text-xs text-[#525f7f] leading-relaxed whitespace-pre-wrap bg-[#f8f9fe] p-3 rounded border border-[#dee2e6]">
                      {quotation.notes || 'No special internal remarks recorded for this proposal.'}
                    </div>
                  </div>
                </div>

                {/* 5. VERSION AUDIT TRAIL (Preserves all historical versions) */}
                {quotation.versions && quotation.versions.length > 0 && (
                  <div className="card border border-[#dee2e6] rounded-xl overflow-hidden shadow-2xs">
                    <div className="card-header bg-[#f6f9fc] border-b border-[#dee2e6] py-3.5 px-5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4 text-[#8965e0]" />
                        <h4 className="text-sm font-bold text-[#172b4d] m-0">
                          Version History & Revision Trail ({quotation.versions.length} versions)
                        </h4>
                      </div>
                      <span className="text-xs text-[#8898aa]">
                        Historical versions are preserved as Superseded records.
                      </span>
                    </div>

                    <div className="table-responsive">
                      <table className="table table-hover table-striped table-bordered w-full text-xs text-left mb-0">
                        <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[10px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                          <tr>
                            <th className="py-2.5 px-3 border-r border-[#dee2e6]">Version</th>
                            <th className="py-2.5 px-3 border-r border-[#dee2e6]">Quotation Number</th>
                            <th className="py-2.5 px-3 border-r border-[#dee2e6]">Issue Date</th>
                            <th className="py-2.5 px-3 border-r border-[#dee2e6]">Status</th>
                            <th className="py-2.5 px-3 border-r border-[#dee2e6] text-right">Total Amount</th>
                            <th className="py-2.5 px-3 text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#dee2e6] bg-white">
                          {quotation.versions.map((ver) => {
                            const isCurrent = ver.id === quotation.id;
                            return (
                              <tr 
                                key={ver.id}
                                className={`transition-colors ${isCurrent ? 'bg-[#f0f7fd]/60 font-semibold' : 'hover:bg-[#f6f9fc]'}`}
                              >
                                <td className="py-2.5 px-3 border-r border-[#dee2e6]">
                                  <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30">
                                    v{ver.version}
                                  </span>
                                  {isCurrent && (
                                    <span className="ml-2 text-[10px] font-bold text-[#2dce89]">
                                      (Viewing)
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono border-r border-[#dee2e6]">
                                  {ver.quotation_number}
                                </td>
                                <td className="py-2.5 px-3 border-r border-[#dee2e6]">
                                  {formatDate(ver.quotation_date)}
                                </td>
                                <td className="py-2.5 px-3 border-r border-[#dee2e6]">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    ver.status === 'Accepted'
                                      ? 'bg-[#e8f7ee] text-[#2dce89]'
                                      : ver.status === 'Sent'
                                      ? 'bg-[#f0f7fd] text-[#4689C8]'
                                      : ver.status === 'Superseded'
                                      ? 'bg-purple-50 text-purple-700'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {ver.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono border-r border-[#dee2e6]">
                                  {formatCurrency(ver.total_amount)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {isCurrent ? (
                                    <span className="text-[#8898aa] text-[11px] italic">Active</span>
                                  ) : (
                                    <Link
                                      href={`/quotations/view?id=${ver.id}`}
                                      className="btn btn-sm px-2.5 py-1 text-xs font-semibold text-[#4689C8] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition"
                                    >
                                      View Version
                                    </Link>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Edit / Revise Quotation Modal */}
      <QuotationModal
        isOpen={isQuotationModalOpen}
        onClose={() => setIsQuotationModalOpen(false)}
        quotation={quotation}
        mode={modalMode}
        onSuccess={() => fetchQuotationDetails()}
      />

      {/* Official GST Tax Invoice Modal */}
      <TaxInvoiceModal
        isOpen={isTaxInvoiceOpen}
        onClose={() => setIsTaxInvoiceOpen(false)}
        quotation={quotation}
      />

      {/* Official Printable Preview Modal */}
      <QuotationPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        quotation={quotation}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteQuotation}
        loading={deleting}
        title="Delete Commercial Quotation"
        message={`Are you sure you want to permanently delete quotation ${quotation?.quotation_number} (v${quotation?.version})? This action cannot be undone.`}
      />
    </AppLayout>
  );
}

export default function QuotationViewPage() {
  return (
    <Suspense
      fallback={
        <AppLayout title="Quotation Details & Scope Report">
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#4689C8] mx-auto mb-3" />
            <p className="text-sm font-semibold text-[#525f7f]">Loading quotation view...</p>
          </div>
        </AppLayout>
      }
    >
      <QuotationViewContent />
    </Suspense>
  );
}

