'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Phone, 
  Mail, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Trash2,
  Building2,
  User,
  Plus
} from 'lucide-react';
import { toast } from 'react-toastify';
import leadService from '@/services/leadService';

const FOLLOW_UP_TYPES = [
  { id: 'Call', label: 'Phone Call', icon: Phone, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'Meeting', label: 'Meeting / Demo', icon: Calendar, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Email', label: 'Email Sent', icon: Mail, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Message', label: 'WhatsApp / SMS', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Other', label: 'Other Note', icon: FileText, color: 'text-slate-600 bg-slate-50 border-slate-200' }
];

const COMMON_OUTCOMES = [
  'Interested — Follow-up Needed',
  'Quotation / Scope Requested',
  'Demo / Technical Meeting Scheduled',
  'Price Negotiation in Progress',
  'Client Busy — Call Rescheduled',
  'No Response / Voicemail',
  'Positive — Decision Pending',
  'Agreement Reached / Won',
  'Not Interested / Dropped',
  'Other / Custom Outcome'
];

export default function FollowUpModal({
  isOpen,
  onClose,
  lead,
  assignees = [],
  onSuccess
}) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('log'); // 'log' or 'history'

  // Log Form State
  const [followUpType, setFollowUpType] = useState('Call');
  const [followUpAt, setFollowUpAt] = useState('');
  const [outcome, setOutcome] = useState(COMMON_OUTCOMES[0]);
  const [customOutcome, setCustomOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [nextFollowUpAt, setNextFollowUpAt] = useState('');
  const [updateLeadStatus, setUpdateLeadStatus] = useState('');

  // History State
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format current local datetime for datetime-local input
  const getNowLocal = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  const getPresetFutureDate = (daysAhead, hours = 11) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    target.setHours(hours, 0, 0, 0);
    const offset = target.getTimezoneOffset() * 60000;
    return new Date(target.getTime() - offset).toISOString().slice(0, 16);
  };

  // Reset or Fetch on open
  useEffect(() => {
    if (isOpen && lead) {
      setFollowUpType('Call');
      setFollowUpAt(getNowLocal());
      setOutcome(COMMON_OUTCOMES[0]);
      setCustomOutcome('');
      setNotes('');
      setOwnerId(lead.assigned_to || '');
      setNextFollowUpAt('');
      setUpdateLeadStatus(lead.status || '');
      setError('');
      loadHistory();
    }
  }, [isOpen, lead]);

  const loadHistory = async () => {
    if (!lead?.id) return;
    try {
      setLoadingHistory(true);
      const res = await leadService.getFollowUps(lead.id);
      setHistory(res.data || []);
    } catch (err) {
      console.error('Failed to load follow-up history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  if (!isOpen || !mounted || !lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please enter notes summarizing the interaction.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const finalOutcome = outcome === 'Other / Custom Outcome'
        ? (customOutcome.trim() || 'Custom Outcome')
        : (customOutcome.trim() ? `${outcome} — ${customOutcome.trim()}` : outcome);

      const payload = {
        follow_up_at: followUpAt ? new Date(followUpAt).toISOString() : new Date().toISOString(),
        follow_up_type: followUpType,
        outcome: finalOutcome,
        notes: notes.trim(),
        owner_id: ownerId || undefined,
        next_follow_up_at: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null,
        update_lead_status: updateLeadStatus !== lead.status ? updateLeadStatus : undefined
      };

      await leadService.createFollowUp(lead.id, payload);
      toast.success('Follow-up interaction recorded successfully!');
      
      if (onSuccess) {
        onSuccess();
      }

      // Switch to history or close
      await loadHistory();
      setActiveTab('history');
      setNotes('');
      setNextFollowUpAt('');
    } catch (err) {
      console.error('Failed to create follow-up:', err);
      setError(err.message || 'Failed to record follow-up.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async (followUpId) => {
    try {
      setCompletingId(followUpId);
      await leadService.completeFollowUp(followUpId);
      toast.success('Follow-up marked as completed!');
      loadHistory();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to complete follow-up');
    } finally {
      setCompletingId(null);
    }
  };

  const handleDelete = async (followUpId) => {
    if (!confirm('Are you sure you want to delete this follow-up log?')) return;
    try {
      await leadService.deleteFollowUp(followUpId);
      toast.success('Follow-up record removed.');
      loadHistory();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.message || 'Failed to delete follow-up');
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Lead Details */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50 via-sky-50 to-white border-b border-blue-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {lead.lead_number && (
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded border border-blue-200">
                  #{lead.lead_number}
                </span>
              )}
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {lead.name}
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border bg-white text-slate-700 border-slate-200">
                {lead.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              {lead.company_name && (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  {lead.company_name}
                </span>
              )}
              <span className="flex items-center gap-1 font-mono text-slate-500">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {lead.phone}
              </span>
              {lead.service_interest && (
                <span className="text-slate-400 truncate max-w-[200px]">
                  • {lead.service_interest}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/60 px-5 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'log'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Follow-up Interaction</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity History</span>
            <span className="ml-1 px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
              {history.length}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'log' ? (
            /* TAB 1: LOG FOLLOW-UP FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Follow-up Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Interaction Channel / Type <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {FOLLOW_UP_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = followUpType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setFollowUpType(type.id)}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                        <span className="text-[11px]">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Date & Time of Follow-up and Assigned Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Interaction Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpAt}
                    onChange={(e) => setFollowUpAt(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Conducted By / Owner
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select Team Member</option>
                    {assignees.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 3. Outcome Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Interaction Outcome
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none font-medium"
                >
                  {COMMON_OUTCOMES.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>

                {outcome === 'Other / Custom Outcome' && (
                  <input
                    type="text"
                    value={customOutcome}
                    onChange={(e) => setCustomOutcome(e.target.value)}
                    placeholder="Enter specific outcome details..."
                    className="mt-2 w-full px-3 py-1.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 outline-none"
                  />
                )}
              </div>

              {/* 4. Notes & Summary */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Conversation & Technical Notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Key discussion points, client requirements discussed, tech stack preferences, pricing feedback, next steps..."
                  required
                  className="w-full p-2.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* 5. Next Follow-up Schedule (Optional Reminder) */}
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Schedule Next Follow-up (In-App Reminder)
                  </label>
                  {nextFollowUpAt && (
                    <button
                      type="button"
                      onClick={() => setNextFollowUpAt('')}
                      className="text-[10px] text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Clear Schedule
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    value={nextFollowUpAt}
                    onChange={(e) => setNextFollowUpAt(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white text-xs text-slate-900 border border-slate-300 rounded-md focus:border-blue-600 outline-none"
                  />
                  {/* Quick Shortcut Buttons */}
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(1, 11))}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    Tomorrow 11 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(3, 15))}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(7, 11))}
                    className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-medium text-slate-700 cursor-pointer"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              {/* 6. Optional: Update Pipeline Status */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-800">Update Lead Pipeline Status:</span>
                  <p className="text-[11px] text-slate-500">Automatically advance status based on this interaction outcome.</p>
                </div>
                <select
                  value={updateLeadStatus}
                  onChange={(e) => setUpdateLeadStatus(e.target.value)}
                  className="px-2.5 py-1 text-xs font-bold rounded border bg-white border-slate-300 outline-none cursor-pointer"
                >
                  {['New', 'Contacted', 'Qualified', 'Quotation Sent', 'Negotiation', 'Won', 'Lost', 'On Hold'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Follow-up...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Record Follow-up</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* TAB 2: ACTIVITY TIMELINE */
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                  <span className="text-xs font-medium">Loading interaction history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No follow-ups recorded yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Switch to the log tab to record your first conversation or meeting with this client.
                  </p>
                  <button
                    onClick={() => setActiveTab('log')}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log First Interaction</span>
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {history.map((item) => {
                    const typeConfig = FOLLOW_UP_TYPES.find((t) => t.id === item.follow_up_type) || FOLLOW_UP_TYPES[0];
                    const Icon = typeConfig.icon;
                    const isPendingNext = item.next_follow_up_at && !item.completed_at;
                    const isOverdue = isPendingNext && new Date(item.next_follow_up_at) < new Date();

                    return (
                      <div key={item.id} className="relative group">
                        {/* Timeline Icon Node */}
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center border ${typeConfig.color} ring-4 ring-white`}>
                          <Icon className="w-2.5 h-2.5" />
                        </div>

                        {/* Card Content */}
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:border-slate-300 transition space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-800">
                                  {item.follow_up_type}
                                </span>
                                {item.outcome && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded border border-blue-100">
                                    {item.outcome}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {formatDateTime(item.follow_up_at)}
                                {item.owner_name && (
                                  <span> • by <strong className="text-slate-600">{item.owner_name}</strong></span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-600 transition cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50/70 p-2.5 rounded border border-slate-100">
                              {item.notes}
                            </p>
                          )}

                          {/* Next Follow-up Alert / Status */}
                          {item.next_follow_up_at && (
                            <div className={`flex items-center justify-between p-2 rounded text-xs ${
                              item.completed_at
                                ? 'bg-emerald-50/60 text-emerald-800 border border-emerald-100'
                                : isOverdue
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-100'
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <Clock className={`w-3.5 h-3.5 ${item.completed_at ? 'text-emerald-600' : isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                                <span>
                                  {item.completed_at ? 'Follow-up Completed' : isOverdue ? 'Overdue Follow-up:' : 'Next Scheduled Follow-up:'}
                                  {' '}
                                  <strong>{formatDateTime(item.next_follow_up_at)}</strong>
                                </span>
                              </div>

                              {!item.completed_at && (
                                <button
                                  type="button"
                                  onClick={() => handleComplete(item.id)}
                                  disabled={completingId === item.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 cursor-pointer"
                                >
                                  {completingId === item.id ? (
                                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                  )}
                                  <span>Mark Done</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

