'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import paymentService from '@/services/paymentService';
import projectService from '@/services/projectService';
import { 
  XCircle, 
  IndianRupee, 
  Loader2, 
  Building2,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Receipt,
  FileText
} from 'lucide-react';

const PAYMENT_METHODS = [
  'UPI',
  'NEFT / IMPS (Bank Transfer)',
  'Cheque',
  'Cash',
  'Credit Card / Debit Card',
  'Payment Gateway'
];

export default function PaymentModal({ isOpen, onClose, project = null, prefilledProject = null, payment = null, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const isEdit = !!payment;
  const projectData = project || prefilledProject;

  // Projects list for dropdown when project is not pre-selected
  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [transactionRef, setTransactionRef] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Part Payment');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch available projects if no specific project is provided
  useEffect(() => {
    if (isOpen && !projectData && !payment) {
      setLoadingProjects(true);
      projectService.getProjects()
        .then((res) => {
          setProjectsList(res.data || []);
        })
        .catch((err) => {
          console.error('Failed to load projects for payment modal:', err);
          setError('Failed to load projects list.');
        })
        .finally(() => {
          setLoadingProjects(false);
        });
    }
  }, [isOpen, projectData, payment]);

  // Reset or initialize form values when modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setError('');

      if (payment) {
        setSelectedProjectId(String(payment.project_id || projectData?.id || ''));
        setAmount(payment.amount_paid ? String(payment.amount_paid) : '');
        setPaymentDate(payment.payment_date ? payment.payment_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setPaymentMethod(payment.payment_method || PAYMENT_METHODS[0]);
        setTransactionRef(payment.transaction_reference || '');
        setInvoiceNumber(payment.invoice_number || '');
        setPaymentStatus(payment.payment_status || 'Part Payment');
        setNotes(payment.notes || '');
      } else if (projectData) {
        setSelectedProjectId(String(projectData.id));
        setAmount(projectData.due_balance > 0 ? String(projectData.due_balance) : '');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod(PAYMENT_METHODS[0]);
        setTransactionRef('');
        setInvoiceNumber(projectData.invoice_number || 'HIN26001');
        setPaymentStatus('Part Payment');
        setNotes('');
      } else {
        setSelectedProjectId('');
        setAmount('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod(PAYMENT_METHODS[0]);
        setTransactionRef('');
        setInvoiceNumber('HIN26001');
        setPaymentStatus('Part Payment');
        setNotes('');
      }
    }
  }, [projectData, payment, isOpen]);

  if (!isOpen || !mounted) return null;

  const activeProject = projectData || projectsList.find((p) => String(p.id) === String(selectedProjectId));

  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(Number(val));
  };

  const handleProjectSelect = (e) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    const chosen = projectsList.find((p) => String(p.id) === String(projId));
    if (chosen && chosen.due_balance > 0) {
      setAmount(String(chosen.due_balance));
    } else {
      setAmount('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!activeProject && !selectedProjectId) {
      setError('Please select a project to credit payment against.');
      return;
    }

    const numericAmount = Number(amount);
    if (!amount || numericAmount <= 0) {
      setError('Please specify a valid payment amount greater than zero.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        project_id: activeProject?.id || selectedProjectId,
        amount_paid: numericAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || null,
        invoice_number: invoiceNumber.trim() || null,
        invoice_amount: activeProject?.total_cost || null,
        payment_status: paymentStatus,
        notes: notes.trim() || null
      };

      if (isEdit) {
        await paymentService.updatePayment(payment.id, payload);
        toast.success(`Payment installment of ${formatCurrency(numericAmount)} updated successfully!`);
      } else {
        const res = await paymentService.recordPayment(payload);
        toast.success(`Payment recorded! Official Receipt #${res.data?.receipt_number || 'Generated'} issued.`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to save installment payment.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-[#DFEAF2] overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#0077B6] text-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/20 text-white flex items-center justify-center">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white m-0">
                {isEdit ? 'Edit Payment Installment' : 'Record Payment & Issue Receipt'}
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Issues sequential receipt number (e.g. HIN26001-R1 / HR26001).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-white hover:bg-white/20 transition cursor-pointer p-1 rounded-full"
            aria-label="Close"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Project Selector */}
        {!projectData && !isEdit && (
          <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#0077B6]" />
              <span>Select Target Project <span className="text-red-500 font-bold">*</span></span>
            </label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0077B6]" />
                <span>Loading active client projects...</span>
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={handleProjectSelect}
                required
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none cursor-pointer"
              >
                <option value="">-- Choose a Project to credit --</option>
                {projectsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} ({p.client_company ? `${p.client_company} - ${p.client_name}` : p.client_name}) — Due: {formatCurrency(p.due_balance)}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Project Balance Summary Banner */}
        {activeProject && (
          <div className="px-6 py-3 bg-[#E0F2FE] border-b border-[#BAE6FD] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#0077B6] truncate max-w-[240px]">
                {activeProject.title}
              </div>
              <div className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-500" />
                <span>{activeProject.client_company || activeProject.client_name}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Outstanding Due
              </div>
              <div className="text-sm font-extrabold text-red-600 font-mono">
                {formatCurrency(activeProject.due_balance)}
              </div>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Amount Received (INR) <span className="text-red-500 font-bold">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 80000"
                className="w-full pl-8 pr-3.5 py-2.5 bg-white text-slate-900 text-base font-bold rounded-md border border-slate-300 focus:border-[#0077B6] outline-none font-mono"
              />
            </div>
          </div>

          {/* Invoice Number & Payment Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-[#0077B6]" />
                <span>Against Invoice No.</span>
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. HIN26001"
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Status
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none cursor-pointer"
              >
                <option value="Part Payment">Part Payment</option>
                <option value="Full Payment">Full Payment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Date <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Mode <span className="text-red-500 font-bold">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none cursor-pointer"
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              UTR / Transaction ID / Reference No.
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. 687549021359"
              className="w-full px-3.5 py-2.5 bg-white text-slate-900 text-sm rounded-md border border-slate-300 focus:border-[#0077B6] outline-none font-mono uppercase"
            />
          </div>

          {/* Remarks & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Payment Remarks & Receipt Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 40% kick-off installment credited via UPI..."
              className="w-full px-3.5 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-300 focus:border-[#0077B6] outline-none resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold text-xs rounded transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!activeProject && !selectedProjectId)}
              className="px-6 py-2.5 bg-[#0077B6] hover:bg-[#005f92] text-white font-bold text-xs sm:text-sm rounded shadow-xs transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Issuing Receipt...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Save Changes' : 'Confirm & Issue Official Receipt'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
