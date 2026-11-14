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
  FileText,
  History,
  ShieldCheck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import quotationService from '@/services/quotationService';
import EstimateDocument from '@/components/templates/EstimateDocument';
import InvoiceDocument from '@/components/templates/InvoiceDocument';
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

  // View Mode: 'document' (Estimate) | 'invoice' (Invoice) | 'overview' (Data Grid) | 'audit' (Version & Audit Log)
  const [viewTab, setViewTab] = useState('document');

  // Modals state
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('edit'); // 'edit' | 'revise'
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isTaxInvoiceOpen, setIsTaxInvoiceOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [converting, setConverting] = useState(false);

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

  // Convert to Invoice Handler
  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    try {
      setConverting(true);
      const res = await quotationService.convertToInvoice(quotation.id);
      toast.success(`Estimate converted to Official Tax Invoice ${res.data?.invoice_number || 'HIN26001'}!`);
      await fetchQuotationDetails();
      setViewTab('invoice');
    } catch (err) {
      console.error('Failed to convert to invoice:', err);
      toast.error(err.message || 'Failed to convert to invoice.');
    } finally {
      setConverting(false);
    }
  };

  // Delete Action Handler
  const confirmDeleteQuotation = async () => {
    if (!quotation) return;
    try {
      setDeleting(true);
      await quotationService.deleteQuotation(quotation.id);
      toast.success(`Estimate ${quotation.quotation_number} deleted.`);
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

  return (
    <AppLayout title="Estimate & Commercial Proposal">
      <div className="container-fluid px-0 sm:px-2">
        {/* MAIN CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#DFEAF2] rounded-xl overflow-hidden">
          {/* Card Header with Back Button and Actions */}
          <div className="card-header bg-white border-b border-[#DFEAF2] py-4 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/quotations')}
                className="btn btn-sm inline-flex items-center justify-center w-9 h-9 rounded bg-[#0077B6] hover:bg-[#005f92] text-white shadow-xs transition cursor-pointer flex-shrink-0"
                title="Back to Quotations Ledger"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0">
                    Estimate & Commercial Document
                  </h2>
                  {quotation && (
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded bg-slate-100 text-[#0077B6] border border-slate-300">
                        {quotation.quotation_number}
                      </span>
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#EAF3FB] text-[#0077B6] border border-[#0077B6]/30">
                        v{quotation.version}
                      </span>
                      {quotation.invoice_number && (
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-300">
                          Inv: {quotation.invoice_number}
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        quotation.status === 'Accepted'
                          ? 'bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30'
                          : quotation.status === 'Sent'
                          ? 'bg-[#EAF3FB] text-[#0077B6] border border-[#0077B6]/30'
                          : quotation.status === 'Draft'
                          ? 'bg-slate-100 text-slate-700 border-slate-300'
                          : quotation.status === 'Rejected'
                          ? 'bg-[#FDF2F2] text-[#F5365C] border border-[#F5365C]/30'
                          : quotation.status === 'Expired'
                          ? 'bg-[#FEF4E6] text-[#FB6340] border border-[#FB6340]/30'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {quotation.status}
                      </span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-[#71869B] mt-0.5">
                  Official 1:1 business proposal, editable negotiation history, and GST tax invoice generation.
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            {quotation && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Convert to Invoice Button if not yet converted */}
                {!quotation.invoice_number && (
                  <button
                    type="button"
                    onClick={handleConvertToInvoice}
                    disabled={converting}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-[#0077B6] hover:opacity-95 rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                    title="Accept and Generate Official Invoice (HIN26001)"
                  >
                    {converting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <FileText className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Invoice</span>
                  </button>
                )}

                {/* Print / PDF Button */}
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs transition cursor-pointer"
                  title="Generate or Print Official PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>PDF / Print</span>
                </button>

                {/* Revise Version (Negotiation: e.g. 2,00,000 -> 1,80,000) */}
                {quotation.status !== 'Superseded' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('revise');
                      setIsQuotationModalOpen(true);
                    }}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded shadow-xs transition cursor-pointer"
                    title="Create negotiated version (vX)"
                  >
                    <GitBranch className="w-3.5 h-3.5" />
                    <span>Revise (v{Number(quotation.version || 1) + 1})</span>
                  </button>
                )}

                {/* Edit Button (Draft or Sent) */}
                {quotation.status !== 'Superseded' && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalMode('edit');
                      setIsQuotationModalOpen(true);
                    }}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded shadow-xs transition cursor-pointer"
                    title="Edit Estimate Details Directly"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#0077B6]" />
                    <span>Edit Estimate</span>
                  </button>
                )}

                {/* Status Selector Dropdown */}
                <div className="inline-flex items-center gap-1">
                  <select
                    value={quotation.status}
                    disabled={quotation.status === 'Superseded'}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded border border-slate-300 bg-white text-[#19324D] focus:border-[#0077B6] outline-none cursor-pointer"
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
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded shadow-xs transition cursor-pointer"
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
                  className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded bg-white hover:bg-slate-50 text-slate-600 border border-slate-300 shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Reload details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0077B6]' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Tab Switcher: Official Estimate | Official Invoice | Data Grid | Revision History */}
          {quotation && (
            <div className="flex items-center gap-1 px-4 sm:px-6 border-b border-slate-200 bg-slate-50/60 overflow-x-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setViewTab('document')}
                className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  viewTab === 'document'
                    ? 'border-[#0077B6] text-[#0077B6] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>📄 Official Estimate Document (HE26001)</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('invoice')}
                className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  viewTab === 'invoice'
                    ? 'border-[#0077B6] text-[#0077B6] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>🧾 Official Tax Invoice {quotation.invoice_number ? `(${quotation.invoice_number})` : ''}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('audit')}
                className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  viewTab === 'audit'
                    ? 'border-[#0077B6] text-[#0077B6] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>🕒 Negotiation Versions & Audit Log</span>
              </button>

              <button
                type="button"
                onClick={() => setViewTab('overview')}
                className={`py-3 px-4 font-bold border-b-2 flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                  viewTab === 'overview'
                    ? 'border-[#0077B6] text-[#0077B6] bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>📊 Field-by-Field Breakdown</span>
              </button>
            </div>
          )}

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 bg-slate-50/40">
            {loading ? (
              <div className="py-20 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#0077B6] mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-600">Loading estimate details...</p>
              </div>
            ) : error ? (
              <div className="p-4 rounded-md bg-red-50 border border-red-200 flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
                <h4 className="text-base font-bold text-red-600 mb-1">Failed to Load Estimate</h4>
                <p className="text-xs text-slate-600 max-w-md mb-4">{error}</p>
                <button
                  onClick={() => router.push('/quotations')}
                  className="btn btn-sm px-4 py-2 bg-[#0077B6] text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Return to Quotations
                </button>
              </div>
            ) : quotation ? (
              <>
                {/* 1. OFFICIAL ESTIMATE VIEW */}
                {viewTab === 'document' && (
                  <div className="py-2">
                    <EstimateDocument quotation={quotation} />
                  </div>
                )}

                {/* 2. OFFICIAL TAX INVOICE VIEW */}
                {viewTab === 'invoice' && (
                  <div className="py-2 space-y-4">
                    {!quotation.invoice_number && (
                      <div className="max-w-4xl mx-auto p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-800">
                        <div>
                          <strong>Note:</strong> This estimate has not been assigned a finalized Invoice Number yet.
                          You are viewing the draft tax invoice preview.
                        </div>
                        <button
                          type="button"
                          onClick={handleConvertToInvoice}
                          disabled={converting}
                          className="px-4 py-2 bg-[#0077B6] text-white font-bold rounded shadow-xs hover:bg-[#005f92] shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {converting ? 'Generating...' : 'Finalize & Issue Invoice (HIN26001)'}
                        </button>
                      </div>
                    )}
                    <InvoiceDocument quotation={quotation} />
                  </div>
                )}

                {/* 3. AUDIT & NEGOTIATION VERSIONS VIEW */}
                {viewTab === 'audit' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Version History Table */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-[#0077B6] text-white p-3.5 px-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <GitBranch className="w-4 h-4" />
                          <h4 className="text-sm font-bold text-white m-0">
                            Negotiation Revision History ({quotation.versions?.length || 1} Versions)
                          </h4>
                        </div>
                        <span className="text-xs text-blue-100">
                          Tracks changes across client meetings and pricing discussions
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                            <tr>
                              <th className="py-2.5 px-3 text-center w-20">Version</th>
                              <th className="py-2.5 px-3">Estimate No.</th>
                              <th className="py-2.5 px-3">Date</th>
                              <th className="py-2.5 px-3">Status</th>
                              <th className="py-2.5 px-3 text-right">Agreed Value (₹)</th>
                              <th className="py-2.5 px-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {(quotation.versions || []).map((ver) => {
                              const isCurrent = ver.id === quotation.id;
                              return (
                                <tr key={ver.id} className={isCurrent ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'}>
                                  <td className="py-2.5 px-3 text-center font-mono">
                                    <span className="px-2 py-0.5 rounded bg-[#EAF3FB] text-[#0077B6] border border-[#0077B6]/30">
                                      v{ver.version}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 font-mono text-slate-900 font-bold">
                                    {ver.quotation_number}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-700">
                                    {formatDate(ver.quotation_date)}
                                  </td>
                                  <td className="py-2.5 px-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      ver.status === 'Accepted'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : ver.status === 'Superseded'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}>
                                      {ver.status}
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                                    ₹ {Number(ver.total_amount || 0).toLocaleString('en-IN')}
                                  </td>
                                  <td className="py-2.5 px-3 text-center">
                                    {isCurrent ? (
                                      <span className="text-emerald-700 text-[11px] font-bold">Currently Viewing</span>
                                    ) : (
                                      <Link
                                        href={`/quotations/view?id=${ver.id}`}
                                        className="text-xs text-[#0077B6] font-semibold hover:underline"
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

                    {/* Timeline Audit Logs */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                      <div className="bg-[#0077B6] text-white p-3.5 px-5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4" />
                          <h4 className="text-sm font-bold text-white m-0">
                            System Timeline & Activity Logs
                          </h4>
                        </div>
                      </div>

                      <div className="p-4 divide-y divide-slate-100">
                        {(!quotation.audit_logs || quotation.audit_logs.length === 0) ? (
                          <div className="text-xs text-slate-500 py-6 text-center italic">
                            No timeline entries recorded yet.
                          </div>
                        ) : (
                          quotation.audit_logs.map((log) => (
                            <div key={log.id} className="py-3 flex items-start gap-3 text-xs">
                              <div className="w-2 h-2 rounded-full bg-[#0077B6] mt-1.5 shrink-0" />
                              <div className="flex-1">
                                <div className="font-semibold text-slate-900">{log.summary}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  {log.actor_name || 'System Operator'} • {formatDate(log.created_at)}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. OVERVIEW / FIELD-BY-FIELD BREAKDOWN VIEW */}
                {viewTab === 'overview' && (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {/* Meta Card */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                        Client & Proposal Meta
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div><span className="text-slate-500">Client:</span> <strong>{quotation.client_name}</strong></div>
                        <div><span className="text-slate-500">Company:</span> <strong>{quotation.client_company || '—'}</strong></div>
                        <div><span className="text-slate-500">Phone:</span> <span className="font-mono">{quotation.client_phone || '—'}</span></div>
                        <div><span className="text-slate-500">Project:</span> <strong>{quotation.title}</strong></div>
                        <div><span className="text-slate-500">Timeline:</span> <strong>{quotation.timeline || '45 Days'}</strong></div>
                        <div><span className="text-slate-500">Project Type:</span> <strong>{quotation.project_type || 'Mobile Application'}</strong></div>
                        <div><span className="text-slate-500">Issue Date:</span> <strong>{formatDate(quotation.quotation_date)}</strong></div>
                        <div><span className="text-slate-500">Valid Until:</span> <strong>{formatDate(quotation.valid_until)}</strong></div>
                      </div>
                    </div>

                    {/* Scope Modules */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                        Scope Modules ({(quotation.scope_modules || []).length})
                      </h4>
                      <div className="space-y-3">
                        {(quotation.scope_modules || []).map((sm, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                            <div className="font-bold text-slate-900 text-sm mb-1">{sm.module}</div>
                            <div className="text-slate-600 leading-relaxed">{sm.deliverables}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Third Party Costs */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                      <h4 className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-100 pb-2">
                        Third Party Costs ({(quotation.third_party_costs || []).length})
                      </h4>
                      <div className="space-y-2">
                        {(quotation.third_party_costs || []).map((tp, idx) => (
                          <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-slate-200 text-xs">
                            <span className="font-semibold text-slate-900">{tp.service} ({tp.billing_basis})</span>
                            <span className="font-mono font-bold text-slate-900">{tp.amount}</span>
                          </div>
                        ))}
                      </div>
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
        <AppLayout title="Estimate & Commercial Proposal">
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-[#0077B6] mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading estimate view...</p>
          </div>
        </AppLayout>
      }
    >
      <QuotationViewContent />
    </Suspense>
  );
}
