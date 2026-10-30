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

export default function PaymentModal({ isOpen, onClose, project = null, onSuccess }) {
  const [mounted, setMounted] = useState(false);

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
    if (isOpen && !project) {
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
  }, [isOpen, project]);

  // Reset or initialize form values when modal opens or project prop changes
  useEffect(() => {
    if (isOpen) {
      setError('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setPaymentMethod(PAYMENT_METHODS[0]);
      setTransactionRef('');
      setNotes('');

      if (project) {
        setSelectedProjectId(String(project.id));
        setAmount(project.due_balance > 0 ? String(project.due_balance) : '');
      } else {
        setSelectedProjectId('');
        setAmount('');
      }
    }
  }, [project, isOpen]);

  if (!isOpen || !mounted) return null;

  // Active target project (either from prop or from projectsList selection)
  const activeProject = project || projectsList.find((p) => String(p.id) === String(selectedProjectId)) || null;

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

    if (!activeProject) {
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
        project_id: activeProject.id,
        amount_paid: numericAmount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        transaction_reference: transactionRef.trim() || null,
        notes: notes.trim() || null
      };

      await paymentService.recordPayment(payload);
      toast.success(`Payment of ${formatCurrency(numericAmount)} recorded successfully!`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error recording payment:', err);
      const msg = err.message || 'Failed to record installment payment.';
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
        className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              Record Payment
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              {activeProject ? `Credit payment against project #${activeProject.id}` : 'Record received funds against client contract'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Project Selector (If opened without pre-selected project) */}
        {!project && (
          <div className="px-6 py-3.5 bg-[#f8f9fe] border-b border-[#dee2e6]">
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-[#4689C8]" />
              <span>Select Target Project <span className="text-[#f5365c] font-bold">*</span></span>
            </label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-[#8898aa] py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#4689C8]" />
                <span>Loading active client projects...</span>
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={handleProjectSelect}
                required
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
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
          <div className="px-6 py-3.5 bg-[#f8f9fe] border-b border-[#dee2e6] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#172b4d] truncate max-w-[240px]">
                {activeProject.title}
              </div>
              <div className="text-[11px] text-[#8898aa] flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-[#adb5bd]" />
                <span>
                  {activeProject.client_company ? `${activeProject.client_company} (${activeProject.client_name})` : activeProject.client_name}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-[#8898aa]">
                Outstanding Due
              </span>
              <div className="text-sm font-bold text-[#fb6340]">
                {formatCurrency(activeProject.due_balance)}
              </div>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount to Credit */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Payment Amount (INR) <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898aa]">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-9 pr-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Payment Date <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Payment Mode <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction UTR / Ref */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              UTR / Cheque / Transaction Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI/20261028/789234 or HDFC000123"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Payment Remarks & Receipt Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milestone installment received via bank transfer..."
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition resize-y"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#e9ecef] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white hover:bg-[#f6f9fc] border border-[#dee2e6] text-[#525f7f] font-semibold text-xs sm:text-sm rounded shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !activeProject}
              className="px-6 py-2.5 bg-gradient-to-r from-[#2dce89] via-[#28b376] to-[#20a36b] hover:from-[#25a970] hover:to-[#1a8557] text-white font-bold text-xs sm:text-sm rounded shadow-sm shadow-[#2dce89]/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Recording Payment...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Record Payment</span>
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
