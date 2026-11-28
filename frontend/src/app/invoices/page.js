'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import quotationService from '@/services/quotationService';
import paymentService from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext';
import {
  Receipt,
  FileText,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  Calendar,
  X,
  CreditCard,
  Eye,
  Printer,
  CheckCircle2,
  Clock,
  AlertCircle,
  FilePlus2,
  Mail,
  Phone
} from 'lucide-react';
import { TaxInvoiceModal } from '@/components/modals';

export default function InvoicesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'official' | 'pending_payment' | 'ready_to_invoice'
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [isTaxInvoiceOpen, setIsTaxInvoiceOpen] = useState(false);
  const [convertingId, setConvertingId] = useState(null);

  // Fetch all invoices (quotations with invoice numbers or eligible)
  const fetchData = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');

      const [quotesRes, paymentsRes] = await Promise.all([
        quotationService.getQuotations(),
        paymentService.getPayments().catch(() => ({ data: [] }))
      ]);

      setInvoices(quotesRes.data || []);
      setPayments(paymentsRes.data || []);

      if (isManual) {
        toast.success('Invoices and payment metrics refreshed!');
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      const msg = err.message || 'Could not fetch invoices. Check server connectivity.';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Format currency in Indian Rupees
  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Calculate payment received per invoice/estimate
  const paymentsByInvoice = useMemo(() => {
    const map = {};
    (payments || []).forEach((p) => {
      const invNo = p.invoice_number;
      if (invNo) {
        map[invNo] = (map[invNo] || 0) + Number(p.amount_paid || 0);
      }
    });
    return map;
  }, [payments]);

  // Generate Invoice from eligible Estimate
  const handleGenerateInvoice = async (quoteId) => {
    try {
      setConvertingId(quoteId);
      const res = await quotationService.convertToInvoice(quoteId);
      toast.success(`Official Invoice ${res.data?.invoice_number || ''} generated successfully!`);
      await fetchData(false);
    } catch (err) {
      console.error('Error generating invoice:', err);
      toast.error(err.message || 'Failed to generate tax invoice.');
    } finally {
      setConvertingId(null);
    }
  };

  // Filtered dataset
  const filteredList = useMemo(() => {
    let list = invoices;

    // Filter by Tab
    if (activeTab === 'official') {
      list = list.filter((item) => Boolean(item.invoice_number));
    } else if (activeTab === 'pending_payment') {
      list = list.filter((item) => {
        if (!item.invoice_number) return false;
        const paid = paymentsByInvoice[item.invoice_number] || 0;
        return paid < Number(item.total_amount || 0);
      });
    } else if (activeTab === 'ready_to_invoice') {
      // Accepted estimates without an invoice number yet
      list = list.filter((item) => !item.invoice_number && item.status === 'Accepted');
    } else {
      // 'all' includes official invoices plus accepted proposals
      list = list.filter((item) => Boolean(item.invoice_number) || item.status === 'Accepted');
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((item) => {
        const invNo = (item.invoice_number || '').toLowerCase();
        const quoteNo = (item.quotation_number || '').toLowerCase();
        const client = (item.client_name || '').toLowerCase();
        const company = (item.client_company || '').toLowerCase();
        const title = (item.title || '').toLowerCase();
        return (
          invNo.includes(q) ||
          quoteNo.includes(q) ||
          client.includes(q) ||
          company.includes(q) ||
          title.includes(q)
        );
      });
    }

    return list;
  }, [invoices, activeTab, searchQuery, paymentsByInvoice]);

  // Pagination calculations
  const totalEntries = filteredList.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, currentPage, pageSize]);

  // Open Preview Modal with complete item breakdown
  const handleOpenPreview = async (item) => {
    try {
      const fullDoc = await quotationService.getQuotationById(item.id);
      setPreviewInvoice(fullDoc.data || fullDoc);
      setIsTaxInvoiceOpen(true);
    } catch (err) {
      console.error('Error fetching invoice details:', err);
      toast.error('Could not load detailed invoice items.');
    }
  };

  return (
    <AppLayout title="Tax Invoices & Billing">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#DFEAF2] rounded-xl overflow-hidden">
          {/* Card Header */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#DFEAF2] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0 flex items-center gap-2">
                <Receipt className="w-6 h-6 text-[#0077B6]" />
                <span>Tax Invoices &amp; Billing</span>
              </h2>
              <p className="text-xs text-[#71869B] mt-0.5">
                Generate, track, and print official GST commercial tax invoices for client projects.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/quotations"
                className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-xs transition cursor-pointer"
              >
                <FilePlus2 className="w-3.5 h-3.5" />
                <span>New Estimate</span>
              </Link>

              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#71869B] bg-white hover:bg-[#EAF3FB] hover:text-[#4689C8] border border-[#DFEAF2] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh invoices"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#0077B6]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-4">
            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-md bg-[#FDF2F2] border border-[#F5365C]/30 flex items-center justify-between text-[#F5365C] text-xs">
                <span>{error}</span>
                <button onClick={() => fetchData(false)} className="font-bold underline cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {/* Controls Bar: Tabs & Search */}
            <div className="space-y-3 pt-2">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    activeTab === 'all'
                      ? 'bg-[#0077B6] text-white shadow-xs'
                      : 'bg-white text-[#71869B] border border-[#DFEAF2] hover:bg-[#EAF3FB] hover:text-[#0077B6]'
                  }`}
                >
                  All Invoices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('official');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    activeTab === 'official'
                      ? 'bg-[#0077B6] text-white shadow-xs'
                      : 'bg-white text-[#71869B] border border-[#DFEAF2] hover:bg-[#EAF3FB] hover:text-[#0077B6]'
                  }`}
                >
                  Official Tax Invoices
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pending_payment');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    activeTab === 'pending_payment'
                      ? 'bg-[#0077B6] text-white shadow-xs'
                      : 'bg-white text-[#71869B] border border-[#DFEAF2] hover:bg-[#EAF3FB] hover:text-[#0077B6]'
                  }`}
                >
                  Pending Payment
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('ready_to_invoice');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    activeTab === 'ready_to_invoice'
                      ? 'bg-[#0077B6] text-white shadow-xs'
                      : 'bg-white text-[#71869B] border border-[#DFEAF2] hover:bg-[#EAF3FB] hover:text-[#0077B6]'
                  }`}
                >
                  Ready to Invoice (Accepted Estimates)
                </button>
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
                    className="px-2.5 py-1 bg-white border border-[#DFEAF2] rounded text-xs font-bold text-[#19324D] focus:outline-none focus:border-[#0077B6] cursor-pointer"
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
                      placeholder="Search invoice #, client, scope..."
                      className="w-56 sm:w-64 px-3 pr-7 py-1.5 text-xs bg-white border border-[#DFEAF2] rounded text-[#19324D] placeholder-[#71869B] focus:outline-none focus:border-[#0077B6] transition"
                    />
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

              {/* Invoices Table */}
              <div className="w-full overflow-x-auto border border-[#DFEAF2] rounded-md shadow-xs bg-white">
                <table className="table table-hover table-striped table-bordered w-full min-w-[980px] text-xs text-left">
                  <thead className="thead-light bg-[#EAF3FB] text-[#19324D] text-[11px] font-bold uppercase tracking-wider border-b border-[#DFEAF2]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[150px] whitespace-nowrap">
                        Invoice / Estimate
                      </th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[220px]">
                        Client &amp; Contact
                      </th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[200px]">
                        Subject / Project
                      </th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[140px] whitespace-nowrap text-right">
                        Invoice Amount
                      </th>
                      <th className="py-3 px-3.5 border-r border-[#DFEAF2] min-w-[130px] whitespace-nowrap text-center">
                        Billing Status
                      </th>
                      <th className="py-3 px-3.5 min-w-[180px] whitespace-nowrap text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#DFEAF2]">
                    {loading && invoices.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#71869B]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#0077B6] mx-auto mb-2" />
                          <span className="text-xs font-semibold">Loading tax invoices &amp; billing...</span>
                        </td>
                      </tr>
                    ) : paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#71869B]">
                          <Receipt className="w-8 h-8 mx-auto text-[#71869B] mb-2" />
                          <p className="text-xs font-semibold text-[#19324D]">
                            No invoices found matching your criteria
                          </p>
                          <p className="text-[11px] text-[#71869B] mt-0.5">
                            {searchQuery || activeTab !== 'all'
                              ? 'Try switching tabs or resetting the search filter.'
                              : 'Create and accept an estimate to generate your first tax invoice.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item, idx) => {
                        const invNumber = item.invoice_number;
                        const paidAmount = invNumber ? (paymentsByInvoice[invNumber] || 0) : 0;
                        const totalAmount = Number(item.total_amount || 0);
                        const isFullyPaid = invNumber && paidAmount >= totalAmount && totalAmount > 0;
                        const isPartiallyPaid = invNumber && paidAmount > 0 && paidAmount < totalAmount;

                        return (
                          <tr
                            key={item.id}
                            className={`transition-colors duration-150 ${
                              idx % 2 === 1 ? 'bg-[#F8FAFD]' : 'bg-white'
                            } hover:bg-[#EAF3FB]`}
                          >
                            {/* 1. Invoice Number & Date */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              {invNumber ? (
                                <div className="font-mono font-bold text-xs text-[#0077B6]">
                                  {invNumber}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs text-[#71869B] font-semibold">
                                    {item.quotation_number}
                                  </span>
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    Ready to Invoice
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 text-[11px] text-[#71869B] mt-0.5">
                                <Calendar className="w-3 h-3 text-[#71869B]" />
                                <span>{formatDate(item.quotation_date)}</span>
                              </div>
                            </td>

                            {/* 2. Client & Contact Info (Stacked) */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              <div className="flex flex-col gap-0.5">
                                <div className="font-bold text-[#19324D] text-xs flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#71869B] shrink-0" />
                                  <span>{item.client_name}</span>
                                </div>
                                {item.client_company && (
                                  <div className="text-[11px] text-[#71869B] font-medium">
                                    {item.client_company}
                                  </div>
                                )}
                                {(item.client_email || item.client_phone) && (
                                  <div className="flex items-center gap-2 text-[10px] text-[#71869B] mt-0.5">
                                    {item.client_email && (
                                      <span className="flex items-center gap-0.5 truncate max-w-[150px]">
                                        <Mail className="w-3 h-3 shrink-0" />
                                        <span>{item.client_email}</span>
                                      </span>
                                    )}
                                    {item.client_phone && (
                                      <span className="flex items-center gap-0.5 shrink-0">
                                        <Phone className="w-3 h-3 shrink-0" />
                                        <span>{item.client_phone}</span>
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* 3. Subject / Project */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2]">
                              <div className="text-xs font-semibold text-[#19324D] line-clamp-1" title={item.title}>
                                {item.title}
                              </div>
                              <div className="text-[10px] text-[#71869B] mt-0.5">
                                {item.items_count || 1} line item(s) • GST included
                              </div>
                            </td>

                            {/* 4. Total Amount & Breakdown */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2] text-right">
                              <div className="font-mono font-bold text-xs text-[#19324D]">
                                {formatCurrency(item.total_amount)}
                              </div>
                              <div className="text-[10px] text-[#71869B]">
                                Tax: {formatCurrency(item.tax_amount)}
                              </div>
                            </td>

                            {/* 5. Billing Status */}
                            <td className="py-3 px-3.5 border-r border-[#DFEAF2] text-center">
                              {invNumber ? (
                                isFullyPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30 uppercase">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Paid</span>
                                  </span>
                                ) : isPartiallyPaid ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                    <Clock className="w-3 h-3" />
                                    <span>Partial ({formatCurrency(paidAmount)})</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-300 uppercase">
                                    <Clock className="w-3 h-3" />
                                    <span>Pending</span>
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                                  <span>Estimate</span>
                                </span>
                              )}
                            </td>

                            {/* 6. Actions */}
                            <td className="py-3 px-3.5 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                                {/* If already an invoice, preview printable Tax Invoice */}
                                {invNumber ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPreview(item)}
                                    className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#0077B6] hover:bg-[#005f92] rounded shadow-2xs transition cursor-pointer"
                                    title="Preview Official GST Tax Invoice"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Tax Invoice</span>
                                  </button>
                                ) : (
                                  /* If estimate, generate official tax invoice */
                                  <button
                                    type="button"
                                    onClick={() => handleGenerateInvoice(item.id)}
                                    disabled={convertingId === item.id}
                                    className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#20A36B] hover:bg-[#178553] rounded shadow-2xs transition cursor-pointer disabled:opacity-50"
                                    title="Generate official HIN Invoice Number"
                                  >
                                    {convertingId === item.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Receipt className="w-3.5 h-3.5" />
                                    )}
                                    <span>Generate Invoice</span>
                                  </button>
                                )}

                                {/* Detailed View Page */}
                                <Link
                                  href={`/quotations/view?id=${item.id}&tab=invoice`}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-[#EAF3FB] hover:bg-[#4689C8] hover:text-white border border-[#4689C8]/30 rounded shadow-2xs transition cursor-pointer"
                                  title="View Detailed Invoice & Scope"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </Link>

                                {/* Record Payment Link */}
                                <Link
                                  href={`/payments`}
                                  className="p-1 rounded text-[#71869B] hover:text-[#20A36B] hover:bg-[#EAF8F1] border border-transparent hover:border-[#20A36B]/30 transition cursor-pointer"
                                  title="Record Payment Installment"
                                >
                                  <CreditCard className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* DataTables Pagination & Entry Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-[#71869B]">
                <div>
                  Showing {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                  {Math.min(currentPage * pageSize, totalEntries)} of {totalEntries} entries
                </div>

                <div className="inline-flex items-center rounded border border-[#DFEAF2] overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF3FB] hover:text-[#0077B6] disabled:bg-[#F4F8FC] disabled:text-[#71869B]/50 border-r border-[#DFEAF2] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
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
                          ? 'bg-[#0077B6] text-white'
                          : 'bg-white text-[#71869B] hover:bg-[#EAF3FB] hover:text-[#0077B6]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-[#EAF3FB] hover:text-[#0077B6] disabled:bg-[#F4F8FC] disabled:text-[#71869B]/50 font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Tax Invoice Print/PDF Modal */}
      <TaxInvoiceModal
        isOpen={isTaxInvoiceOpen}
        onClose={() => {
          setIsTaxInvoiceOpen(false);
          setPreviewInvoice(null);
        }}
        quotation={previewInvoice}
      />
    </AppLayout>
  );
}
