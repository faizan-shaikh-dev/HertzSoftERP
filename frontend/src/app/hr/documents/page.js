'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import certificateService from '@/services/certificateService';
import { 
  FileText, 
  Plus, 
  Search, 
  Copy, 
  Check, 
  Eye, 
  Loader2, 
  RefreshCw, 
  Calendar,
  AlertCircle,
  Award,
  Sparkles,
  ExternalLink,
  Mail,
  GraduationCap,
  Briefcase
} from 'lucide-react';
import { CertificateModal, CertificatePreviewModal } from '@/components/modals';
import { toast } from 'react-toastify';

const DOC_TYPES = [
  'All Documents',
  'Offer Letter',
  'Appointment Letter',
  'Internship Certificate',
  'Experience Letter'
];

export default function DocumentIssuancePage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Documents');
  const [copiedId, setCopiedId] = useState(null);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchDocuments = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateService.getCertificates();
      setDocuments(res.data || []);
      if (isManual) {
        toast.success('Document issuance registry refreshed!');
      }
    } catch (err) {
      console.error('Failed to load issued documents:', err);
      const msg = err.message || 'Could not load document registry';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments(false);
  }, []);

  const handleCopyCode = (serial) => {
    if (!serial) return;
    navigator.clipboard.writeText(serial);
    setCopiedId(serial);
    toast.success(`Verification code "${serial}" copied to clipboard!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handlePreview = (doc) => {
    setPreviewCert(doc);
    setIsPreviewModalOpen(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Type filter
      if (selectedType !== 'All Documents') {
        const docType = (doc.document_type || '').toLowerCase();
        const filterType = selectedType.toLowerCase();
        if (!docType.includes(filterType.replace('letter', '').replace('certificate', '').trim())) {
          return false;
        }
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (doc.candidate_name || '').toLowerCase().includes(q);
        const matchSerial = (doc.certificate_number || '').toLowerCase().includes(q);
        const matchDomain = (doc.course_or_domain || '').toLowerCase().includes(q);
        const matchEmail = (doc.candidate_email || '').toLowerCase().includes(q);
        const matchPhone = (doc.candidate_phone || '').toLowerCase().includes(q);
        if (!matchName && !matchSerial && !matchDomain && !matchEmail && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [documents, selectedType, searchQuery]);

  // Paginated
  const totalPages = Math.ceil(filteredDocuments.length / pageSize) || 1;
  const paginatedDocs = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDocuments.slice(start, start + pageSize);
  }, [filteredDocuments, currentPage, pageSize]);

  const getDocTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('internship')) {
      return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    }
    if (t.includes('offer')) {
      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    }
    if (t.includes('appointment')) {
      return 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
    }
    if (t.includes('experience')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
    return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0077B6] to-[#5FC8D6] text-white flex items-center justify-center shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#19324D] dark:text-[#F8FAFC]">
                  Document Issuance
                </h1>
                <p className="text-xs sm:text-sm text-[#71869B] dark:text-[#94A3B8] mt-0.5">
                  Generate authenticated offer letters, internship certificates, and experience letters with verifiable serial codes.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchDocuments(true)}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] transition-colors cursor-pointer shadow-2xs"
              title="Refresh Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0077B6]' : ''}`} />
            </button>

            <button
              onClick={() => setIsIssueModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0077B6] hover:bg-[#005f92] text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Document</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#DFEAF2] dark:border-[#334155] rounded-xl p-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71869B] dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search by recipient name, serial code, domain, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] placeholder-[#71869B] dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              />
            </div>

            {/* Document Type Filter */}
            <div>
              <select
                value={selectedType}
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-[#0077B6]"
              >
                {DOC_TYPES.map((dt) => (
                  <option key={dt} value={dt}>{dt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#DFEAF2] dark:border-[#334155] rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#71869B] dark:text-[#94A3B8]">
              <Loader2 className="w-8 h-8 animate-spin text-[#0077B6] mb-3" />
              <p className="text-sm font-medium">Loading document registry...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => fetchDocuments(true)}
                className="mt-3 text-xs font-semibold text-[#0077B6] hover:underline"
              >
                Try refreshing
              </button>
            </div>
          ) : paginatedDocs.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-[#EAF3FB] dark:bg-[#334155]/50 text-[#0077B6] dark:text-[#5FC8D6] flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#19324D] dark:text-[#F8FAFC]">
                No documents found
              </h3>
              <p className="text-xs sm:text-sm text-[#71869B] dark:text-[#94A3B8] max-w-md mx-auto mt-1">
                {searchQuery || selectedType !== 'All Documents'
                  ? 'No documents match the current search criteria.'
                  : 'Start issuing official offer letters or certificates to your employees and interns.'}
              </p>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0077B6] hover:bg-[#005f92] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Issue First Document</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#DFEAF2] dark:border-[#334155] bg-[#F4F8FC]/70 dark:bg-[#0F172A]/70 text-[#19324D] dark:text-[#94A3B8] font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Document Type</th>
                    <th className="py-3.5 px-4">Recipient / Candidate</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">Role / Specialization</th>
                    <th className="py-3.5 px-4">Verification Code</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFEAF2] dark:divide-[#334155]">
                  {paginatedDocs.map((doc) => {
                    const initials = (doc.candidate_name || 'C')
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr 
                        key={doc.id}
                        className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/70 transition-colors"
                      >
                        {/* Document Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getDocTypeBadge(doc.document_type)}`}>
                            {doc.document_type || 'Certificate'}
                          </span>
                        </td>

                        {/* Candidate */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-[#19324D] dark:text-[#F8FAFC] flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span 
                                className="font-bold text-[#19324D] dark:text-[#F8FAFC] hover:text-[#0077B6] cursor-pointer"
                                onClick={() => handlePreview(doc)}
                              >
                                {doc.candidate_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Contact details strictly stacked in flex flex-col gap-1 */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {doc.candidate_phone ? (
                              <a
                                href={`https://wa.me/${doc.candidate_phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20A36B] hover:text-[#188657] whitespace-nowrap transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.071.043.419-.101.824z" />
                                </svg>
                                <span className="tabular-nums">{doc.candidate_phone}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-[#71869B] dark:text-[#64748B]">—</span>
                            )}

                            {doc.candidate_email && (
                              <a
                                href={`mailto:${doc.candidate_email}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] truncate max-w-[200px] transition-colors"
                                title={doc.candidate_email}
                              >
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{doc.candidate_email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Role / Domain */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#19324D] dark:text-[#F8FAFC]">
                            {doc.course_or_domain}
                          </div>
                          {doc.performance_rating && (
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                              ★ {doc.performance_rating}
                            </div>
                          )}
                        </td>

                        {/* Verification Code */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-[#0077B6] dark:text-[#5FC8D6] bg-[#0077B6]/10 dark:bg-[#0077B6]/25 px-2 py-0.5 rounded">
                              {doc.certificate_number}
                            </span>
                            <button
                              onClick={() => handleCopyCode(doc.certificate_number)}
                              className="p-1 rounded text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] transition-colors cursor-pointer"
                              title="Copy Verification Code"
                            >
                              {copiedId === doc.certificate_number ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Issue Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#19324D] dark:text-[#F8FAFC]">
                          {formatDate(doc.issue_date)}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handlePreview(doc)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#0077B6] dark:text-[#5FC8D6] bg-[#EAF3FB] dark:bg-[#1E293B] hover:bg-[#0077B6] hover:text-white transition-all cursor-pointer shadow-2xs"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Preview</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredDocuments.length > pageSize && (
            <div className="py-3 px-4 border-t border-[#DFEAF2] dark:border-[#334155] flex items-center justify-between text-xs text-[#71869B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A]/50">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredDocuments.length)} of {filteredDocuments.length} documents
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors"
                >
                  Prev
                </button>
                <span className="px-2 font-medium text-[#19324D] dark:text-[#F8FAFC]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-[#334155] transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Issue Document Modal */}
      <CertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={() => fetchDocuments(false)}
      />

      {/* Preview Document Modal */}
      <CertificatePreviewModal
        isOpen={isPreviewModalOpen}
        certificate={previewCert}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewCert(null);
        }}
      />
    </AppLayout>
  );
}
