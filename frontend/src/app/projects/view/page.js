'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  FolderKanban, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Plus, 
  Edit3, 
  ExternalLink,
  PlusCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import projectService from '@/services/projectService';
import { PaymentModal, ProjectModal } from '@/components/modals';

function ProjectViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Support multiple URL query parameter names for maximum OJT compatibility:
  // e.g. ?id=8, ?project_id=8, or ?projects_id=8 (from OJT reference link)
  const projectId = searchParams.get('id') || searchParams.get('project_id') || searchParams.get('projects_id');

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Fetch project details
  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) {
      setLoading(false);
      setError('No Project ID provided in URL.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await projectService.getProjectById(projectId);
      if (res.success && res.data) {
        setProject(res.data);
      } else {
        setError('Project record not found or failed to load.');
      }
    } catch (err) {
      console.error('Error fetching project details:', err);
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to load project details.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Format currency in Indian Rupees
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(Number(val));
  };

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr;
    }
  };

  // Financial & Milestone calculations
  const totalCost = Number(project?.total_cost || 0);
  const totalPaid = Number(project?.total_paid || 0);
  const dueBalance = Math.max(0, totalCost - totalPaid);
  const percentPaid = totalCost > 0 ? Math.min(100, Math.round((totalPaid / totalCost) * 100)) : 0;

  // Timeline completion estimate
  const isCompleted = project?.status === 'Completed';
  const completionPercentage = isCompleted ? 100 : percentPaid > 0 ? percentPaid : 25;

  return (
    <AppLayout title="Project Details & Reports">
      <div className="container-fluid px-0 sm:px-2">
        {/* MAIN MASTER OJT CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#e9ecef] rounded-lg overflow-hidden">
          {/* OJT Card Header with Back Button and Actions */}
          <div className="card-header bg-white border-b border-[#e9ecef] py-4 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="btn btn-sm inline-flex items-center justify-center w-9 h-9 rounded bg-[#4689C8] hover:bg-[#3876b0] text-white shadow-xs transition cursor-pointer flex-shrink-0"
                title="Back to Projects"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight m-0">
                    Project Details & Reports
                  </h2>
                  {project?.status && (
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                      project.status === 'Completed'
                        ? 'bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30'
                        : project.status === 'In Progress'
                        ? 'bg-[#e0f7fa] text-[#11cdef] border border-[#11cdef]/30'
                        : project.status === 'On Hold'
                        ? 'bg-[#fef4e6] text-[#fb6340] border border-[#fb6340]/30'
                        : 'bg-[#f0f7fd] text-[#4689C8] border border-[#4689C8]/30'
                    }`}>
                      {project.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8898aa] mt-0.5">
                  Contract scope, milestones, client details, and installment payments ledger
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons (OJT Style) */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(true)}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2dce89] hover:bg-[#229c68] rounded shadow-xs transition cursor-pointer"
                title="Record payment installment for this project"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setIsProjectModalOpen(true)}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded shadow-xs transition cursor-pointer"
                title="Edit Project Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Project</span>
              </button>

              <button
                type="button"
                onClick={fetchProjectDetails}
                disabled={loading}
                className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#525f7f] bg-white hover:bg-[#f6f9fc] border border-[#e9ecef] rounded shadow-xs transition cursor-pointer disabled:opacity-50"
                title="Refresh details"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 bg-[#f8f9fe]/40 space-y-6">
            {/* Loading Spinner */}
            {loading && !project && (
              <div className="py-20 text-center text-[#8898aa]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
                <p className="text-sm font-semibold">Loading project contract details and payment ledger...</p>
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-6 text-center bg-white border border-red-200 rounded-lg shadow-xs my-6">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#172b4d]">Unable to Load Project</h3>
                <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/projects"
                    className="btn btn-sm px-4 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3876b0] rounded"
                  >
                    Return to Projects
                  </Link>
                </div>
              </div>
            )}

            {/* Project Content */}
            {!loading && project && (
              <>
                {/* 1. OJT PROJECT & CLIENT BASIC INFORMATION CARD */}
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden bg-white">
                  {/* Purple Gradient Banner (Exact OJT report-card-header) */}
                  <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <FolderKanban className="w-4 h-4 text-white" />
                      <span>Project Contract & Client Information</span>
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      #{project.id}
                    </span>
                  </div>

                  {/* 2-Column Grid of Bordered Field Boxes (Exact OJT .profile-item) */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Project Title */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Project Title / Deliverable
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5">
                          {project.title}
                        </div>
                      </div>

                      {/* Client Name */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Client / Contact Person
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{project.client_name || '-'}</span>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Company / Business Entity
                        </div>
                        <div className="text-sm font-bold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#8898aa]" />
                          <span>{project.client_company || 'Individual Client'}</span>
                        </div>
                      </div>

                      {/* Client Email */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Client Email Address
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5">
                          {project.client_email ? (
                            <a 
                              href={`mailto:${project.client_email}`} 
                              className="text-[#4689C8] hover:underline flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#4689C8]" />
                              <span>{project.client_email}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-normal italic">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Client Phone */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Contact Number
                        </div>
                        <div className="text-sm font-semibold text-[#172b4d] mt-0.5">
                          {project.client_phone ? (
                            <a 
                              href={`tel:${project.client_phone}`} 
                              className="text-[#4689C8] hover:underline flex items-center gap-1.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-[#4689C8]" />
                              <span>{project.client_phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-normal italic">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Billing Address */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Billing Address
                        </div>
                        <div className="text-xs font-semibold text-[#172b4d] mt-0.5 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#8898aa] mt-0.5 flex-shrink-0" />
                          <span>{project.client_address || 'No address specified'}</span>
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Contract Start Date
                        </div>
                        <div className="text-xs font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{formatDate(project.start_date || project.created_at)}</span>
                        </div>
                      </div>

                      {/* Expected Completion Date */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Expected Completion / Target Date
                        </div>
                        <div className="text-xs font-semibold text-[#172b4d] mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#fb6340]" />
                          <span>{formatDate(project.target_date || project.deadline)}</span>
                        </div>
                      </div>

                      {/* Contract Value & Paid */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Contract Value & Clearance
                        </div>
                        <div className="text-xs font-bold text-[#172b4d] mt-0.5 flex items-center gap-2">
                          <span className="text-sm font-extrabold text-[#172b4d]">
                            {formatCurrency(totalCost)}
                          </span>
                          <span className="text-[#8898aa]">•</span>
                          <span className="text-xs font-bold text-[#2dce89]">
                            {formatCurrency(totalPaid)} Paid
                          </span>
                          <span className="text-[#8898aa]">•</span>
                          <span className="text-xs font-bold text-[#f5365c]">
                            {formatCurrency(dueBalance)} Due
                          </span>
                        </div>
                      </div>

                      {/* Created On */}
                      <div className="border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Record Created On
                        </div>
                        <div className="text-xs font-semibold text-[#525f7f] mt-0.5">
                          {formatDateTime(project.created_at)}
                        </div>
                      </div>

                      {/* Technical Scope / Description */}
                      <div className="md:col-span-2 border border-[#dee2e6] p-2.5 rounded bg-white profile-item hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#8898aa] uppercase tracking-wider">
                          Project Description & Technical Scope
                        </div>
                        <div className="text-xs text-[#525f7f] mt-1 whitespace-pre-line leading-relaxed">
                          {project.description || 'No detailed technical scope recorded for this contract.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. OJT STATISTICS / ANALYTICS SECTION (Exact match to students-view.php .stats-card) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Card: Financials & Collections Overview (Pink-Red Gradient) */}
                  <div className="rounded-xl p-5 text-white shadow-md relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <h5 className="text-sm font-bold uppercase tracking-wider text-white/95 flex items-center gap-1.5 m-0">
                          <TrendingUp className="w-4 h-4 text-white" />
                          <span>Financials & Payments</span>
                        </h5>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {formatCurrency(totalCost)}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Total Cost
                            </div>
                          </div>

                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {formatCurrency(totalPaid)}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Amount Paid
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 text-xs text-white/90 font-medium border-t border-white/20">
                          Pending Balance Due:{' '}
                          <span className="font-extrabold text-white bg-black/20 px-2 py-0.5 rounded">
                            {formatCurrency(dueBalance)}
                          </span>
                        </div>
                      </div>

                      {/* Circular Progress Ring (Exact OJT progress-ring) */}
                      <div className="flex-shrink-0 flex items-center justify-center relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="38"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.25)"
                            strokeWidth="7"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="38"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={`${(percentPaid / 100) * 238.76}, 238.76`}
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-sm sm:text-base font-extrabold text-white leading-none">
                            {percentPaid}%
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/85 font-bold mt-0.5">
                            Paid
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Card: Project Milestones & Lifecycle (Purple-Indigo Gradient) */}
                  <div className="rounded-xl p-5 text-white shadow-md relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <h5 className="text-sm font-bold uppercase tracking-wider text-white/95 flex items-center gap-1.5 m-0">
                          <FolderKanban className="w-4 h-4 text-white" />
                          <span>Milestone & Status</span>
                        </h5>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {project.status || 'Planning'}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Lifecycle Phase
                            </div>
                          </div>

                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {project.payment_history?.length || 0}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Installments
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 text-xs text-white/90 font-medium border-t border-white/20">
                          Target Completion:{' '}
                          <span className="font-extrabold text-white bg-black/20 px-2 py-0.5 rounded">
                            {formatDate(project.target_date || project.deadline)}
                          </span>
                        </div>
                      </div>

                      {/* Circular Progress Ring */}
                      <div className="flex-shrink-0 flex items-center justify-center relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg className="w-full h-full -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="38"
                            fill="none"
                            stroke="rgba(255, 255, 255, 0.25)"
                            strokeWidth="7"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="38"
                            fill="none"
                            stroke="#ffffff"
                            strokeWidth="7"
                            strokeLinecap="round"
                            strokeDasharray={`${(completionPercentage / 100) * 238.76}, 238.76`}
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-sm sm:text-base font-extrabold text-white leading-none">
                            {completionPercentage}%
                          </span>
                          <span className="text-[9px] uppercase tracking-wider text-white/85 font-bold mt-0.5">
                            Status
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. OJT DETAILED PAYMENT TRANSACTIONS REPORT */}
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#2dce89] to-[#20a36b] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <CreditCard className="w-4 h-4 text-white" />
                      <span>Project Installments & Payment Ledger ({project.payment_history?.length || 0})</span>
                    </h5>

                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Record Installment</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-5">
                    {(!project.payment_history || project.payment_history.length === 0) ? (
                      <div className="py-8 text-center text-[#8898aa]">
                        <CreditCard className="w-8 h-8 mx-auto text-[#adb5bd] mb-1.5" />
                        <p className="text-xs font-semibold text-[#172b4d]">No payment installments recorded for this project yet</p>
                        <p className="text-[11px] text-[#8898aa] mt-0.5">Click &quot;Record Installment&quot; above to log the first credited amount.</p>
                        <button
                          type="button"
                          onClick={() => setIsPaymentModalOpen(true)}
                          className="mt-3 btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#2dce89] hover:bg-[#229c68] rounded shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Record First Payment</span>
                        </button>
                      </div>
                    ) : (
                      <div className="table-responsive border border-[#dee2e6] rounded-md overflow-hidden">
                        <table className="table table-hover table-striped table-bordered w-full text-xs text-left">
                          <thead className="thead-light bg-[#f6f9fc] text-[#8898aa] text-[11px] font-bold uppercase tracking-wider border-b border-[#dee2e6]">
                            <tr>
                              <th className="py-3 px-3.5 border-r border-[#dee2e6] w-12 text-center">#</th>
                              <th className="py-3 px-3.5 border-r border-[#dee2e6]">Payment Date</th>
                              <th className="py-3 px-3.5 border-r border-[#dee2e6] text-right">Amount Paid</th>
                              <th className="py-3 px-3.5 border-r border-[#dee2e6] text-center">Payment Mode</th>
                              <th className="py-3 px-3.5 border-r border-[#dee2e6]">Recorded By</th>
                              <th className="py-3 px-3.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#dee2e6]">
                            {project.payment_history.map((pm, idx) => (
                              <tr key={pm.id} className="hover:bg-[#f6f9fc] transition-colors">
                                {/* Row Num */}
                                <td className="py-2.5 px-3.5 border-r border-[#dee2e6] text-center font-bold text-[#8898aa]">
                                  {idx + 1}
                                </td>

                                {/* Date */}
                                <td className="py-2.5 px-3.5 border-r border-[#dee2e6] text-[#525f7f]">
                                  <div className="font-bold text-[#172b4d]">
                                    {formatDate(pm.payment_date || pm.created_at)}
                                  </div>
                                  <div className="text-[10px] text-[#8898aa]">
                                    {formatDateTime(pm.created_at)}
                                  </div>
                                </td>

                                {/* Amount */}
                                <td className="py-2.5 px-3.5 border-r border-[#dee2e6] text-right font-extrabold text-[#2dce89]">
                                  {formatCurrency(pm.amount_paid)}
                                </td>

                                {/* Mode */}
                                <td className="py-2.5 px-3.5 border-r border-[#dee2e6] text-center">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                                    {pm.payment_mode || 'Bank Transfer'}
                                  </span>
                                </td>

                                {/* Recorded By */}
                                <td className="py-2.5 px-3.5 border-r border-[#dee2e6] text-[#525f7f]">
                                  {pm.recorded_by_name || 'Admin'}
                                </td>

                                {/* Status */}
                                <td className="py-2.5 px-3.5 text-center">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#e8f7ee] text-[#2dce89] border border-[#2dce89]/30">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Success</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          toast.success('Installment recorded successfully.');
          fetchProjectDetails();
        }}
        prefilledProject={project}
      />

      {/* Edit Project Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSuccess={() => {
          setIsProjectModalOpen(false);
          toast.success('Project updated successfully.');
          fetchProjectDetails();
        }}
        project={project}
      />
    </AppLayout>
  );
}

export default function ProjectViewPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Loading Project Reports...">
        <div className="py-20 text-center text-[#8898aa]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
          <p className="text-sm font-semibold">Loading Project Reports...</p>
        </div>
      </AppLayout>
    }>
      <ProjectViewContent />
    </Suspense>
  );
}

