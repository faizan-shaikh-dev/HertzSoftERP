'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  XCircle,
  Wallet,
  IndianRupee,
  Building2,
  Calendar,
  CheckCircle2,
  CreditCard,
  Tag,
  FileText,
  Loader2
} from 'lucide-react';
import { toast } from 'react-toastify';

const EXPENSE_CATEGORIES = [
  'Cloud / Server Hosting',
  'Software & SaaS Subscriptions',
  'Domain & Web Infrastructure',
  'Office Supplies & Operations',
  'Freelancer / Contractor Fees',
  'Marketing, SEO & Ads',
  'Legal & Professional Services',
  'Miscellaneous Internal Expense'
];

const PAYMENT_METHODS = [
  'Corporate Credit Card',
  'Bank Transfer (NEFT/IMPS)',
  'UPI / Corporate QR',
  'Company Debit Card',
  'Cash Reimbursement'
];

export default function ExpenseModal({ isOpen, onClose, onSave, expense = null }) {
  const [mounted, setMounted] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        setTitle(expense.title || '');
        setCategory(expense.category || EXPENSE_CATEGORIES[0]);
        setAmount(expense.amount ? String(expense.amount) : '');
        setVendor(expense.vendor || '');
        setExpenseDate(expense.expense_date ? expense.expense_date.slice(0, 10) : new Date().toISOString().slice(0, 10));
        setPaymentMethod(expense.payment_method || PAYMENT_METHODS[0]);
        setReferenceNo(expense.reference_no || '');
        setNotes(expense.notes || '');
      } else {
        setTitle('');
        setCategory(EXPENSE_CATEGORIES[0]);
        setAmount('');
        setVendor('');
        setExpenseDate(new Date().toISOString().slice(0, 10));
        setPaymentMethod(PAYMENT_METHODS[0]);
        setReferenceNo('');
        setNotes('');
      }
      setError('');
    }
  }, [isOpen, expense]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Expense description / title is required.');
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please provide a valid positive expense amount.');
      return;
    }

    const newExpense = {
      id: expense?.id || `exp_${Date.now()}`,
      title: title.trim(),
      category,
      amount: numAmount,
      vendor: vendor.trim() || 'Direct Vendor',
      expense_date: expenseDate,
      payment_method: paymentMethod,
      reference_no: referenceNo.trim() || `EXP-${new Date(expenseDate).getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      notes: notes.trim(),
      created_at: expense?.created_at || new Date().toISOString()
    };

    onSave(newExpense);
    toast.success(expense ? 'Expense record updated' : 'Operational expense recorded');
    onClose();
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="fixed inset-0 -z-10" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-[#dee2e6] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e9ecef] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#326fa8] to-[#4689C8] flex items-center justify-center text-white shadow-sm">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#172b4d] tracking-tight">
                {expense ? 'Edit Operational Expense' : 'Record Internal Expense'}
              </h3>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Internal company reporting &amp; cashflow cost management
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#adb5bd] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-6 h-6 stroke-[1.5]" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c]">
              {error}
            </div>
          )}

          {/* Description & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Expense Title / Description <span className="text-[#f5365c]">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AWS Production Cloud Hosting Q3"
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-sm rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Category <span className="text-[#f5365c]">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs font-semibold rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none cursor-pointer"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Amount (INR ₹) <span className="text-[#f5365c]">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 bg-white text-[#172b4d] text-sm font-semibold rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Vendor & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Vendor / Payee
              </label>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Amazon Web Services / Namecheap"
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Expense Date <span className="text-[#f5365c]">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* Payment Method & Invoice Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
                Vendor Bill / Invoice Ref #
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. AWS-992144"
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs font-mono rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* Internal Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#525f7f] uppercase tracking-wider">
              Internal Reporting Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Operational justification or project allocation notes..."
              className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none transition resize-none"
            />
          </div>

          {/* Dual-Button Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#e9ecef]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded border border-[#dee2e6] text-[#525f7f] hover:bg-[#f6f9fc] font-semibold text-xs tracking-wide transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8c] hover:to-[#3876b0] text-white font-bold text-xs tracking-wide shadow-md shadow-[#4689C8]/25 transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{expense ? 'Update Expense' : 'Save Expense Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

