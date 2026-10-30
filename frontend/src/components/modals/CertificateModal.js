'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import certificateService from '@/services/certificateService';
import { 
  XCircle, 
  Award,
  IndianRupee, 
  Loader2, 
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';

const DOCUMENT_TYPES = [
  'Offer Letter',
  'Appointment Letter',
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
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-[#e9ecef] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#e9ecef] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#326fa8] to-[#4689C8] flex items-center justify-center text-white shadow-sm">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#172b4d] tracking-tight">
                Issue Official Document
              </h3>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Generate authenticated certificates with unique verification serial IDs
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
            <div className="p-3 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 text-xs text-[#f5365c] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Document Type */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Document Category <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition cursor-pointer font-semibold"
            >
              {DOCUMENT_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </select>
          </div>

          {/* Candidate Name */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Candidate / Employee Full Name <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Aman Sharma"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
            />
          </div>

          {/* Candidate Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                placeholder="aman@example.com"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={candidatePhone}
                onChange={(e) => setCandidatePhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition font-mono"
              />
            </div>
          </div>

          {/* Domain / Role */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Role / Specialization Domain <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <div className="space-y-2">
              <select
                value={courseOrDomain}
                onChange={(e) => setCourseOrDomain(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
                />
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Issue Date <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#172b4d] text-xs rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* Rating or Stipend */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Performance Evaluation
              </label>
              <select
                value={performanceRating}
                onChange={(e) => setPerformanceRating(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition cursor-pointer"
              >
                {PERFORMANCE_RATINGS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {(documentType === 'Offer Letter' || documentType === 'Appointment Letter' || documentType === 'Internship Certificate') && (
              <div>
                <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                  Monthly Stipend / CTC (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898aa]">
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <input
                    type="number"
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    placeholder="e.g. 15000"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] outline-none transition"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Dual-Button Modal Footer (OJT Standard) */}
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
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Issuing Document...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Generate &amp; Issue Document</span>
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
