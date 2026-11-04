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
  AlertCircle
} from 'lucide-react';

const PAYMENT_METHODS = [
  'Bank Transfer (NEFT/IMPS)',
  'UPI / QR Code',
  'Cheque',
  'Cash',
  'Credit Card / Debit Card',
  'Razorpay / Gateway'
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
        setNotes(payment.notes || '');
      } else if (projectData) {
        setSelectedProjectId(String(projectData.id));
        setAmount(projectData.due_balance > 0 ? String(projectData.due_balance) : '');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod(PAYMENT_METHODS[0]);
        setTransactionRef('');
        setNotes('');
      } else {
        setSelectedProjectId('');
        setAmount('');
        setPaymentDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod(PAYMENT_METHODS[0]);
        setTransactionRef('');
        setNotes('');
      }
    }
  }, [projectData, payment, isOpen]);

  if (!isOpen || !mounted) return null;

  // Active target project (either from prop or from projectsList selection)
  const activeProject = projectData || projectsList.find((p) => String(p.id) === String(selectedProjectId)) || null;

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const handleProjectSelect = (e) => {
    const projId = e.target.value;
    setSelectedProjectId(projId);
    setError('');

    const found = projectsList.find((p) => String(p.id) === String(projId));
    if (found && found.due_balance > 0) {
      setAmount(String(found.due_balance));
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
        notes: notes.trim() || null
      };

      if (isEdit) {
        await paymentService.updatePayment(payment.id, payload);
        toast.success(`Payment installment of ${formatCurrency(numericAmount)} updated successfully!`);
      } else {
        await paymentService.recordPayment(payload);
        toast.success(`Payment of ${formatCurrency(numericAmount)} recorded successfully!`);
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
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#DFEAF2] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#DFEAF2] bg-[#F4F8FC]">
          <div>
            <h3 className="text-base font-bold text-[#19324D] m-0">
              {isEdit ? 'Edit Payment Installment' : 'Record Payment'}
            </h3>
            <p className="text-xs text-[#71869B] mt-0.5">
              {isEdit
                ? `Update payment installment details for #${payment.id?.slice(0, 8)}`
                : `Credit payment against project #${activeProject?.id ? String(activeProject.id).slice(0, 8) : 'account'}`}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#19324D] hover:text-[#71869B] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Project Selector (If opened without pre-selected project and not editing) */}
        {!projectData && !isEdit && (
          <div className="px-6 py-3.5 bg-[#F4F8FC] border-b border-[#DFEAF2]">
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#4689C8]" />
              <span>Select Target Project <span className="text-[#F5365C] font-bold">*</span></span>
            </label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-[#71869B] py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4689C8]" />
                <span>Loading active client projects...</span>
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={handleProjectSelect}
                required
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition cursor-pointer"
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
          <div className="px-6 py-3.5 bg-[#F4F8FC] border-b border-[#DFEAF2] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#19324D] truncate max-w-[240px]">
                {activeProject.title}
              </div>
              <div className="text-[11px] text-[#71869B] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-[#71869B]" />
                <span>{activeProject.client_company || activeProject.client_name}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-[#71869B] font-bold uppercase tracking-wider">
                Outstanding Due
              </div>
              <div className="text-sm font-extrabold text-[#F5365C] font-mono">
                {formatCurrency(activeProject.due_balance)}
              </div>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#FDF2F2] border border-[#F5365C]/30 text-xs text-[#F5365C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Paid */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Amount Paid (INR) <span className="text-[#F5365C] font-bold">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71869B] font-bold">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-8 pr-3.5 py-2.5 bg-white text-[#19324D] text-base font-bold rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Date */}
            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Payment Date <span className="text-[#F5365C] font-bold">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Payment Mode <span className="text-[#F5365C] font-bold">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition cursor-pointer"
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
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              UTR / Cheque / Transaction Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. HDFC0001234567 or UPI/4231980"
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition font-mono uppercase"
            />
          </div>

          {/* Remarks & Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Payment Remarks & Receipt Notes
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milestone 1 advance clearance or 50% kick-off installment..."
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DFEAF2]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white hover:bg-[#EAF3FB] border border-[#DFEAF2] text-[#71869B] font-semibold text-xs sm:text-sm rounded shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!activeProject && !selectedProjectId)}
              className="px-6 py-2.5 bg-gradient-to-r from-[#20A36B] via-[#28b376] to-[#20a36b] hover:from-[#25a970] hover:to-[#1a8557] text-white font-bold text-xs sm:text-sm rounded shadow-sm shadow-[#20A36B]/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>{isEdit ? 'Updating Payment...' : 'Recording Payment...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Save Changes' : 'Confirm & Record Payment'}</span>
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
