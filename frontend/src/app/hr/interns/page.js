'use client';

import { useState, useEffect, useMemo } from 'react';
import AppLayout from '@/components/AppLayout';
import employeeService from '@/services/employeeService';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Mail, 
  Eye, 
  Edit2, 
  Trash2, 
  Loader2, 
  RefreshCw, 
  Calendar,
  Building2,
  DollarSign,
  AlertCircle,
  UserCheck,
  Award
} from 'lucide-react';
import { EmployeeModal, EmployeeViewModal, ConfirmDeleteModal } from '@/components/modals';
import { toast } from 'react-toastify';

const DOMAINS = [
  'All Domains',
  'Engineering / Web Development',
  'Mobile App Development',
  'UI/UX & Product Design',
  'Quality Assurance & Testing',
  'Digital Marketing & Growth',
  'Human Resources & Operations'
];

const STATUS_OPTIONS = ['All Statuses', 'Active', 'Completed', 'Exited', 'On Leave'];
const STIPEND_OPTIONS = ['All Stipends', 'Paid Stipend', 'Academic / Unpaid'];

export default function TraineesAndInternsPage() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All Domains');
  const [selectedStatus, setSelectedStatus] = useState('All Statuses');
  const [selectedStipend, setSelectedStipend] = useState('All Stipends');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIntern, setEditingIntern] = useState(null);
  const [viewIntern, setViewIntern] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const fetchInterns = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await employeeService.getEmployees({ type: 'Intern' });
      setInterns(res.data || []);
      if (isManual) {
        toast.success('Trainee registry refreshed!');
      }
    } catch (err) {
      console.error('Failed to fetch interns:', err);
      const msg = err.response?.data?.message || err.message || 'Could not load trainee directory';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterns(false);
  }, []);

  const handleOpenAdd = () => {
    setEditingIntern(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (intern) => {
    setEditingIntern(intern);
    setIsModalOpen(true);
  };

  const handleOpenView = (intern) => {
    setViewIntern(intern);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await employeeService.deleteEmployee(deleteTarget.id);
      toast.success(`${deleteTarget.name} has been removed from trainee records`);
      setDeleteTarget(null);
      fetchInterns(false);
    } catch (err) {
      console.error('Failed to delete intern:', err);
      toast.error(err.response?.data?.message || 'Failed to remove intern record');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered interns
  const filteredInterns = useMemo(() => {
    return interns.filter((intern) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (intern.name || '').toLowerCase().includes(q);
        const matchCode = (intern.employee_code || '').toLowerCase().includes(q);
        const matchEmail = (intern.email || '').toLowerCase().includes(q);
        const matchPhone = (intern.phone || '').toLowerCase().includes(q);
        const matchCollege = (intern.college_name || '').toLowerCase().includes(q);
        const matchUniversity = (intern.university_name || '').toLowerCase().includes(q);
        const matchDegree = (intern.degree || '').toLowerCase().includes(q);
        const matchMentor = (intern.mentor_name || '').toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEmail && !matchPhone && !matchCollege && !matchUniversity && !matchDegree && !matchMentor) {
          return false;
        }
      }

      // Domain
      if (selectedDomain !== 'All Domains' && intern.department !== selectedDomain) {
        return false;
      }

      // Status
      if (selectedStatus !== 'All Statuses' && intern.status !== selectedStatus) {
        return false;
      }

      // Stipend
      if (selectedStipend === 'Paid Stipend' && (!intern.is_paid || !intern.stipend_monthly)) {
        return false;
      }
      if (selectedStipend === 'Academic / Unpaid' && intern.is_paid) {
        return false;
      }

      return true;
    });
  }, [interns, searchQuery, selectedDomain, selectedStatus, selectedStipend]);

  // Paginated list
  const totalPages = Math.ceil(filteredInterns.length / pageSize) || 1;
  const paginatedInterns = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInterns.slice(start, start + pageSize);
  }, [filteredInterns, currentPage, pageSize]);

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

  const formatCurrency = (val) => {
    if (!val && val !== 0) return '—';
    return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Number(val))}`;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Completed':
        return 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Exited':
        return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#19324D] dark:text-[#F8FAFC]">
                  Trainees & Interns
                </h1>
                <p className="text-xs sm:text-sm text-[#71869B] dark:text-[#94A3B8] mt-0.5">
                  Manage internship tenures, college affiliations, mentor allocations, and stipend records.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => fetchInterns(true)}
              disabled={loading}
              className="p-2.5 rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#1E293B] text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] transition-colors cursor-pointer shadow-2xs"
              title="Refresh Registry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0077B6]' : ''}`} />
            </button>

            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Intern / Trainee</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#DFEAF2] dark:border-[#334155] rounded-xl p-4 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#71869B] dark:text-[#64748B]" />
              <input
                type="text"
                placeholder="Search by name, code, college, mentor..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] placeholder-[#71869B] dark:placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Domain Filter */}
            <div>
              <select
                value={selectedDomain}
                onChange={(e) => {
                  setSelectedDomain(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {DOMAINS.map((dom) => (
                  <option key={dom} value={dom}>{dom}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            {/* Stipend Filter */}
            <div>
              <select
                value={selectedStipend}
                onChange={(e) => {
                  setSelectedStipend(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-[#DFEAF2] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-[#19324D] dark:text-[#F8FAFC] focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {STIPEND_OPTIONS.map((sp) => (
                  <option key={sp} value={sp}>{sp}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="bg-white dark:bg-[#1E293B] border border-[#DFEAF2] dark:border-[#334155] rounded-xl overflow-hidden shadow-2xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-[#71869B] dark:text-[#94A3B8]">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-3" />
              <p className="text-sm font-medium">Loading trainee directory...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">{error}</p>
              <button
                onClick={() => fetchInterns(true)}
                className="mt-3 text-xs font-semibold text-purple-600 hover:underline"
              >
                Try refreshing
              </button>
            </div>
          ) : paginatedInterns.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-[#19324D] dark:text-[#F8FAFC]">
                No trainee or intern records found
              </h3>
              <p className="text-xs sm:text-sm text-[#71869B] dark:text-[#94A3B8] max-w-md mx-auto mt-1">
                {searchQuery || selectedDomain !== 'All Domains' || selectedStatus !== 'All Statuses' || selectedStipend !== 'All Stipends'
                  ? 'No trainees match the current filters. Try resetting search criteria.'
                  : 'Start tracking your internships, college candidates, and mentorship allocations by adding a record.'}
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Intern</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[#DFEAF2] dark:border-[#334155] bg-[#F4F8FC]/70 dark:bg-[#0F172A]/70 text-[#19324D] dark:text-[#94A3B8] font-bold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Trainee Profile</th>
                    <th className="py-3.5 px-4">Contact Details</th>
                    <th className="py-3.5 px-4">College & Degree</th>
                    <th className="py-3.5 px-4">Tenure & Duration</th>
                    <th className="py-3.5 px-4">Domain & Mentor</th>
                    <th className="py-3.5 px-4">Stipend</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFEAF2] dark:divide-[#334155]">
                  {paginatedInterns.map((intern) => {
                    const initials = (intern.name || 'I')
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr 
                        key={intern.id}
                        className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/70 transition-colors"
                      >
                        {/* Profile & Code */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs flex-shrink-0">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[#19324D] dark:text-[#F8FAFC] hover:text-purple-600 cursor-pointer" onClick={() => handleOpenView(intern)}>
                                  {intern.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.5 rounded">
                                  {intern.employee_code || 'HE-INT'}
                                </span>
                                <span className="text-[10px] text-[#71869B] dark:text-[#64748B] border border-[#DFEAF2] dark:border-[#334155] px-1 rounded">
                                  {intern.work_mode || 'On-site'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Contact details strictly stacked in flex flex-col gap-1 */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            {intern.phone ? (
                              <a
                                href={`https://wa.me/${intern.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#20A36B] hover:text-[#188657] whitespace-nowrap transition-colors"
                                title="Chat on WhatsApp"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.586-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.203c.043.071.043.419-.101.824z" />
                                </svg>
                                <span className="tabular-nums">{intern.phone}</span>
                              </a>
                            ) : (
                              <span className="text-xs text-[#71869B] dark:text-[#64748B]">—</span>
                            )}

                            {intern.email && (
                              <a
                                href={`mailto:${intern.email}`}
                                className="inline-flex items-center gap-1.5 text-xs text-[#71869B] dark:text-[#94A3B8] hover:text-[#0077B6] dark:hover:text-[#5FC8D6] truncate max-w-[200px] transition-colors"
                                title={intern.email}
                              >
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{intern.email}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* College & Degree */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#19324D] dark:text-[#F8FAFC] truncate max-w-[200px]">
                            {intern.college_name || intern.university_name || 'Affiliated College'}
                          </div>
                          <div className="text-[11px] text-[#71869B] dark:text-[#94A3B8] truncate max-w-[200px] flex items-center gap-1.5 mt-0.5">
                            <span>{intern.degree || 'Degree Program'}</span>
                            {intern.passing_year && (
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1 rounded">
                                ({intern.passing_year})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Tenure & Duration */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            {intern.internship_duration || '3 Months'}
                          </span>
                          <div className="text-[11px] text-[#71869B] dark:text-[#94A3B8] mt-1">
                            {formatDate(intern.joining_date)}
                            {intern.internship_end_date && ` → ${formatDate(intern.internship_end_date)}`}
                          </div>
                        </td>

                        {/* Domain & Mentor */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#19324D] dark:text-[#F8FAFC]">
                            {intern.designation || intern.department}
                          </div>
                          <div className="text-[11px] text-[#71869B] dark:text-[#94A3B8] mt-0.5">
                            {intern.mentor_name ? `Mentor: ${intern.mentor_name}` : 'Unassigned Mentor'}
                          </div>
                        </td>

                        {/* Stipend */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {intern.is_paid && intern.stipend_monthly ? (
                            <div>
                              <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(intern.stipend_monthly)}
                              </span>
                              <span className="text-[10px] text-[#71869B] dark:text-[#64748B] ml-0.5">/mo</span>
                            </div>
                          ) : (
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Academic
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadge(intern.status)}`}>
                            {intern.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenView(intern)}
                              className="p-1.5 rounded-md text-[#71869B] dark:text-[#94A3B8] hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(intern)}
                              className="p-1.5 rounded-md text-[#71869B] dark:text-[#94A3B8] hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
                              title="Edit Intern"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(intern)}
                              className="p-1.5 rounded-md text-[#71869B] dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
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
          {filteredInterns.length > pageSize && (
            <div className="py-3 px-4 border-t border-[#DFEAF2] dark:border-[#334155] flex items-center justify-between text-xs text-[#71869B] dark:text-[#94A3B8] bg-[#F8FAFC] dark:bg-[#0F172A]/50">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredInterns.length)} of {filteredInterns.length} interns
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

      {/* Add / Edit Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType="Intern"
        editingEmployee={editingIntern}
        onSuccess={() => fetchInterns(false)}
      />

      {/* View Full Profile Modal */}
      <EmployeeViewModal
        isOpen={!!viewIntern}
        employee={viewIntern}
        onClose={() => setViewIntern(null)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title="Remove Intern Record"
        message="Are you sure you want to delete this trainee record? This action cannot be reversed."
        itemName={deleteTarget?.name}
        loading={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </AppLayout>
  );
}
