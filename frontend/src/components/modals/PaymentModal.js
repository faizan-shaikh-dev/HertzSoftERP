'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import paymentService from '@/services/paymentService';
import projectService from '@/services/projectService';
import { 
  X, 
  CreditCard, 
  IndianRupee, 
  Calendar, 
  FileText, 
  Loader2, 
  Building2,
  FolderKanban
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-50/90 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Record Payment Installment
              </h3>
              <p className="text-xs text-slate-500">
                {activeProject ? `Credit payment against project #${activeProject.id}` : 'Record received funds against client contract'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector (If opened without pre-selected project) */}
        {!project && (
          <div className="px-6 py-3.5 bg-slate-50/90 border-b border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
              <span>Select Target Project *</span>
            </label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-xs text-slate-500 py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Loading active client projects...</span>
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={handleProjectSelect}
                required
                className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none transition cursor-pointer"
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

        {/* Project Balance Summary Banner (when project is active) */}
        {activeProject && (
          <div className="px-6 py-3 bg-emerald-50/50 border-b border-slate-200 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-slate-900 truncate max-w-[240px]">
                {activeProject.title}
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>
                  {activeProject.client_company ? `${activeProject.client_company} (${activeProject.client_name})` : activeProject.client_name}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Outstanding Due
              </span>
              <div className="text-sm font-extrabold text-amber-600">
                {formatCurrency(activeProject.due_balance)}
              </div>
            </div>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Amount to Credit */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Payment Amount (INR) *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IndianRupee className="w-4 h-4" />
              </div>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none transition"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Payment Mode
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 outline-none transition cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Transaction UTR / Ref */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              UTR / Cheque / Transaction Reference
            </label>
            <input
              type="text"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              placeholder="e.g. UPI/20261028/789234 or HDFC000123"
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 outline-none transition"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Payment Remarks & Receipt Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Milestone installment received via bank transfer..."
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-emerald-600 outline-none transition"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !activeProject}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm & Credit Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
