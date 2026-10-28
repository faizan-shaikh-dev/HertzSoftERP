'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import dashboardService from '@/services/dashboardService';
import { 
  Users, 
  FolderKanban, 
  TrendingUp, 
  AlertCircle, 
  ArrowUpRight, 
  CreditCard, 
  GraduationCap, 
  Briefcase, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await dashboardService.getStats();
      // res.data contains the consolidated metrics
      setStats(res.data);
      if (isManual) {
        toast.success('Dashboard updated with latest records!');
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

  return (
    <AppLayout title="Operations & Business Dashboard">
      {/* Top Banner & Quick Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-50/80 via-white to-slate-50 p-5 rounded-lg border border-blue-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Centralized ERP Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of dual leads, enterprise client projects, revenue collections, and issued documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchStats(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-md bg-red-50 border border-red-200 flex items-center justify-between text-red-700 text-sm shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchStats}
            className="text-xs font-bold underline hover:text-red-900 ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeleton or KPI Metric Grid */}
      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
          <p className="text-sm font-medium">Aggregating real-time operational statistics...</p>
        </div>
      ) : (
        <>
          {/* Top 4 KPI Metric Cards (template-hz style: clean white cards with shadow-sm) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Leads Card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Inquiries
                </span>
                <div className="w-10 h-10 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/60 shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.leads?.total || 0}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-semibold text-sky-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-600" />
                    {stats?.leads?.students || 0} Students
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-indigo-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                    {stats?.leads?.clients || 0} Clients
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Active Projects Card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Client Projects
                </span>
                <div className="w-10 h-10 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shadow-2xs">
                  <FolderKanban className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {stats?.projects?.active || 0}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                  <span className="font-semibold text-emerald-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    {stats?.projects?.completed || 0} Completed
                  </span>
                  <span>•</span>
                  <span>{stats?.projects?.total || 0} Total Contracts</span>
                </div>
              </div>
            </div>

            {/* 3. Revenue Collected Card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Revenue Collected
                </span>
                <div className="w-10 h-10 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  {formatCurrency(stats?.financials?.total_collected)}
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  Total Deal Value: <span className="font-semibold text-slate-800">{formatCurrency(stats?.financials?.total_deal_value)}</span>
                </div>
              </div>
            </div>

            {/* 4. Outstanding Dues Card */}
            <div className="bg-white p-5 rounded-lg border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Pending Dues
                </span>
                <div className="w-10 h-10 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 shadow-2xs">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-extrabold text-amber-600 tracking-tight">
                  {formatCurrency(stats?.financials?.total_pending_due)}
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  Issued Certs: <span className="font-semibold text-purple-800 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 shadow-2xs">{stats?.documents?.total_certificates_issued || 0} Documents</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dual Tables Layout (template-hz style) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Recent Leads Pipeline */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recent Inquiries
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest student registrations and project requests
                  </p>
                </div>
                <Link
                  href="/leads"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors"
                >
                  <span>View All</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Lead & Contact</th>
                      <th className="py-3 px-4">Stream</th>
                      <th className="py-3 px-4">Course / Service</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_activity?.recent_leads?.length > 0 ? (
                      stats.recent_activity.recent_leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-xs">
                              {lead.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                              {lead.phone || lead.email || 'No contact provided'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                              lead.lead_type === 'Student'
                                ? 'bg-sky-50 text-sky-700 border border-sky-200/60'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200/60'
                            }`}>
                              {lead.lead_type}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600 truncate max-w-[140px]">
                            {lead.service_interest || 'General Inquiry'}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              lead.status === 'Won'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                                : lead.status === 'Lost'
                                ? 'bg-red-50 text-red-700 border border-red-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}>
                              {lead.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                          No inquiries recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Payments Ledger */}
            <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Recent Collections
                  </h3>
                  <p className="text-xs text-slate-500">
                    Latest installments credited from client projects
                  </p>
                </div>
                <Link
                  href="/projects"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50/80 px-2.5 py-1 rounded-md border border-blue-200/60 transition-colors"
                >
                  <span>View Projects</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4">Client & Project</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_activity?.recent_payments?.length > 0 ? (
                      stats.recent_activity.recent_payments.map((pm) => (
                        <tr key={pm.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-800 text-xs">
                              {pm.client_name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              {pm.project_title}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-emerald-600 text-xs">
                            {formatCurrency(pm.amount_paid)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                              {pm.payment_method || 'Bank'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-400">
                            {formatDate(pm.payment_date)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="py-8 text-center text-xs text-slate-400">
                          No recent transactions recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </AppLayout>
  );
}
