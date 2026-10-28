'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import certificateService from '@/services/certificateService';
import { 
  X, 
  Award, 
  User, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar, 
  Star, 
  IndianRupee, 
  Loader2, 
  FileCheck 
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Offer Letter',
  'Internship Certificate',
  'Experience Letter'
];

const DOMAIN_OPTIONS = [
  'FullStack Software Engineer',
  'Backend Developer (Node.js/Python)',
  'Frontend Developer (React/Next.js)',
  'Cloud & DevOps Engineer',
  'Mobile App Developer (Flutter/React Native)',
  'UI/UX Product Designer',
  'QA & Automation Test Engineer',
  'Data Analyst / AI Specialist'
];

const PERFORMANCE_RATINGS = [
  'Outstanding (A+)',
  'Excellent (A)',
  'Very Good (B+)',
  'Good (B)'
];

export default function CertificateModal({ isOpen, onClose, onSuccess }) {
  const [mounted, setMounted] = useState(false);

  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePhone, setCandidatePhone] = useState('');
  const [courseOrDomain, setCourseOrDomain] = useState(DOMAIN_OPTIONS[0]);
  const [customDomain, setCustomDomain] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [performanceRating, setPerformanceRating] = useState('Excellent (A)');
  const [stipend, setStipend] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setDocumentType(DOCUMENT_TYPES[0]);
      setCandidateName('');
      setCandidateEmail('');
      setCandidatePhone('');
      setCourseOrDomain(DOMAIN_OPTIONS[0]);
      setCustomDomain('');
      setStartDate('');
      setEndDate(new Date().toISOString().slice(0, 10));
      setIssueDate(new Date().toISOString().slice(0, 10));
      setPerformanceRating('Excellent (A)');
      setStipend('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!candidateName.trim()) {
      setError('Please provide candidate / employee full name.');
      return;
    }

    const domainFinal = customDomain.trim() || courseOrDomain;
    if (!domainFinal.trim()) {
      setError('Role or specialization domain is required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        document_type: documentType,
        candidate_name: candidateName.trim(),
        candidate_email: candidateEmail.trim() || null,
        candidate_phone: candidatePhone.trim() || null,
        course_or_domain: domainFinal,
        start_date: startDate || null,
        end_date: endDate || null,
        issue_date: issueDate,
        performance_rating: performanceRating,
        stipend: stipend ? Number(stipend) : null
      };

      const res = await certificateService.issueCertificate(payload);
      toast.success(`${documentType} issued! Cert #${res.data?.certificate_number || ''}`);

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error issuing certificate:', err);
      const msg = err.message || 'Failed to issue certificate document.';
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

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-purple-50/90 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Issue Official Document / Certificate
              </h3>
              <p className="text-xs text-slate-500">
                Generate authenticated certificates with unique verification serial IDs
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Document Category *
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition cursor-pointer font-semibold"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>

          {/* Candidate Name & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Candidate / Employee Full Name *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  placeholder="e.g. Aman Sharma"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={candidateEmail}
                  onChange={(e) => setCandidateEmail(e.target.value)}
                  placeholder="aman@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  value={candidatePhone}
                  onChange={(e) => setCandidatePhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Domain / Role */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Role / Specialization Domain *
            </label>
            <div className="space-y-2">
              <select
                value={courseOrDomain}
                onChange={(e) => setCourseOrDomain(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition cursor-pointer"
              >
                {DOMAIN_OPTIONS.map((dm) => (
                  <option key={dm} value={dm}>{dm}</option>
                ))}
                <option value="Custom">Custom / Other Specialty...</option>
              </select>

              {courseOrDomain === 'Custom' && (
                <input
                  type="text"
                  required
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="Type custom role or job title..."
                  className="w-full px-3 py-2 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none"
                />
              )}
            </div>
          </div>

          {/* Dates & Evaluation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                End / Completion Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
              />
            </div>
          </div>

          {/* Rating or Stipend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Performance Evaluation
              </label>
              <select
                value={performanceRating}
                onChange={(e) => setPerformanceRating(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition cursor-pointer"
              >
                {PERFORMANCE_RATINGS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {(documentType === 'Offer Letter' || documentType === 'Internship Certificate') && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Monthly Stipend / CTC (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
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
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Generate & Issue Document</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

