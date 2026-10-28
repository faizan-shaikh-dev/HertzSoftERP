'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import projectService from '@/services/projectService';
import { useAuth } from '@/context/AuthContext';
import { 
  FolderKanban, 
  Plus, 
  Search, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Edit, 
  Trash2, 
  Building2, 
  RefreshCw, 
  Loader2, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Layers 
} from 'lucide-react';
import { ProjectModal, PaymentModal, ConfirmDeleteModal } from '@/components/modals';

const STATUS_OPTIONS = ['All', 'Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];

export default function ProjectsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Expanded project ID (to show installment history)
  const [expandedProjectId, setExpandedProjectId] = useState(null);

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
        toast.success('Projects list refreshed with latest transactions!');
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
      const msg = err.message || 'Could not fetch projects. Check server connectivity.';
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
      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      toast.success(`Project "${projectToDelete.title}" deleted.`);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
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
      if (selectedStatus !== 'All' && project.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = project.title?.toLowerCase().includes(q);
        const clientMatch = project.client_name?.toLowerCase().includes(q);
        const companyMatch = project.client_company?.toLowerCase().includes(q);

        if (!titleMatch && !clientMatch && !companyMatch) return false;
      }

      return true;
    });
  }, [projects, selectedStatus, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalCost = projects.reduce((acc, p) => acc + Number(p.total_cost || 0), 0);
    const totalPaid = projects.reduce((acc, p) => acc + Number(p.total_paid || 0), 0);
    const totalDue = projects.reduce((acc, p) => acc + Number(p.due_balance || 0), 0);
    const activeCount = projects.filter((p) => p.status === 'In Progress').length;
    return { totalCost, totalPaid, totalDue, activeCount };
  }, [projects]);

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

  return (
    <AppLayout title="Projects & Payments Tracking">
      {/* Top Banner Card with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/80 via-white to-slate-50 p-5 rounded-lg border border-indigo-100/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Client Contracts & Milestone Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time tracking of deal values, installment payments, and outstanding balances.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchProjects(true)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-md border border-slate-200 transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingProject(null);
              setIsProjectModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-md shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Project</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards (template-hz style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Contract Values
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(metrics.totalCost)}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Across {projects.length} recorded contracts
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Total Revenue Collected
          </span>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            {formatCurrency(metrics.totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-medium">
            Installments cleared
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Pending Dues
          </span>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {formatCurrency(metrics.totalDue)}
          </div>
          <div className="text-[11px] text-amber-600 mt-0.5 font-medium">
            To be collected
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-slate-200/90 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Active Deliveries
          </span>
          <div className="text-2xl font-black text-blue-900 mt-1">
            {metrics.activeCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            Projects currently in progress
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-lg border border-slate-200/90 shadow-sm overflow-hidden flex flex-col">
        {/* Filters Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-slate-50/70 to-white border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
                Filter Status:
              </span>
              {STATUS_OPTIONS.map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st}
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
                placeholder="Search projects or clients..."
                className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
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
            <button onClick={() => fetchProjects(false)} className="font-bold underline">
              Retry
            </button>
          </div>
        )}

        {/* Projects Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/90 text-[11px] font-bold uppercase text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Project & Client</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contract Value</th>
                <th className="py-3 px-4 min-w-[180px]">Payments & Balance</th>
                <th className="py-3 px-4">Timeline</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
                    <span className="text-xs font-medium">Aggregating contracts ledger...</span>
                  </td>
                </tr>
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => {
                  const percentPaid = project.total_cost > 0
                    ? Math.min(100, Math.round((Number(project.total_paid || 0) / Number(project.total_cost)) * 100))
                    : 0;

                  return (
                    <tr key={project.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* 1. Project & Client */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs">
                          {project.title}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>
                            {project.client_company ? `${project.client_company} (${project.client_name})` : project.client_name}
                          </span>
                        </div>
                      </td>

                      {/* 2. Status Badge */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          project.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : project.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : project.status === 'On Hold'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : project.status === 'Cancelled'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {project.status}
                        </span>
                      </td>

                      {/* 3. Contract Value */}
                      <td className="py-3 px-4 font-bold text-xs text-slate-900">
                        {formatCurrency(project.total_cost)}
                      </td>

                      {/* 4. Payment Progress Bar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-bold text-emerald-700">
                            {formatCurrency(project.total_paid)}
                          </span>
                          <span className="font-semibold text-amber-700">
                            Due: {formatCurrency(project.due_balance)}
                          </span>
                        </div>

                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/60">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              percentPaid >= 100 
                                ? 'bg-emerald-500' 
                                : percentPaid > 50 
                                ? 'bg-blue-500' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${percentPaid}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1 font-medium">
                          {percentPaid}% cleared
                        </div>
                      </td>

                      {/* 5. Timeline */}
                      <td className="py-3 px-4 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(project.start_date)}</span>
                        </div>
                        {project.deadline && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Target: {formatDate(project.deadline)}
                          </div>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setPaymentProject(project);
                              setIsPaymentModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors cursor-pointer"
                            title="Record Payment Installment"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>+ Payment</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingProject(project);
                              setIsProjectModalOpen(true);
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Edit Project"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setProjectToDelete(project);
                                setIsDeleteModalOpen(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
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
              ) : (
                <tr>
                  <td colSpan="6" className="py-16 text-center text-slate-400">
                    <FolderKanban className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">No projects found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Create your first client project to start tracking milestone payments.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Project Create / Edit Modal */}
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setEditingProject(null);
        }}
        project={editingProject}
        onSuccess={fetchProjects}
      />

      {/* Payment Installment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentProject(null);
        }}
        project={paymentProject}
        onSuccess={fetchProjects}
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
        title="Delete Project Record"
        message={`Are you sure you want to permanently delete the contract "${projectToDelete?.title}"? All associated installments will also be removed.`}
      />
    </AppLayout>
  );
}

