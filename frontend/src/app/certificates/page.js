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
  Star,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { CertificateModal, CertificatePreviewModal } from '@/components/modals';

const DOC_TYPES = [
  'All',
  'Offer Letter',
  'Appointment Letter',
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

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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
        } else if (filterType.includes('appointment')) {
          if (!certType.includes('appointment')) return false;
        } else if (filterType.includes('offer')) {
          if (!certType.includes('offer')) return false;
        } else if (filterType.includes('experience')) {
          if (!certType.includes('experience')) return false;
        } else if (cert.document_type !== selectedType) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = cert.candidate_name?.toLowerCase().includes(query);
        const certNumMatch = cert.certificate_number?.toLowerCase().includes(query);
        const domainMatch = cert.domain?.toLowerCase().includes(query);
        const emailMatch = cert.candidate_email?.toLowerCase().includes(query);

        if (!nameMatch && !certNumMatch && !domainMatch && !emailMatch) {
          return false;
        }
      }

      return true;
    });
  }, [certificates, selectedType, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredCertificates.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedCertificates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCertificates.slice(start, start + pageSize);
  }, [filteredCertificates, currentPage, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Metrics
  const internshipCount = certificates.filter(c => (c.document_type || '').toLowerCase().includes('internship')).length;
  const appointmentCount = certificates.filter(c => (c.document_type || '').toLowerCase().includes('appointment') || (c.document_type || '').toLowerCase().includes('offer')).length;
  const experienceCount = certificates.filter(c => (c.document_type || '').toLowerCase().includes('experience')).length;

  return (
    <AppLayout title="Certificates & Verification Registry">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER OJT CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* Card Header (OJT Standard) */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0 flex items-center gap-2">
                <Award className="w-6 h-6 text-[#4689C8]" />
                <span>Certificates & Verification Registry</span>
              </h2>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Issue and verify official credentials, internship certificates, offer letters, and experience certifications.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {isAdminOrHR && (
                <button
                  onClick={() => setIsIssueModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] rounded shadow-sm shadow-[#4689C8]/25 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue New Document</span>
                </button>
              )}

              <button
                onClick={() => fetchCertificates(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh registry"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Documents */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Total Issued Documents
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {certificates.length}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4689C8] to-[#5FC8D6] text-white flex items-center justify-center shadow-md shadow-[#4689C8]/25">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Status:</span>
                  <span className="font-bold text-[#4689C8]">Authenticated Records</span>
                </div>
              </div>

              {/* Internship Certificates */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Internship Certificates
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#11cdef] tracking-tight mt-1">
                      {internshipCount}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#11cdef] to-[#1171ef] text-white flex items-center justify-center shadow-md shadow-[#11cdef]/25">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Students / Interns:</span>
                  <span className="font-bold text-[#11cdef]">Verified Completions</span>
                </div>
              </div>

              {/* Offers & Appointments */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Offer & Appointments
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#2dce89] tracking-tight mt-1">
                      {appointmentCount}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>HR Registry:</span>
                  <span className="font-bold text-[#2dce89]">Hired Candidates</span>
                </div>
              </div>

              {/* Experience Letters */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Experience Letters
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#8965e0] tracking-tight mt-1">
                      {experienceCount}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#8965e0] to-[#5e72e4] text-white flex items-center justify-center shadow-md shadow-[#8965e0]/25">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Tenure Records:</span>
                  <span className="font-bold text-[#8965e0]">Relieved Employees</span>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex items-center justify-between text-[#f5365c] text-xs">
                <span>{error}</span>
                <button onClick={() => fetchCertificates(false)} className="font-bold underline cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {/* DataTables Controls & Category Filter */}
            <div className="space-y-3 pt-2">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[#8898aa] font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">
                  Category:
                </span>
                {DOC_TYPES.map((dt) => (
                  <button
                    key={dt}
                    onClick={() => {
                      setSelectedType(dt);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer shrink-0 ${
                      selectedType === dt
                        ? 'bg-[#4689C8] text-white shadow-2xs'
                        : 'bg-white text-[#525f7f] border border-[#dee2e6] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                    }`}
                  >
                    {dt}
                  </button>
                ))}
              </div>

              {/* DataTables Toolbar: Show Entries & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-b border-[#dee2e6] py-3">
                {/* Show Entries */}
                <div className="flex items-center gap-2 text-xs text-[#525f7f] font-semibold">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2.5 py-1 bg-white border border-[#dee2e6] rounded text-xs font-bold text-[#172b4d] focus:outline-none focus:border-[#4689C8] cursor-pointer"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>entries</span>
                </div>

                {/* Search Box */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#525f7f] font-semibold">Search:</span>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search recipient or cert #..."
                      className="w-56 sm:w-64 pl-8 pr-7 py-1.5 text-xs bg-white border border-[#dee2e6] rounded text-[#172b4d] placeholder-[#8898aa] focus:outline-none focus:border-[#4689C8] transition"
                    />
                    <Search className="w-3.5 h-3.5 text-[#8898aa] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#8898aa] hover:text-[#172b4d]"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* OJT Certificates Table */}
              <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                  <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Candidate / Recipient</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Document Category</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Specialization / Domain</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Verification ID</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Issue Date</th>
                      <th className="py-3 px-3.5 text-center">Preview & Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {loading && certificates.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#8898aa]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                          <span className="text-xs font-semibold">Loading verified credential records...</span>
                        </td>
                      </tr>
                    ) : paginatedCertificates.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#8898aa]">
                          <Award className="w-8 h-8 mx-auto text-[#adb5bd] mb-2" />
                          <p className="text-xs font-semibold text-[#172b4d]">No document records found matching criteria</p>
                          <p className="text-[11px] text-[#8898aa] mt-0.5">
                            {searchQuery || selectedType !== 'All'
                              ? 'Try resetting the search or category filter.'
                              : 'Click "+ Issue New Document" to register an official credential.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedCertificates.map((cert, idx) => (
                        <tr
                          key={cert.id}
                          className={`transition-colors duration-150 ${
                            idx % 2 === 1 ? 'bg-[#f4f6f8]' : 'bg-white'
                          } hover:bg-[#eaf2fc]`}
                        >
                          {/* 1. Candidate Name */}
                          <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                            <div className="font-bold text-[#172b4d] text-xs">
                              {cert.candidate_name}
                            </div>
                            <div className="text-[11px] text-[#8898aa] mt-0.5">
                              {cert.candidate_email || cert.candidate_phone || 'Direct Recipient'}
                            </div>
                          </td>

                          {/* 2. Document Category */}
                          <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              (cert.document_type || '').includes('Internship')
                                ? 'bg-[#e0f7fa] text-[#11cdef] border border-[#11cdef]/30'
                                : (cert.document_type || '').includes('Experience')
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30'
                            }`}>
                              {cert.document_type}
                            </span>
                          </td>

                          {/* 3. Domain */}
                          <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                            <div className="text-xs font-semibold text-[#172b4d]">
                              {cert.domain || 'Software Development'}
                            </div>
                            {cert.duration && (
                              <div className="text-[11px] text-[#8898aa] mt-0.5">
                                Duration: {cert.duration}
                              </div>
                            )}
                          </td>

                          {/* 4. Verification ID */}
                          <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#172b4d]">
                              <span>{cert.certificate_number}</span>
                              <button
                                type="button"
                                onClick={() => handleCopy(cert.certificate_number)}
                                className="p-1 text-[#8898aa] hover:text-[#4689C8] transition cursor-pointer"
                                title="Copy verification code"
                              >
                                {copiedId === cert.certificate_number ? (
                                  <Check className="w-3.5 h-3.5 text-[#2dce89]" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* 5. Issue Date */}
                          <td className="py-3 px-3.5 border-r border-[#dee2e6] text-xs text-[#525f7f]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#8898aa]" />
                              <span>{formatDate(cert.issue_date || cert.created_at)}</span>
                            </div>
                          </td>

                          {/* 6. Preview & Actions */}
                          <td className="py-3 px-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewCert(cert);
                                  setIsPreviewModalOpen(true);
                                }}
                                className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded shadow-2xs transition cursor-pointer"
                                title="Preview Official Certificate / Letter"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <a
                                href={`/verify/${cert.certificate_number}`}
                                target="_blank"
                                rel="noreferrer"
                                className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#dee2e6] rounded shadow-2xs transition"
                                title="Public verification URL"
                              >
                                <ExternalLink className="w-3 h-3" />
                                <span>Verify</span>
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* OJT Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 text-xs text-[#525f7f]">
                <div>
                  Showing{' '}
                  <span className="font-bold text-[#172b4d]">
                    {totalEntries === 0 ? 0 : (currentPage - 1) * pageSize + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-bold text-[#172b4d]">
                    {Math.min(currentPage * pageSize, totalEntries)}
                  </span>{' '}
                  of <span className="font-bold text-[#172b4d]">{totalEntries}</span> records
                </div>

                <div className="flex items-center border border-[#dee2e6] rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] disabled:bg-[#fcfcfd] disabled:text-[#adb5bd] border-r border-[#dee2e6] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 border-r border-[#dee2e6] font-bold transition cursor-pointer ${
                        currentPage === page
                          ? 'bg-[#4689C8] text-white'
                          : 'bg-white text-[#525f7f] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 bg-white hover:bg-[#f6f9fc] disabled:bg-[#fcfcfd] disabled:text-[#adb5bd] font-semibold transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issue Document Modal */}
      <CertificateModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={() => fetchCertificates(false)}
      />

      {/* Preview & Print Modal */}
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
