'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  Printer,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
  AlertCircle,
  Tag,
  Edit3,
  ArrowDownRight,
  ArrowUpRight,
  Server,
  Layers
} from 'lucide-react';
import { 
  PaymentModal, 
  PaymentReceiptModal, 
  ConfirmDeleteModal,
  ExpenseModal
} from '@/components/modals';

const METHOD_OPTIONS = [
  'All',
  'UPI / QR Code',
  'Bank Transfer (NEFT/IMPS)',
  'Cheque',
  'Cash',
  'Credit Card / Debit Card',
  'Razorpay / Gateway'
];

const EXPENSE_CATEGORIES = [
  'All',
  'Cloud / Server Hosting',
  'Software & SaaS Subscriptions',
  'Domain & Web Infrastructure',
  'Office Supplies & Operations',
  'Freelancer / Contractor Fees',
  'Marketing, SEO & Ads',
  'Legal & Professional Services',
  'Miscellaneous Internal Expense'
];

const DEFAULT_EXPENSES = [
  {
    id: 'exp_1',
    title: 'AWS Production Cloud Hosting (Q3 EC2 & RDS Cluster)',
    category: 'Cloud / Server Hosting',
    amount: 14500,
    vendor: 'Amazon Web Services Inc.',
    expense_date: '2026-06-12',
    payment_method: 'Corporate Credit Card',
    reference_no: 'EXP-2026-AWS891',
    notes: 'Primary cloud servers, PostgreSQL databases & backup S3 buckets',
    created_at: '2026-06-12T10:00:00Z'
  },
  {
    id: 'exp_2',
    title: 'Figma Enterprise Organization 10-Seat Annual License',
    category: 'Software & SaaS Subscriptions',
    amount: 18000,
    vendor: 'Figma, Inc.',
    expense_date: '2026-06-05',
    payment_method: 'Corporate Credit Card',
    reference_no: 'EXP-2026-FIG421',
    notes: 'Annual design tooling for UI/UX product teams',
    created_at: '2026-06-05T14:30:00Z'
  },
  {
    id: 'exp_3',
    title: 'Domain Infrastructure Renewal (hertzsoft.com & DNS)',
    category: 'Domain & Web Infrastructure',
    amount: 2850,
    vendor: 'Namecheap Inc.',
    expense_date: '2026-05-28',
    payment_method: 'UPI / Corporate QR',
    reference_no: 'EXP-2026-NC9102',
    notes: 'Annual domain renewals with WhoisGuard & Premium DNS',
    created_at: '2026-05-28T09:15:00Z'
  },
  {
    id: 'exp_4',
    title: 'High-Speed Commercial Fiber Internet (Office Ops)',
    category: 'Office Supplies & Operations',
    amount: 3200,
    vendor: 'Airtel Broadband',
    expense_date: '2026-06-01',
    payment_method: 'Bank Transfer (NEFT/IMPS)',
    reference_no: 'EXP-2026-AIR771',
    notes: 'Primary 500Mbps commercial leased line',
    created_at: '2026-06-01T11:00:00Z'
  }
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  // Navigation tab: 'collections' (commercial receipts) or 'expenses' (internal costs)
  const [activeTab, setActiveTab] = useState('collections');

  // Collections State
  const [payments, setPayments] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    total_project_value: 0,
    total_collected: 0,
    total_pending_due: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Collections Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');

  // Collections Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Collections Modals
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Expenses State (Section 4.8 Finance)
  const [expenses, setExpenses] = useState([]);
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('All');
  const [expenseCurrentPage, setExpenseCurrentPage] = useState(1);
  const [expensePageSize, setExpensePageSize] = useState(10);

  // Expenses Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [activeExpenseToEdit, setActiveExpenseToEdit] = useState(null);
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);

  // Initialize expenses from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('hertzsoft_internal_expenses');
      if (stored) {
        setExpenses(JSON.parse(stored));
      } else {
        setExpenses(DEFAULT_EXPENSES);
        localStorage.setItem('hertzsoft_internal_expenses', JSON.stringify(DEFAULT_EXPENSES));
      }
    } catch (e) {
      setExpenses(DEFAULT_EXPENSES);
    }
  }, []);

  // Sync expenses to localStorage when updated
  const saveExpensesToStorage = (updatedList) => {
    setExpenses(updatedList);
    try {
      localStorage.setItem('hertzsoft_internal_expenses', JSON.stringify(updatedList));
    } catch (e) {
      console.error('Failed to sync expenses to localStorage', e);
    }
  };

  const handleSaveExpense = (newOrUpdatedExpense) => {
    const existingIndex = expenses.findIndex((ex) => ex.id === newOrUpdatedExpense.id);
    let updated;
    if (existingIndex >= 0) {
      updated = [...expenses];
      updated[existingIndex] = newOrUpdatedExpense;
    } else {
      updated = [newOrUpdatedExpense, ...expenses];
    }
    saveExpensesToStorage(updated);
  };

  const confirmDeleteExpense = () => {
    if (!expenseToDelete) return;
    const updated = expenses.filter((ex) => ex.id !== expenseToDelete.id);
    saveExpensesToStorage(updated);
    toast.success('Internal expense record removed.');
    setIsDeleteExpenseModalOpen(false);
    setExpenseToDelete(null);
  };

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
        toast.success('Financial ledger data refreshed!');
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

  // Delete Action for Payment
  const confirmDeletePayment = async () => {
    if (!paymentToDelete) return;
    try {
      setDeleting(true);
      await paymentService.deletePayment(paymentToDelete.id);
      toast.success('Payment transaction record deleted.');
      setIsDeleteModalOpen(false);
      setPaymentToDelete(null);
      await fetchData(false);
    } catch (err) {
      console.error('Failed to delete payment:', err);
      toast.error(err.message || 'Failed to delete payment record.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Payments
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      if (selectedMethod !== 'All') {
        const itemMethod = (item.payment_method || '').toLowerCase();
        const selMethod = selectedMethod.toLowerCase();
        if (!itemMethod.includes(selMethod.split(' ')[0])) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const clientMatch = item.client_name?.toLowerCase().includes(q);
        const companyMatch = item.client_company?.toLowerCase().includes(q);
        const projectMatch = item.project_title?.toLowerCase().includes(q);
        const refMatch = item.transaction_reference?.toLowerCase().includes(q);
        const notesMatch = item.notes?.toLowerCase().includes(q);

        if (!clientMatch && !companyMatch && !projectMatch && !refMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [payments, selectedMethod, searchQuery]);

  // Pagination calculation for Payments
  const totalEntries = filteredPayments.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((ex) => {
      if (selectedExpenseCategory !== 'All' && ex.category !== selectedExpenseCategory) {
        return false;
      }
      if (expenseSearchQuery.trim()) {
        const q = expenseSearchQuery.toLowerCase().trim();
        const titleMatch = ex.title?.toLowerCase().includes(q);
        const vendorMatch = ex.vendor?.toLowerCase().includes(q);
        const refMatch = ex.reference_no?.toLowerCase().includes(q);
        const notesMatch = ex.notes?.toLowerCase().includes(q);
        if (!titleMatch && !vendorMatch && !refMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [expenses, selectedExpenseCategory, expenseSearchQuery]);

  // Pagination for Expenses
  const totalExpenseEntries = filteredExpenses.length;
  const totalExpensePages = Math.ceil(totalExpenseEntries / expensePageSize) || 1;
  const paginatedExpenses = useMemo(() => {
    const start = (expenseCurrentPage - 1) * expensePageSize;
    return filteredExpenses.slice(start, start + expensePageSize);
  }, [filteredExpenses, expenseCurrentPage, expensePageSize]);

  // Total Expenses calculation
  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((acc, ex) => acc + (Number(ex.amount) || 0), 0);
  }, [expenses]);

  const hostingExpenseAmount = useMemo(() => {
    return expenses
      .filter((ex) => ex.category === 'Cloud / Server Hosting' || ex.category === 'Domain & Web Infrastructure')
      .reduce((acc, ex) => acc + (Number(ex.amount) || 0), 0);
  }, [expenses]);

  const softwareExpenseAmount = useMemo(() => {
    return expenses
      .filter((ex) => ex.category === 'Software & SaaS Subscriptions')
      .reduce((acc, ex) => acc + (Number(ex.amount) || 0), 0);
  }, [expenses]);

  const netCashflow = financialSummary.total_collected - totalExpenseAmount;
  const marginPercent = financialSummary.total_collected > 0
    ? Math.round((netCashflow / financialSummary.total_collected) * 100)
    : 0;

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

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const collectionRate = financialSummary.total_project_value > 0
    ? Math.min(100, Math.round((financialSummary.total_collected / financialSummary.total_project_value) * 100))
    : 0;

  return (
    <AppLayout title="Payments & Commercial Finance">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER OJT CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* Card Header (OJT Standard) */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0 flex items-center gap-2">
                {activeTab === 'collections' ? (
                  <>
                    <CreditCard className="w-6 h-6 text-[#4689C8]" />
                    <span>Commercial Payments &amp; Receipts</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-6 h-6 text-[#4689C8]" />
                    <span>Internal Company Operating Expenses</span>
                  </>
                )}
              </h2>
              <p className="text-xs text-[#8898aa] mt-0.5">
                {activeTab === 'collections'
                  ? 'Real-time tracking of received client installments, bank UTR references, and official payment receipts.'
                  : 'Company operating overheads, cloud hosting, software subscriptions, and internal reporting.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === 'collections' ? (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] rounded shadow-sm shadow-[#4689C8]/25 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveExpenseToEdit(null);
                    setIsExpenseModalOpen(true);
                  }}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] rounded shadow-sm shadow-[#4689C8]/25 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Expense</span>
                </button>
              )}

              <button
                onClick={() => fetchData(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh financial ledger"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Section Sub-Navigation Tabs */}
          <div className="flex items-center gap-1 border-b border-[#e9ecef] px-4 sm:px-6 bg-[#f8f9fe]">
            <button
              type="button"
              onClick={() => setActiveTab('collections')}
              className={`pt-3 pb-2.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'collections'
                  ? 'border-[#4689C8] text-[#4689C8] bg-white rounded-t-md shadow-2xs'
                  : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Realized Collections ({payments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`pt-3 pb-2.5 px-3 sm:px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                activeTab === 'expenses'
                  ? 'border-[#4689C8] text-[#4689C8] bg-white rounded-t-md shadow-2xs'
                  : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Internal Expenses ({expenses.length})</span>
            </button>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-6">
            {/* TAB 1: COMMERCIAL COLLECTIONS */}
            {activeTab === 'collections' && (
              <>
                {/* Financial Metrics Cards (OJT Metric Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Total Collections */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Total Collections
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#2dce89] tracking-tight mt-1">
                          {formatCurrency(financialSummary.total_collected)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Status:</span>
                      <span className="font-bold text-[#2dce89]">Realized Funds</span>
                    </div>
                  </div>

                  {/* 2. Total Contract Value */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Total Project Value
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                          {formatCurrency(financialSummary.total_project_value)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4689C8] to-[#5FC8D6] text-white flex items-center justify-center shadow-md shadow-[#4689C8]/25">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Agreed Scope:</span>
                      <span className="font-bold text-[#172b4d]">Active Contracts</span>
                    </div>
                  </div>

                  {/* 3. Pending Due Balance */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Pending Receivables
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#f5365c] tracking-tight mt-1">
                          {formatCurrency(financialSummary.total_pending_due)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f5365c] to-[#e01a47] text-white flex items-center justify-center shadow-md shadow-[#f5365c]/25">
                        <IndianRupee className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Outstanding:</span>
                      <span className="font-bold text-[#f5365c]">To Be Invoiced</span>
                    </div>
                  </div>

                  {/* 4. Collection Rate */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Collection Rate
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#11cdef] tracking-tight mt-1">
                          {collectionRate}%
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#11cdef] to-[#1171ef] text-white flex items-center justify-center shadow-md shadow-[#11cdef]/25">
                        <FileCheck className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe]">
                      <div className="w-full bg-[#e9ecef] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#11cdef] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${collectionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3.5 rounded-lg bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                    <button
                      onClick={() => fetchData(true)}
                      className="px-2.5 py-1 rounded bg-[#f5365c] text-white font-bold hover:bg-[#d6284a] transition cursor-pointer"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Payment Method Quick Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[#8898aa] font-bold uppercase text-[10px] mr-1 shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Method:
                  </span>
                  {METHOD_OPTIONS.map((m) => {
                    const isSelected = selectedMethod === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setSelectedMethod(m);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                          isSelected
                            ? 'bg-[#4689C8] text-white shadow-xs'
                            : 'bg-[#f6f9fc] text-[#525f7f] hover:bg-[#e9ecef]'
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>

                {/* DataTables Controls Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  {/* Page Size Selector */}
                  <div className="flex items-center gap-2 text-xs text-[#525f7f]">
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
                        placeholder="Search client, project, UTR..."
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

                {/* OJT Payments Table */}
                <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                  <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                    <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                      <tr>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Receipt / Ref ID</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Client &amp; Project</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6] text-right">Amount Credited</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Payment Date</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center">Payment Mode</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Recorded By / Remarks</th>
                        <th className="py-3 px-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dee2e6]">
                      {loading && payments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-[#8898aa]">
                            <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                            <span className="text-xs font-semibold">Loading financial payments ledger...</span>
                          </td>
                        </tr>
                      ) : paginatedPayments.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-12 text-center text-[#8898aa]">
                            <CreditCard className="w-8 h-8 mx-auto text-[#adb5bd] mb-2" />
                            <p className="font-semibold text-sm text-[#525f7f]">No payment transactions found</p>
                            <p className="text-xs text-[#8898aa] mt-0.5">
                              {searchQuery || selectedMethod !== 'All'
                                ? 'No results matching your filters. Try resetting search filters.'
                                : 'Record installments received against active client contracts.'}
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedPayments.map((p) => {
                          const receiptId = p.receipt_number || `REC-${new Date(p.payment_date || p.created_at).getFullYear()}-${String(p.id).slice(0, 8).toUpperCase()}`;

                          return (
                            <tr key={p.id} className="hover:bg-[#f6f9fc] transition-colors">
                              {/* Receipt ID & UTR */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                                <div className="font-mono font-bold text-[#172b4d] text-xs">
                                  {receiptId}
                                </div>
                                <div className="text-[11px] text-[#8898aa] font-mono mt-0.5">
                                  UTR: <span className="text-[#525f7f]">{p.transaction_reference || 'N/A'}</span>
                                </div>
                              </td>

                              {/* Client & Project */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                                <div className="font-bold text-[#172b4d] flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#4689C8] shrink-0" />
                                  <span>{p.client_name || 'Client Contact'}</span>
                                </div>
                                {p.client_company && (
                                  <div className="text-[11px] text-[#8898aa] ml-5">
                                    {p.client_company}
                                  </div>
                                )}
                                {p.project_title && (
                                  <div className="text-[11px] text-[#525f7f] font-medium flex items-center gap-1.5 mt-0.5">
                                    <FolderKanban className="w-3 h-3 text-[#5FC8D6] shrink-0" />
                                    {p.project_id ? (
                                      <Link
                                        href={`/projects/view?id=${p.project_id}`}
                                        className="text-[#4689C8] hover:underline"
                                      >
                                        {p.project_title}
                                      </Link>
                                    ) : (
                                      <span>{p.project_title}</span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Amount Credited */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6] text-right font-mono font-bold">
                                <span className="px-2 py-0.5 rounded text-xs bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30">
                                  + {formatCurrency(p.amount_paid)}
                                </span>
                              </td>

                              {/* Payment Date */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                                <div className="font-semibold text-[#172b4d] flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-[#8898aa]" />
                                  <span>{formatDate(p.payment_date)}</span>
                                </div>
                                {p.created_at && (
                                  <div className="text-[10px] text-[#8898aa] mt-0.5">
                                    Logged: {formatDateTime(p.created_at)}
                                  </div>
                                )}
                              </td>

                              {/* Payment Mode */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6] text-center">
                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/25">
                                  {p.payment_method || 'Online'}
                                </span>
                              </td>

                              {/* Recorded By / Remarks */}
                              <td className="py-3 px-3.5 border-r border-[#dee2e6] max-w-xs">
                                <div className="text-[#172b4d] font-semibold text-xs">
                                  {p.recorded_by_name || 'Admin'}
                                </div>
                                {p.notes ? (
                                  <div className="text-[11px] text-[#8898aa] truncate mt-0.5" title={p.notes}>
                                    {p.notes}
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-[#adb5bd] italic">No remarks</span>
                                )}
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-3.5 text-center">
                                <div className="inline-flex items-center gap-1.5 justify-center">
                                  {/* Print Official Receipt Button */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReceiptPayment(p);
                                      setIsReceiptModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-[#f0f7fd] hover:bg-[#e0effa] border border-[#4689C8]/30 rounded transition cursor-pointer"
                                    title="View & Print Official Receipt"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    <span>Receipt</span>
                                  </button>

                                  {/* Admin Delete */}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentToDelete(p);
                                        setIsDeleteModalOpen(true);
                                      }}
                                      className="p-1 text-[#f5365c] hover:bg-[#fdf2f2] rounded transition cursor-pointer"
                                      title="Delete Payment Entry"
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

                {/* DataTables Pagination & Footer Info */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#525f7f]">
                  <div>
                    {totalEntries === 0 ? (
                      'Showing 0 to 0 of 0 entries'
                    ) : (
                      <>
                        Showing{' '}
                        <span className="font-bold text-[#172b4d]">
                          {(currentPage - 1) * pageSize + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-bold text-[#172b4d]">
                          {Math.min(currentPage * pageSize, totalEntries)}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-[#172b4d]">{totalEntries}</span> entries
                        {selectedMethod !== 'All' && ` (filtered from ${payments.length} total entries)`}
                      </>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-2.5 py-1 rounded border border-[#dee2e6] bg-white text-[#525f7f] hover:bg-[#f6f9fc] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                      .map((p, idx, arr) => {
                        const prev = arr[idx - 1];
                        return (
                          <div key={p} className="inline-flex items-center">
                            {prev && p - prev > 1 && (
                              <span className="px-1 text-[#8898aa]">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(p)}
                              className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                                currentPage === p
                                  ? 'bg-[#4689C8] text-white shadow-xs'
                                  : 'bg-white border border-[#dee2e6] text-[#525f7f] hover:bg-[#f6f9fc]'
                              }`}
                            >
                              {p}
                            </button>
                          </div>
                        );
                      })}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-2.5 py-1 rounded border border-[#dee2e6] bg-white text-[#525f7f] hover:bg-[#f6f9fc] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: INTERNAL COMPANY EXPENSES */}
            {activeTab === 'expenses' && (
              <>
                {/* Operational Expense Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 1. Total Operating Expenses */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Total Operating Expenses
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#f5365c] tracking-tight mt-1">
                          {formatCurrency(totalExpenseAmount)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#f5365c] to-[#e01a47] text-white flex items-center justify-center shadow-md shadow-[#f5365c]/25">
                        <Wallet className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Overhead Cost:</span>
                      <span className="font-bold text-[#f5365c]">{expenses.length} Records</span>
                    </div>
                  </div>

                  {/* 2. Cloud & Infra Spend */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Cloud &amp; Servers
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#11cdef] tracking-tight mt-1">
                          {formatCurrency(hostingExpenseAmount)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#11cdef] to-[#1171ef] text-white flex items-center justify-center shadow-md shadow-[#11cdef]/25">
                        <Server className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Hosting &amp; DNS:</span>
                      <span className="font-bold text-[#11cdef]">Core Tech Ops</span>
                    </div>
                  </div>

                  {/* 3. Software & SaaS */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Software &amp; SaaS Tools
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#8965e0] tracking-tight mt-1">
                          {formatCurrency(softwareExpenseAmount)}
                        </div>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8965e0] to-[#724ec7] text-white flex items-center justify-center shadow-md shadow-[#8965e0]/25">
                        <Layers className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Licensing:</span>
                      <span className="font-bold text-[#8965e0]">Dev &amp; Design Tools</span>
                    </div>
                  </div>

                  {/* 4. Net Cashflow Margin */}
                  <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                          Net Operating Cashflow
                        </span>
                        <div className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-1 ${netCashflow >= 0 ? 'text-[#2dce89]' : 'text-[#f5365c]'}`}>
                          {formatCurrency(netCashflow)}
                        </div>
                      </div>
                      <div className={`w-11 h-11 rounded-full text-white flex items-center justify-center shadow-md ${
                        netCashflow >= 0 
                          ? 'bg-gradient-to-tr from-[#2dce89] to-[#20a36b] shadow-[#2dce89]/25'
                          : 'bg-gradient-to-tr from-[#f5365c] to-[#e01a47] shadow-[#f5365c]/25'
                      }`}>
                        {netCashflow >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                      <span>Realized Margin:</span>
                      <span className={`font-bold ${netCashflow >= 0 ? 'text-[#2dce89]' : 'text-[#f5365c]'}`}>
                        {marginPercent}% of Collections
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statutory Disclaimer Note */}
                <div className="p-3 bg-[#f8f9fe] rounded-md border border-[#dee2e6] text-xs text-[#525f7f] leading-relaxed flex items-center gap-2">
                  <span className="font-bold text-[#4689C8] uppercase text-[10px] px-2 py-0.5 rounded bg-white border border-[#dee2e6]">
                    Internal Note
                  </span>
                  <span>
                    Basic expense records are maintained for internal reporting &amp; cashflow planning. As per specification 4.8, this module is not a substitute for statutory accounting or tax advice.
                  </span>
                </div>

                {/* Expense Category Quick Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[#8898aa] font-bold uppercase text-[10px] mr-1 shrink-0 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Category:
                  </span>
                  {EXPENSE_CATEGORIES.map((c) => {
                    const isSelected = selectedExpenseCategory === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setSelectedExpenseCategory(c);
                          setExpenseCurrentPage(1);
                        }}
                        className={`px-3 py-1 rounded-full font-semibold transition cursor-pointer whitespace-nowrap text-xs ${
                          isSelected
                            ? 'bg-[#4689C8] text-white shadow-xs'
                            : 'bg-[#f6f9fc] text-[#525f7f] hover:bg-[#e9ecef]'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>

                {/* Expense DataTables Controls Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs text-[#525f7f]">
                    <span>Show</span>
                    <select
                      value={expensePageSize}
                      onChange={(e) => {
                        setExpensePageSize(Number(e.target.value));
                        setExpenseCurrentPage(1);
                      }}
                      className="px-2.5 py-1 bg-white border border-[#dee2e6] rounded text-xs font-bold text-[#172b4d] focus:outline-none focus:border-[#4689C8] cursor-pointer"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#525f7f] font-semibold">Search:</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={expenseSearchQuery}
                        onChange={(e) => {
                          setExpenseSearchQuery(e.target.value);
                          setExpenseCurrentPage(1);
                        }}
                        placeholder="Search expense, vendor, ref #..."
                        className="w-56 sm:w-64 pl-8 pr-7 py-1.5 text-xs bg-white border border-[#dee2e6] rounded text-[#172b4d] placeholder-[#8898aa] focus:outline-none focus:border-[#4689C8] transition"
                      />
                      <Search className="w-3.5 h-3.5 text-[#8898aa] absolute left-2.5 top-1/2 -translate-y-1/2" />
                      {expenseSearchQuery && (
                        <button
                          onClick={() => {
                            setExpenseSearchQuery('');
                            setExpenseCurrentPage(1);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8898aa] hover:text-[#172b4d]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* OJT Expenses Table */}
                <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                  <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                    <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                      <tr>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6] w-36">Voucher / Ref #</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Expense Title / Description</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Category</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Vendor / Payee</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Date</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6] text-right">Amount (₹)</th>
                        <th className="py-3 px-3.5 border-r border-[#dee2e6]">Payment Mode</th>
                        <th className="py-3 px-3.5 text-center w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#dee2e6]">
                      {paginatedExpenses.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="py-12 text-center text-[#8898aa]">
                            <Wallet className="w-8 h-8 mx-auto text-[#adb5bd] mb-2" />
                            <p className="font-semibold text-sm text-[#525f7f]">No expense records found</p>
                            <p className="text-xs text-[#8898aa] mt-0.5">
                              Record company operating expenses using the "Record Expense" button above.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        paginatedExpenses.map((ex) => (
                          <tr key={ex.id} className="hover:bg-[#f6f9fc] transition-colors">
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] font-mono font-bold text-[#172b4d]">
                              {ex.reference_no}
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <div className="font-bold text-[#172b4d]">{ex.title}</div>
                              {ex.notes && (
                                <div className="text-[11px] text-[#8898aa] mt-0.5 truncate max-w-xs" title={ex.notes}>
                                  {ex.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/20">
                                {ex.category}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] font-semibold text-[#525f7f]">
                              {ex.vendor}
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-[#525f7f]">
                              {formatDate(ex.expense_date)}
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-right font-mono font-bold">
                              <span className="px-2 py-0.5 rounded text-xs bg-[#fdf2f2] text-[#f5365c] border border-[#f5365c]/30">
                                - {formatCurrency(ex.amount)}
                              </span>
                            </td>
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-[#525f7f] text-[11px]">
                              {ex.payment_method}
                            </td>
                            <td className="py-3 px-3.5 text-center">
                              <div className="inline-flex items-center gap-1.5 justify-center">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveExpenseToEdit(ex);
                                    setIsExpenseModalOpen(true);
                                  }}
                                  className="p-1 text-[#4689C8] hover:bg-[#f0f7fd] rounded transition cursor-pointer"
                                  title="Edit Expense Record"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setExpenseToDelete(ex);
                                    setIsDeleteExpenseModalOpen(true);
                                  }}
                                  className="p-1 text-[#f5365c] hover:bg-[#fdf2f2] rounded transition cursor-pointer"
                                  title="Delete Expense Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Expense Pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-[#525f7f]">
                  <div>
                    {totalExpenseEntries === 0 ? (
                      'Showing 0 to 0 of 0 entries'
                    ) : (
                      <>
                        Showing{' '}
                        <span className="font-bold text-[#172b4d]">
                          {(expenseCurrentPage - 1) * expensePageSize + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-bold text-[#172b4d]">
                          {Math.min(expenseCurrentPage * expensePageSize, totalExpenseEntries)}
                        </span>{' '}
                        of{' '}
                        <span className="font-bold text-[#172b4d]">{totalExpenseEntries}</span> entries
                      </>
                    )}
                  </div>

                  <div className="inline-flex items-center gap-1">
                    <button
                      onClick={() => setExpenseCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={expenseCurrentPage === 1}
                      className="px-2.5 py-1 rounded border border-[#dee2e6] bg-white text-[#525f7f] hover:bg-[#f6f9fc] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {Array.from({ length: totalExpensePages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => setExpenseCurrentPage(p)}
                        className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                          expenseCurrentPage === p
                            ? 'bg-[#4689C8] text-white shadow-xs'
                            : 'bg-white border border-[#dee2e6] text-[#525f7f] hover:bg-[#f6f9fc]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}

                    <button
                      onClick={() => setExpenseCurrentPage((prev) => Math.min(prev + 1, totalExpensePages))}
                      disabled={expenseCurrentPage === totalExpensePages || totalExpensePages === 0}
                      className="px-2.5 py-1 rounded border border-[#dee2e6] bg-white text-[#525f7f] hover:bg-[#f6f9fc] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => fetchData(false)}
      />

      {/* Official Payment Receipt Modal */}
      <PaymentReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptPayment(null);
        }}
        payment={activeReceiptPayment}
      />

      {/* Confirm Delete Payment Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setPaymentToDelete(null);
        }}
        onConfirm={confirmDeletePayment}
        loading={deleting}
        title="Delete Payment Record"
        message={`Are you sure you want to delete payment record of ${formatCurrency(paymentToDelete?.amount_paid)} for ${paymentToDelete?.client_name}? This will affect project balance calculations.`}
      />

      {/* Record / Edit Internal Expense Modal */}
      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setActiveExpenseToEdit(null);
        }}
        onSave={handleSaveExpense}
        expense={activeExpenseToEdit}
      />

      {/* Confirm Delete Expense Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteExpenseModalOpen}
        onClose={() => {
          setIsDeleteExpenseModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDeleteExpense}
        title="Delete Operational Expense Record"
        message={`Are you sure you want to delete the expense entry "${expenseToDelete?.title}" for ${formatCurrency(expenseToDelete?.amount)}? This record will be removed from internal cashflow reports.`}
      />
    </AppLayout>
  );
}
