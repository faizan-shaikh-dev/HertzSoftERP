'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import certificateService from '@/services/certificateService';
import { useAuth } from '@/context/AuthContext';
import { 
  Award, 
  Plus, 
  Search, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  GraduationCap, 
  Briefcase, 
  FileCheck, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  Star 
} from 'lucide-react';
import { CertificateModal, CertificatePreviewModal } from '@/components/modals';

const DOC_TYPES = [
  'All',
  'Offer Letter',
  'Internship Certificate',
  'Experience Letter'
];

export default function CertificatesPage() {
  const { user } = useAuth();
  const isAdminOrHR = user?.role?.toLowerCase().includes('admin') || user?.role?.toLowerCase().includes('hr');

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modals state
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [previewCert, setPreviewCert] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Fetch Certificates from backend
  const fetchCertificates = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await certificateService.getCertificates();
      setCertificates(res.data || []);
      if (isManual) {
        toast.success('Certificate registry updated!');
      }
    } catch (err) {
      console.error('Failed to load certificates:', err);
      const msg = err.message || 'Could not load certificates list. Check server connectivity.';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates(false);
  }, []);

  const handleCopy = (serialNo) => {
    navigator.clipboard.writeText(serialNo);
    setCopiedId(serialNo);
    toast.success(`Verification code "${serialNo}" copied!`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered Certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((cert) => {
      if (selectedType !== 'All') {
        const certType = (cert.document_type || '').toLowerCase();
        const filterType = selectedType.toLowerCase();

        if (filterType.includes('internship')) {
          if (!certType.includes('internship')) return false;
        } else if (filterType.includes('offer')) {
          if (!certType.includes('offer')) return false;
        } else if (filterType.includes('experience')) {
          if (!certType.includes('experience')) return false;
        } else if (cert.document_type !== selectedType) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = cert.candidate_name?.toLowerCase().includes(q);
        const codeMatch = cert.certificate_number?.toLowerCase().includes(q);
        const domainMatch = cert.course_or_domain?.toLowerCase().includes(q);
        const emailMatch = cert.candidate_email?.toLowerCase().includes(q);

        if (!nameMatch && !codeMatch && !domainMatch && !emailMatch) return false;
      }

      return true;
    });
  }, [certificates, selectedType, searchQuery]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <AppLayout title="Certificates & Document Generator">
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-50/80 via-white to-slate-50 p-5 rounded-lg border border-purple-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Official Credentials & Document Registry
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Issue official company credentials, employee offer letters, internship certificates, and experience documents.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchCertificates(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Document</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Document Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
                Category:
              </span>
              {DOC_TYPES.map((dt) => (
                <button
                  key={dt}
                  onClick={() => setSelectedType(dt)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    selectedType === dt
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {dt}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate name or cert ID..."
                className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-500 outline-none transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="m-4 p-4 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchCertificates(false)} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Certificates Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Candidate / Recipient</th>
                <th className="py-3 px-4">Document Category</th>
                <th className="py-3 px-4">Specialization / Domain</th>
                <th className="py-3 px-4">Verification ID</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4 text-right">Preview & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && certificates.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                    <span className="text-xs font-medium">Loading document records...</span>
                  </td>
                </tr>
              ) : filteredCertificates.length > 0 ? (
                filteredCertificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-purple-50/30 transition-colors">
                    {/* 1. Candidate Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs">
                        {cert.candidate_name}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {cert.candidate_email || cert.candidate_phone || 'Direct Recipient'}
                      </div>
                    </td>

                    {/* 2. Document Type */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                        cert.document_type?.includes('Offer')
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : cert.document_type?.includes('Internship')
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        <Award className="w-3 h-3" />
                        {cert.document_type}
                      </span>
                    </td>

                    {/* 3. Specialization / Domain */}
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-slate-800">
                        {cert.course_or_domain}
                      </div>
                      {cert.performance_rating && (
                        <div className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>Rating: {cert.performance_rating}</span>
                        </div>
                      )}
                    </td>

                    {/* 4. Verification ID */}
                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-200 font-mono text-xs font-bold text-slate-800">
                        <span>{cert.certificate_number}</span>
                        <button
                          onClick={() => handleCopy(cert.certificate_number)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                          title="Copy serial number"
                        >
                          {copiedId === cert.certificate_number ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 5. Issue Date */}
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div>{formatDate(cert.issue_date)}</div>
                      {cert.issued_by_name && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          By: {cert.issued_by_name}
                        </div>
                      )}
                    </td>

                    {/* 6. Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setPreviewCert(cert);
                            setIsPreviewModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded border border-purple-200 transition-colors cursor-pointer"
                          title="View / Print Document"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print</span>
                        </button>

                        <a
                          href={certificateService.getPreviewUrl(cert.id)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Open in new window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Award className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No documents issued</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Generate your first corporate credential, offer letter, or internship certificate with unique serial tracking.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Certificate Modal */}
      <CertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={fetchCertificates}
      />

      {/* View & Print Preview Modal */}
      <CertificatePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewCert(null);
        }}
        certificate={previewCert}
      />
    </AppLayout>
  );
}

