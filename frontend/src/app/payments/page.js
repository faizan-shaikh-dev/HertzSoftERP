'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import paymentService from '@/services/paymentService';
import { useAuth } from '@/context/AuthContext';
import {
  CreditCard,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  FolderKanban,
  Trash2,
  IndianRupee,
  Calendar,
  Wallet,
  TrendingUp,
  Receipt,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Filter,
  X
} from 'lucide-react';
import { PaymentModal, ConfirmDeleteModal } from '@/components/modals';

const METHOD_OPTIONS = [
  'All',
  'UPI / QR Code',
  'Bank Transfer (NEFT/IMPS)',
  'Cheque',
  'Cash',
  'Credit Card / Debit Card',
  'Razorpay / Gateway'
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [payments, setPayments] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    total_project_value: 0,
    total_collected: 0,
    total_pending_due: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Payments & Financial Summary
  const fetchData = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');

      const [paymentsRes, summaryRes] = await Promise.all([
        paymentService.getPayments(),
        paymentService.getFinancialSummary().catch(() => null)
      ]);

      setPayments(paymentsRes?.data || []);
      if (summaryRes?.data) {
        setFinancialSummary(summaryRes.data);
      }

      if (isManual) {
        toast.success('Payments and financial metrics refreshed!');
      }
    } catch (err) {
      console.error('Failed to load payments:', err);
      const msg = err.message || 'Could not fetch payments. Check server connectivity.';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(false);
  }, []);

  // Delete Action
  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await paymentService.deletePayment(paymentToDelete.id);
      toast.success('Payment transaction record deleted.');
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      fetchData(false);
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error(err.message || 'Failed to delete payment record.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // Filter by Method
      if (selectedMethod !== 'All') {
        const itemMethod = (item.payment_method || '').toLowerCase();
        const selected = selectedMethod.toLowerCase();
        if (!itemMethod.includes(selected) && !selected.includes(itemMethod)) {
          return false;
        }
      }

      // Filter by Search Query (Client, Project, UTR/Ref, Notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientMatch = item.client_name?.toLowerCase().includes(q);
        const projectMatch = item.project_title?.toLowerCase().includes(q);
        const refMatch = item.transaction_reference?.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);

        if (!clientMatch && !projectMatch && !refMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [payments, selectedMethod, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

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
    <AppLayout title="Payments & Financial Transactions">
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-50/80 via-white to-slate-50 p-5 rounded-lg border border-emerald-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Payments Ledger & Transactions</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of received client installments, bank references, and overall revenue collections.
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
            onClick={() => setIsPaymentModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Collections</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
              {formatCurrency(financialSummary.total_collected)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Realized cash in bank</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Total Contracts Value */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Contract Value</p>
            <h3 className="text-xl font-extrabold text-indigo-600 mt-1">
              {formatCurrency(financialSummary.total_project_value)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Aggregate value of all deals</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Outstanding Pending Balance */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Receivables</p>
            <h3 className="text-xl font-extrabold text-amber-600 mt-1">
              {formatCurrency(financialSummary.total_pending_due)}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Balance due from clients</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Total Transactions Count */}
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Transactions Count</p>
            <h3 className="text-xl font-extrabold text-slate-800 mt-1">
              {payments.length}
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Installment records logged</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Header Toolbar (Clean, No Scrollbar) */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search & Mode Selector Filter Group */}
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
                  placeholder="Search client, project, or UTR / reference..."
                  className="w-full pl-9 pr-8 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none transition shadow-2xs"
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

              {/* Payment Mode Selector Dropdown */}
              <div className="relative min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Filter className="w-3.5 h-3.5" />
                </div>
                <select
                  value={selectedMethod}
                  onChange={(e) => {
                    setSelectedMethod(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-8.5 pr-8 py-2 bg-white text-slate-700 text-xs font-semibold rounded-md border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none transition cursor-pointer appearance-none shadow-2xs"
                >
                  <option value="All">All Payment Modes</option>
                  <option value="UPI / QR Code">UPI / QR Code</option>
                  <option value="Bank Transfer (NEFT/IMPS)">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit Card / Debit Card">Credit / Debit Card</option>
                  <option value="Razorpay / Gateway">Razorpay / Gateway</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Reset filter action */}
              {(selectedMethod !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedMethod('All');
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
              Showing <span className="font-bold text-slate-800">{filteredPayments.length}</span> of {payments.length} transactions
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

        {/* Ledger Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Receipt / Ref ID</th>
                <th className="py-3 px-4">Client & Project</th>
                <th className="py-3 px-4">Amount Credited</th>
                <th className="py-3 px-4">Payment Date</th>
                <th className="py-3 px-4">Mode / Method</th>
                <th className="py-3 px-4">Recorded By / Remarks</th>
                {isAdmin && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && payments.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                    <span className="text-xs font-medium">Aggregating transactions ledger...</span>
                  </td>
                </tr>
              ) : paginatedPayments.length > 0 ? (
                paginatedPayments.map((item) => {
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Receipt / Ref ID */}
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          #PM-{item.id}
                        </div>
                        {item.transaction_reference ? (
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5 truncate max-w-[150px]" title={item.transaction_reference}>
                            Ref: {item.transaction_reference}
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            No Ref
                          </div>
                        )}
                      </td>

                      {/* 2. Client & Project */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.client_name || 'Client'}</span>
                        </div>
                        <div className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 mt-0.5">
                          <FolderKanban className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[200px]" title={item.project_title}>
                            {item.project_title || 'Project'}
                          </span>
                        </div>
                      </td>

                      {/* 3. Amount Credited */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-bold text-xs">
                          <span>+ {formatCurrency(item.amount_paid)}</span>
                        </div>
                      </td>

                      {/* 4. Payment Date */}
                      <td className="py-3 px-4 text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(item.payment_date)}</span>
                        </div>
                      </td>

                      {/* 5. Payment Mode / Method */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.payment_method || 'UPI'}
                        </span>
                      </td>

                      {/* 6. Recorded By / Notes */}
                      <td className="py-3 px-4">
                        <div className="text-xs text-slate-700 font-medium">
                          {item.recorded_by_name || 'System / Staff'}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[220px]" title={item.notes}>
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* 7. Admin Delete Action */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setPaymentToDelete(item);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Transaction Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-16 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No payment records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 mb-3">
                      {searchQuery || selectedMethod !== 'All'
                        ? 'Try clearing your search or mode filters.'
                        : 'Record your first received installment from a client contract.'}
                    </p>
                    {(!searchQuery && selectedMethod === 'All') && (
                      <button
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Record Payment</span>
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filteredPayments.length > itemsPerPage && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredPayments.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredPayments.length}</span> transactions
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

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => fetchData(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={confirmDeletePayment}
        loading={deleting}
        title="Delete Transaction Record"
        message={`Are you sure you want to delete payment record #PM-${paymentToDelete?.id} of ${formatCurrency(paymentToDelete?.amount_paid)}? This will reverse the credit against project "${paymentToDelete?.project_title}".`}
      />
    </AppLayout>
  );
}

