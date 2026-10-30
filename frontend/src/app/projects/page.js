'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import projectService from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import {
  FolderKanban,
  Plus,
  Search,
  RefreshCw,
  Loader2,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Edit,
  Trash2,
  Eye,
  X,
  Wallet
} from 'lucide-react';
import { 
  ProjectModal, 
  PaymentModal, 
  ConfirmDeleteModal 
} from '@/components/modals';

const STATUS_OPTIONS = [
  'All',
  'In Progress',
  'Completed',
  'On Hold',
  'Not Started',
  'Cancelled'
];

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentProject, setPaymentProject] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Projects from backend
  const fetchProjects = async (isManual = false) => {
    try {
      setLoading(true);
      setError('');
      const res = await projectService.getProjects();
      setProjects(res.data || []);
      if (isManual) {
        toast.success('Projects ledger refreshed!');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      const msg = err.message || 'Could not fetch projects list. Check server connectivity.';
      setError(msg);
      if (isManual) toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(false);
  }, []);

  // Delete Action
  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      setDeleting(true);
      await projectService.deleteProject(projectToDelete.id);
      toast.success(`Project "${projectToDelete.title}" deleted.`);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      fetchProjects(false);
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error(err.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      if (selectedStatus !== 'All' && project.status !== selectedStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = project.title?.toLowerCase().includes(query);
        const clientMatch = project.client_name?.toLowerCase().includes(query);
        const companyMatch = project.client_company?.toLowerCase().includes(query);

        if (!titleMatch && !clientMatch && !companyMatch) {
          return false;
        }
      }

      return true;
    });
  }, [projects, selectedStatus, searchQuery]);

  // Pagination calculation
  const totalEntries = filteredProjects.length;
  const totalPages = Math.ceil(totalEntries / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, currentPage, pageSize]);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amt || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Aggregate metrics
  const totalContractVal = projects.reduce((acc, p) => acc + Number(p.total_cost || 0), 0);
  const totalCollectedVal = projects.reduce((acc, p) => acc + Number(p.total_paid || 0), 0);
  const activeCount = projects.filter(p => p.status === 'In Progress').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  return (
    <AppLayout title="Projects & Client Contracts">
      <div className="container-fluid px-0 sm:px-2">
        {/* MASTER OJT CONTAINER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* Card Header (OJT Standard) */}
          <div className="card-header px-4 sm:px-6 py-4 bg-white border-b border-[#e9ecef] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0 flex items-center gap-2">
                <FolderKanban className="w-6 h-6 text-[#4689C8]" />
                <span>Projects & Client Contracts</span>
              </h2>
              <p className="text-xs text-[#8898aa] mt-0.5">
                Manage client project deliverables, milestone contracts, payment schedules, and technical completion.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingProject(null);
                  setIsProjectModalOpen(true);
                }}
                className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#326fa8] via-[#4689C8] to-[#4689C8] hover:from-[#2a5d8d] hover:to-[#3876b0] rounded shadow-sm shadow-[#4689C8]/25 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Project</span>
              </button>

              <button
                onClick={() => fetchProjects(true)}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh projects"
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
              {/* 1. Active In Progress */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Active Projects
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#11cdef] tracking-tight mt-1">
                      {activeCount}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#11cdef] to-[#1171ef] text-white flex items-center justify-center shadow-md shadow-[#11cdef]/25">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Status:</span>
                  <span className="font-bold text-[#11cdef]">In Progress</span>
                </div>
              </div>

              {/* 2. Completed Contracts */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Completed Deals
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#2dce89] tracking-tight mt-1">
                      {completedCount}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Lifecycle:</span>
                  <span className="font-bold text-[#2dce89]">Delivered & Closed</span>
                </div>
              </div>

              {/* 3. Total Contract Value */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Total Contract Value
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#172b4d] tracking-tight mt-1">
                      {formatCurrency(totalContractVal)}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#4689C8] to-[#5FC8D6] text-white flex items-center justify-center shadow-md shadow-[#4689C8]/25">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Scope:</span>
                  <span className="font-bold text-[#172b4d]">{projects.length} Total Contracts</span>
                </div>
              </div>

              {/* 4. Realized Collections */}
              <div className="card bg-white border border-[#e9ecef] rounded-lg shadow-sm hover:shadow-md transition p-4 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8898aa]">
                      Total Collections
                    </span>
                    <div className="text-xl sm:text-2xl font-extrabold text-[#2dce89] tracking-tight mt-1">
                      {formatCurrency(totalCollectedVal)}
                    </div>
                  </div>
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#2dce89] to-[#20a36b] text-white flex items-center justify-center shadow-md shadow-[#2dce89]/25">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-[#f8f9fe] flex items-center justify-between text-xs text-[#8898aa]">
                  <span>Collected:</span>
                  <span className="font-bold text-[#2dce89]">
                    {totalContractVal > 0 ? Math.round((totalCollectedVal / totalContractVal) * 100) : 0}% Realized
                  </span>
                </div>
              </div>
            </div>

            {/* Error Notice */}
            {error && (
              <div className="p-4 rounded-md bg-[#fdf2f2] border border-[#f5365c]/30 flex items-center justify-between text-[#f5365c] text-xs">
                <span>{error}</span>
                <button onClick={() => fetchProjects(false)} className="font-bold underline cursor-pointer">
                  Retry
                </button>
              </div>
            )}

            {/* DataTables Controls & Status Filter */}
            <div className="space-y-3 pt-2">
              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[#8898aa] font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0">
                  Status:
                </span>
                {STATUS_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      setSelectedStatus(st);
                      setCurrentPage(1);
                    }}
                    className={`px-3 py-1 rounded text-xs font-semibold transition cursor-pointer shrink-0 ${
                      selectedStatus === st
                        ? 'bg-[#4689C8] text-white shadow-2xs'
                        : 'bg-white text-[#525f7f] border border-[#dee2e6] hover:bg-[#f6f9fc] hover:text-[#4689C8]'
                    }`}
                  >
                    {st}
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
                      placeholder="Search project or client..."
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

              {/* OJT Projects Table */}
              <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                  <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b-2 border-[#e9ecef]">
                    <tr>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Project & Client</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center">Lifecycle Status</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6] text-right">Contract Value</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Collection Progress</th>
                      <th className="py-3 px-3.5 border-r border-[#dee2e6]">Timeline</th>
                      <th className="py-3 px-3.5 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {loading && projects.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#8898aa]">
                          <Loader2 className="w-6 h-6 animate-spin text-[#4689C8] mx-auto mb-2" />
                          <span className="text-xs font-semibold">Loading projects ledger...</span>
                        </td>
                      </tr>
                    ) : paginatedProjects.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="py-12 text-center text-[#8898aa]">
                          <FolderKanban className="w-8 h-8 mx-auto text-[#adb5bd] mb-2" />
                          <p className="text-xs font-semibold text-[#172b4d]">No projects found matching criteria</p>
                          <p className="text-[11px] text-[#8898aa] mt-0.5">
                            {searchQuery || selectedStatus !== 'All'
                              ? 'Try resetting the search or status filter.'
                              : 'Click "+ Create New Project" to initiate a client contract.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      paginatedProjects.map((project, idx) => {
                        const percentPaid = project.total_cost > 0
                          ? Math.min(100, Math.round((Number(project.total_paid || 0) / Number(project.total_cost)) * 100))
                          : 0;

                        return (
                          <tr
                            key={project.id}
                            className={`hover:bg-[#f6f9fc] transition-colors ${
                              idx % 2 === 1 ? 'bg-[#fcfdfe]' : 'bg-white'
                            }`}
                          >
                            {/* 1. Project & Client */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <Link
                                href={`/projects/view?id=${project.id}`}
                                className="font-bold text-[#172b4d] hover:text-[#4689C8] hover:underline text-xs block"
                                title="View Project Details & Reports"
                              >
                                {project.title}
                              </Link>
                              <div className="text-[11px] text-[#525f7f] flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 text-[#8898aa]" />
                                <span>
                                  {project.client_company ? `${project.client_company} (${project.client_name})` : project.client_name}
                                </span>
                              </div>
                            </td>

                            {/* 2. Status Badge */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                project.status === 'Completed'
                                  ? 'bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30'
                                  : project.status === 'In Progress'
                                  ? 'bg-[#e0f7fa] text-[#11cdef] border border-[#11cdef]/30'
                                  : project.status === 'On Hold'
                                  ? 'bg-[#fef4e6] text-[#fb6340] border border-[#fb6340]/30'
                                  : project.status === 'Cancelled'
                                  ? 'bg-[#fdf2f2] text-[#f5365c] border border-[#f5365c]/30'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}>
                                {project.status}
                              </span>
                            </td>

                            {/* 3. Contract Value */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-right font-mono font-bold text-xs text-[#172b4d]">
                              {formatCurrency(project.total_cost)}
                            </td>

                            {/* 4. Payment Progress Bar */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6]">
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="font-bold text-[#2dce89]">
                                  {formatCurrency(project.total_paid)}
                                </span>
                                <span className="font-semibold text-[#fb6340]">
                                  Due: {formatCurrency(project.due_balance)}
                                </span>
                              </div>

                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-[#dee2e6]">
                                <div 
                                  className={`h-full transition-all duration-500 rounded-full ${
                                    percentPaid >= 100 
                                      ? 'bg-[#2dce89]' 
                                      : percentPaid > 50 
                                      ? 'bg-[#4689C8]' 
                                      : 'bg-[#fb6340]'
                                  }`}
                                  style={{ width: `${percentPaid}%` }}
                                />
                              </div>
                              <div className="text-[10px] text-[#8898aa] mt-0.5 font-medium">
                                {percentPaid}% cleared
                              </div>
                            </td>

                            {/* 5. Timeline */}
                            <td className="py-3 px-3.5 border-r border-[#dee2e6] text-xs text-[#525f7f]">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-[#8898aa]" />
                                <span>{formatDate(project.start_date)}</span>
                              </div>
                              {project.deadline && (
                                <div className="text-[10px] text-[#8898aa] mt-0.5">
                                  Target: {formatDate(project.deadline)}
                                </div>
                              )}
                            </td>

                            {/* 6. Actions */}
                            <td className="py-3 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Link
                                  href={`/projects/view?id=${project.id}`}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#4689C8] bg-[#f0f7fd] hover:bg-blue-100 border border-[#4689C8]/30 rounded shadow-2xs transition"
                                  title="View Project Details & Scope Reports"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setPaymentProject(project);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="btn btn-sm inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-[#2dce89] bg-[#e8f7ee] hover:bg-[#d4f2df] border border-[#2dce89]/30 rounded shadow-2xs transition cursor-pointer"
                                  title="Record Payment Installment"
                                >
                                  <CreditCard className="w-3 h-3" />
                                  <span>+ Pay</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingProject(project);
                                    setIsProjectModalOpen(true);
                                  }}
                                  className="p-1 rounded text-[#525f7f] hover:text-[#4689C8] hover:bg-blue-50 border border-transparent hover:border-blue-200 transition cursor-pointer"
                                  title="Edit Project Contract"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {isAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setProjectToDelete(project);
                                      setIsDeleteModalOpen(true);
                                    }}
                                    className="p-1 rounded text-[#525f7f] hover:text-[#f5365c] hover:bg-red-50 border border-transparent hover:border-red-200 transition cursor-pointer"
                                    title="Delete Project"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
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
                  of <span className="font-bold text-[#172b4d]">{totalEntries}</span> projects
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

      {/* Project Modal (Create / Edit) */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={() => fetchProjects(false)}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentProject(null);
        }}
        prefilledProject={paymentProject}
        onSuccess={() => fetchProjects(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDeleteProject}
        loading={deleting}
        title="Delete Project Contract"
        message={`Are you sure you want to delete project "${projectToDelete?.title}"? All linked milestone and payment records will be permanently deleted.`}
      />
    </AppLayout>
  );
}
