'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import dashboardService from '@/services/dashboardService';
import LeadModal from '@/components/modals/LeadModal';
import { 
  Users, 
  FolderKanban, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Active Table Tab: 'leads' | 'payments'
  const [activeTab, setActiveTab] = useState('leads');

  // Search filter inside active dashboard table
  const [tableSearch, setTableSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Quick Lead Modal on Dashboard
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);

  const fetchStats = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getStats();
      setStats(res.data);
      if (isManual) {
        toast.success('Dashboard metrics & tables updated!');
      }
    } catch (err) {
      console.error('Error loading dashboard statistics:', err);
      const msg = err.message || 'Failed to load dashboard metrics. Check server connectivity.';
      setError(msg);
      if (isManual) {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    const list = stats?.recent_activity?.recent_leads || [];
    if (!tableSearch.trim()) return list;
    const q = tableSearch.toLowerCase();
    return list.filter((lead) => 
      (lead.name && lead.name.toLowerCase().includes(q)) ||
      (lead.company_name && lead.company_name.toLowerCase().includes(q)) ||
      (lead.phone && lead.phone.toLowerCase().includes(q)) ||
      (lead.email && lead.email.toLowerCase().includes(q)) ||
      (lead.service_interest && lead.service_interest.toLowerCase().includes(q)) ||
      (lead.status && lead.status.toLowerCase().includes(q))
    );
  }, [stats, tableSearch]);

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    const list = stats?.recent_activity?.recent_payments || [];
    if (!tableSearch.trim()) return list;
    const q = tableSearch.toLowerCase();
    return list.filter((pm) => 
      (pm.client_name && pm.client_name.toLowerCase().includes(q)) ||
      (pm.project_title && pm.project_title.toLowerCase().includes(q)) ||
      (pm.payment_method && pm.payment_method.toLowerCase().includes(q))
    );
  }, [stats, tableSearch]);

  const totalFilteredCount = activeTab === 'leads' ? filteredLeads.length : filteredPayments.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / itemsPerPage));
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Won':
        return 'bg-[#2dce89] text-white';
      case 'New':
        return 'bg-[#ffd600] text-[#172b4d]';
      case 'Contacted':
        return 'bg-[#11cdef] text-white';
      case 'Qualified':
        return 'bg-[#5e72e4] text-white';
      case 'Quotation Sent':
        return 'bg-[#4689C8] text-white';
      case 'Negotiation':
        return 'bg-[#8965e0] text-white';
      case 'Lost':
        return 'bg-[#f5365c] text-white';
      case 'On Hold':
        return 'bg-[#8898aa] text-white';
      default:
        return 'bg-[#4689C8] text-white';
    }
  };

  return (
    <AppLayout title="Operations & Business Dashboard">
      {/* MASTER OJT CONTAINER CARD */}
      <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
        {/* Card Header (OJT Style) */}
        <div className="card-header px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0">
              Dashboard Overview
            </h2>
            <p className="text-xs text-[#8898aa] mt-0.5">
              Centralized ERP & Operations Real-time Overview
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStats(true)}
              disabled={loading}
              className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Refresh dashboard stats"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="card-body p-4 sm:p-6 space-y-6">
          {/* Error Notice */}
          {error && (
            <div className="p-4 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex items-center justify-between text-[#f5365c] text-sm">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchStats(false)}
                className="text-xs font-bold underline ml-4 cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Top 4 KPI Metric Cards (OJT / Argon card-stats layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Inquiries */}
            <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                    Total Inquiries
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                    {stats?.leads?.total || 0}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4689C8] to-[#5FC8D6] text-white flex items-center justify-center shadow-md shadow-[#4689C8]/25">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-[#2dce89]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {stats?.leads?.won || 0} Won Deals
                </span>
                <span className="text-[#8898aa] font-medium">
                  • {stats?.leads?.active_pipeline || 0} Active
                </span>
              </div>
            </div>

            {/* 2. Client Projects */}
            <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                    Client Projects
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                    {stats?.projects?.active || 0}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#5e72e4] to-[#825ee4] text-white flex items-center justify-center shadow-md shadow-[#5e72e4]/25">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 font-bold text-[#2dce89]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {stats?.projects?.completed || 0} Completed
                </span>
                <span className="text-[#8898aa] font-medium">
                  • {stats?.projects?.total || 0} Total Contracts
                </span>
              </div>
            </div>

            {/* 3. Revenue Collected */}
            <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                    Revenue Collected
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                    {formatCurrency(stats?.financials?.total_collected)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                <span>Total Deal Value:</span>
                <span className="font-bold text-[#172b4d]">
                  {formatCurrency(stats?.financials?.total_deal_value)}
                </span>
              </div>
            </div>

            {/* 4. Pending Dues */}
            <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                    Pending Dues
                  </span>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                    {formatCurrency(stats?.financials?.total_pending_due)}
                  </div>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#fb6340] to-[#f5365c] text-white flex items-center justify-center shadow-md shadow-[#fb6340]/25">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                <span>Issued Certs:</span>
                <span className="font-bold text-[#4689C8] bg-[#f0f7fd] px-2 py-0.5 rounded border border-[#4689C8]/20 text-[11px]">
                  {stats?.documents?.total_certificates_issued || 0} Documents
                </span>
              </div>
            </div>
          </div>

          {/* OJT TABLE SECTION */}
          <div className="space-y-3 pt-2">
            {/* OJT DataTables Style Tab Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#dee2e6] pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('leads');
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'leads'
                      ? 'border-[#4689C8] text-[#4689C8] bg-[#f8f9fe]'
                      : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Recent Inquiries Pipeline</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[#e9ecef] text-[#525f7f] rounded-full text-[10px] font-bold">
                    {stats?.recent_activity?.recent_leads?.length || 0}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('payments');
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-t-md transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'payments'
                      ? 'border-[#4689C8] text-[#4689C8] bg-[#f8f9fe]'
                      : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Recent Collections & Payments</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[#e9ecef] text-[#525f7f] rounded-full text-[10px] font-bold">
                    {stats?.recent_activity?.recent_payments?.length || 0}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                {activeTab === 'leads' ? (
                  <Link
                    href="/leads"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4689C8] hover:underline"
                  >
                    <span>View All Leads Pipeline</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href="/payments"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#4689C8] hover:underline"
                  >
                    <span>View All Payment Ledger</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>

            {/* DataTables Controls Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2">
              <div className="flex items-center gap-1.5 text-xs text-[#8898aa]">
                <span>Show</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs px-2 py-1 bg-white border border-[#dee2e6] rounded text-[#172b4d] font-bold outline-none focus:border-[#4689C8] cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-[#adb5bd] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab === 'leads' ? 'inquiries' : 'collections'}...`}
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white text-[#172b4d] placeholder-[#adb5bd] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                />
              </div>
            </div>

            {/* OJT BORDERED & STRIPED DATATABLE */}
            {activeTab === 'leads' ? (
              /* TAB 1: LEADS INQUIRIES DATATABLE */
              <div className="table-responsive border border-[#dee2e6] rounded-md overflow-x-auto shadow-2xs">
                <table className="w-full text-left table-striped table-bordered table-hover align-items-center table-sm">
                  <thead className="thead-light bg-[#f8f9fe] text-[11px] font-bold uppercase text-[#8898aa] tracking-wider border-b border-[#dee2e6]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center w-12">#</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Client & Contact</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Company / Business</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Service & Scope</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-right">Estimated Budget</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-center">Pipeline Status</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-center">Created On</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6] text-xs">
                    {paginatedLeads.length > 0 ? (
                      paginatedLeads.map((lead, index) => (
                        <tr key={lead.id} className="hover:bg-[#f8f9fe] transition even:bg-[#fcfdfe]">
                          <td className="py-3 px-3.5 border-r border-[#dee2e6] text-center font-bold text-[#4689C8] font-mono">
                            {lead.lead_number ? `#${lead.lead_number}` : `#${index + 1}`}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6]">
                            <div className="font-bold text-[#172b4d] text-xs">
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-[#8898aa] flex items-center gap-1.5 mt-0.5">
                              {lead.phone && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Phone className="w-3 h-3 text-[#adb5bd]" />
                                  {lead.phone}
                                </span>
                              )}
                              {lead.email && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-[#adb5bd]" />
                                  {lead.email}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#172b4d]">
                              <Building2 className="w-3.5 h-3.5 text-[#4689C8]" />
                              <span>{lead.company_name || 'Individual Client'}</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] font-medium text-[#525f7f]">
                            {lead.service_interest || 'Custom Web Application'}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-right font-extrabold text-[#2dce89]">
                            {lead.estimated_budget ? `₹${Number(lead.estimated_budget).toLocaleString('en-IN')}` : '—'}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(lead.status)}`}>
                              {lead.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-center text-[#8898aa] text-[11px]">
                            {formatDate(lead.created_at)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Link
                              href="/leads"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-blue-50 hover:bg-[#4689C8] hover:text-white border border-blue-200 rounded transition cursor-pointer"
                            >
                              <span>Manage</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-xs text-[#8898aa]">
                          {tableSearch ? 'No inquiries matching your search criteria.' : 'No recent inquiries recorded.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              /* TAB 2: PAYMENTS COLLECTIONS DATATABLE */
              <div className="table-responsive border border-[#dee2e6] rounded-md overflow-x-auto shadow-2xs">
                <table className="w-full text-left table-striped table-bordered table-hover align-items-center table-sm">
                  <thead className="thead-light bg-[#f8f9fe] text-[11px] font-bold uppercase text-[#8898aa] tracking-wider border-b border-[#dee2e6]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center w-12">#</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Client Name</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Company / Enterprise</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6]">Project Contract</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-right">Amount Credited</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-center">Payment Mode</th>
                      <th className="py-3 px-4 border-r border-[#dee2e6] text-center">Payment Date</th>
                      <th className="py-3 px-4 text-center w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6] text-xs">
                    {paginatedPayments.length > 0 ? (
                      paginatedPayments.map((pm, index) => (
                        <tr key={pm.id} className="hover:bg-[#f8f9fe] transition even:bg-[#fcfdfe]">
                          <td className="py-3 px-3.5 border-r border-[#dee2e6] text-center font-bold text-[#4689C8] font-mono">
                            #{index + 1}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] font-bold text-[#172b4d]">
                            {pm.client_name}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-xs font-semibold text-[#525f7f]">
                            {pm.client_company || '—'}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] font-medium text-[#172b4d]">
                            {pm.project_title}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-right font-extrabold text-[#2dce89]">
                            {formatCurrency(pm.amount_paid)}
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-center">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-[#f4f5f7] text-[#525f7f] border border-[#dee2e6]">
                              {pm.payment_method || 'Bank Transfer'}
                            </span>
                          </td>

                          <td className="py-3 px-4 border-r border-[#dee2e6] text-center text-[#8898aa] text-[11px]">
                            {formatDate(pm.payment_date)}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <Link
                              href="/payments"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-blue-50 hover:bg-[#4689C8] hover:text-white border border-blue-200 rounded transition cursor-pointer"
                            >
                              <span>Receipt</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-12 text-center text-xs text-[#8898aa]">
                          {tableSearch ? 'No collections matching your search criteria.' : 'No recent payment installments recorded yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* OJT DATATABLES BOTTOM FOOTER: ROW COUNT & PAGINATION */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-[#8898aa]">
              <div>
                Showing {totalFilteredCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, totalFilteredCount)} of {totalFilteredCount} entries
              </div>

              <div className="flex items-center gap-1 self-end sm:self-center">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 rounded border border-[#dee2e6] text-xs font-semibold text-[#525f7f] hover:bg-[#f8f9fe] disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  <span>Previous</span>
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pg) => (
                  <button
                    key={pg}
                    type="button"
                    onClick={() => setCurrentPage(pg)}
                    className={`w-7 h-7 rounded text-xs font-bold transition cursor-pointer ${
                      currentPage === pg
                        ? 'bg-[#4689C8] text-white shadow-xs'
                        : 'border border-[#dee2e6] text-[#525f7f] hover:bg-[#f8f9fe]'
                    }`}
                  >
                    {pg}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2.5 py-1 rounded border border-[#dee2e6] text-xs font-semibold text-[#525f7f] hover:bg-[#f8f9fe] disabled:opacity-40 transition cursor-pointer flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK CREATE LEAD MODAL */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        lead={null}
        onSuccess={() => {
          fetchStats(true);
        }}
      />
    </AppLayout>
  );
}
