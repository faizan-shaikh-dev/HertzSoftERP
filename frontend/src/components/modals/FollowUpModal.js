'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  XCircle, 
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
  { id: 'Call', label: 'Phone Call', icon: Phone, color: 'text-[#4689C8] bg-blue-50 border-blue-200' },
  { id: 'Meeting', label: 'Meeting / Demo', icon: Calendar, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'Email', label: 'Email Sent', icon: Mail, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Message', label: 'WhatsApp / SMS', icon: MessageSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'Other', label: 'Other Note', icon: FileText, color: 'text-[#525f7f] bg-slate-50 border-slate-200' }
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              Follow-up & Interaction
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              {lead.lead_number ? `#${lead.lead_number} • ` : ''}{lead.name} {lead.company_name ? `(${lead.company_name})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#e9ecef] bg-[#f8f9fe] px-6 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab('log')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'log'
                ? 'border-[#4689C8] text-[#4689C8]'
                : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Follow-up</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-4 text-xs font-bold transition border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-[#4689C8] text-[#4689C8]'
                : 'border-transparent text-[#8898aa] hover:text-[#525f7f]'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Activity History</span>
            <span className="ml-1 px-1.5 py-0.2 bg-[#e9ecef] text-[#525f7f] rounded-full text-[10px] font-bold">
              {history.length}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-white">
          {error && (
            <div className="mb-4 p-3 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'log' ? (
            /* TAB 1: LOG FOLLOW-UP FORM */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. Follow-up Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                  Interaction Channel / Type <span className="text-[#f5365c] font-bold ml-0.5">*</span>
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
                        className={`p-2.5 rounded border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#4689C8] text-white border-[#4689C8] shadow-xs'
                            : 'bg-white text-[#525f7f] border-[#dee2e6] hover:bg-[#f8f9fe]'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#8898aa]'}`} />
                        <span className="text-[11px]">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Date & Time of Follow-up and Assigned Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                    Interaction Date & Time <span className="text-[#f5365c] font-bold ml-0.5">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={followUpAt}
                    onChange={(e) => setFollowUpAt(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                    Conducted By / Owner
                  </label>
                  <select
                    value={ownerId}
                    onChange={(e) => setOwnerId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
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
                <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                  Interaction Outcome
                </label>
                <select
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer font-medium"
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
                    className="mt-2 w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
                  />
                )}
              </div>

              {/* 4. Notes & Summary */}
              <div>
                <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                  Conversation & Technical Notes <span className="text-[#f5365c] font-bold ml-0.5">*</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Key discussion points, client requirements discussed, tech stack preferences, pricing feedback, next steps..."
                  required
                  className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition resize-y"
                />
              </div>

              {/* 5. Next Follow-up Schedule (Optional Reminder) */}
              <div className="p-4 bg-[#f8f9fe] rounded-md border border-[#dee2e6] space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#172b4d] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4689C8]" />
                    Schedule Next Follow-up (In-App Reminder)
                  </label>
                  {nextFollowUpAt && (
                    <button
                      type="button"
                      onClick={() => setNextFollowUpAt('')}
                      className="text-[11px] text-[#f5365c] hover:underline font-semibold cursor-pointer"
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
                    className="flex-1 px-3 py-2 bg-white text-[#172b4d] text-xs rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                  {/* Quick Shortcut Buttons */}
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(1, 11))}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#f8f9fe] border border-[#dee2e6] rounded text-xs font-medium text-[#525f7f] cursor-pointer transition"
                  >
                    Tomorrow 11 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(3, 15))}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#f8f9fe] border border-[#dee2e6] rounded text-xs font-medium text-[#525f7f] cursor-pointer transition"
                  >
                    In 3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextFollowUpAt(getPresetFutureDate(7, 11))}
                    className="px-2.5 py-1.5 bg-white hover:bg-[#f8f9fe] border border-[#dee2e6] rounded text-xs font-medium text-[#525f7f] cursor-pointer transition"
                  >
                    Next Week
                  </button>
                </div>
              </div>

              {/* 6. Optional: Update Pipeline Status */}
              <div className="flex items-center justify-between p-3.5 bg-[#f8f9fe] rounded-md border border-[#dee2e6] text-xs">
                <div>
                  <span className="font-semibold text-[#172b4d]">Update Lead Pipeline Status:</span>
                  <p className="text-[11px] text-[#8898aa]">Advance or synchronize pipeline status with this interaction.</p>
                </div>
                <select
                  value={updateLeadStatus}
                  onChange={(e) => setUpdateLeadStatus(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold rounded border bg-white border-[#dee2e6] text-[#172b4d] outline-none cursor-pointer"
                >
                  {['New', 'Contacted', 'Qualified', 'Quotation Sent', 'Negotiation', 'Won', 'Lost', 'On Hold'].map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Form Action Button - Full-Width OJT Royal Blue */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#4689C8] hover:bg-[#3876b0] text-white font-bold text-sm rounded shadow-md shadow-[#4689C8]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Follow-up...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
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
                <div className="py-12 text-center text-[#8898aa]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                  <span className="text-xs font-medium">Loading interaction history...</span>
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-[#8898aa] bg-[#f8f9fe] rounded-lg border border-dashed border-[#dee2e6]">
                  <Clock className="w-8 h-8 text-[#adb5bd] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#172b4d]">No follow-ups recorded yet</p>
                  <p className="text-[11px] text-[#8898aa] mt-0.5">
                    Switch to the log tab to record your first conversation or meeting with this client.
                  </p>
                  <button
                    onClick={() => setActiveTab('log')}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-[#4689C8] bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log First Interaction</span>
                  </button>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dee2e6]">
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
                        <div className="bg-white p-4 rounded-lg border border-[#e9ecef] shadow-xs hover:border-[#dee2e6] transition space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-[#172b4d]">
                                  {item.follow_up_type}
                                </span>
                                {item.outcome && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-[#4689C8] rounded border border-blue-100">
                                    {item.outcome}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#8898aa] mt-0.5">
                                {formatDateTime(item.follow_up_at)}
                                {item.owner_name && (
                                  <span> • by <strong className="text-[#525f7f]">{item.owner_name}</strong></span>
                                )}
                              </div>
                            </div>

                            <button
                              onClick={() => handleDelete(item.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-[#adb5bd] hover:text-[#f5365c] transition cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Notes */}
                          {item.notes && (
                            <p className="text-xs text-[#525f7f] whitespace-pre-wrap leading-relaxed bg-[#f8f9fe] p-3 rounded border border-[#e9ecef]">
                              {item.notes}
                            </p>
                          )}

                          {/* Next Follow-up Alert / Status */}
                          {item.next_follow_up_at && (
                            <div className={`flex items-center justify-between p-2.5 rounded text-xs ${
                              item.completed_at
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : isOverdue
                                ? 'bg-red-50 text-red-800 border border-red-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <Clock className={`w-3.5 h-3.5 ${item.completed_at ? 'text-emerald-600' : isOverdue ? 'text-red-600' : 'text-[#4689C8]'}`} />
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded bg-white border border-[#dee2e6] hover:bg-[#f8f9fe] text-[#172b4d] cursor-pointer transition"
                                >
                                  {completingId === item.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
