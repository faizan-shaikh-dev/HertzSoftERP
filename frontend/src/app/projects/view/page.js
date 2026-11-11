'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
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
  FileText,
  Receipt,
  Send,
  Trash2,
  Sparkles,
  UserCheck,
  Tag,
  Search,
  Moon,
  XCircle,
  Check,
  ChevronRight
} from 'lucide-react';
import { toast } from 'react-toastify';
import AppLayout from '@/components/AppLayout';
import projectService from '@/services/projectService';
import { ProjectModal, ConfirmDeleteModal } from '@/components/modals';
import { useAuth } from '@/context/AuthContext';

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// Project Lifecycle Statuses
export const PROJECT_STATUSES = [
  {
    number: 1,
    id: 'Planning',
    label: 'Planning & Kickoff',
    icon: Sparkles,
    color: 'bg-[#4689C8]',
    textColor: 'text-[#4689C8]',
    borderColor: 'border-l-[#4689C8]',
    lightBg: 'bg-[#EAF3FB]'
  },
  {
    number: 2,
    id: 'In Progress',
    label: 'In Progress / Development',
    icon: Clock,
    color: 'bg-[#5FC8D6]',
    textColor: 'text-[#39AFC0]',
    borderColor: 'border-l-[#5FC8D6]',
    lightBg: 'bg-[#E8F8FA]'
  },
  {
    number: 3,
    id: 'Testing & Review',
    label: 'Testing & Client Review',
    icon: Search,
    color: 'bg-[#8965E0]',
    textColor: 'text-[#8965E0]',
    borderColor: 'border-l-[#8965E0]',
    lightBg: 'bg-purple-50'
  },
  {
    number: 4,
    id: 'Completed',
    label: 'Delivered & Completed',
    icon: CheckCircle2,
    color: 'bg-[#20A36B]',
    textColor: 'text-[#20A36B]',
    borderColor: 'border-l-[#20A36B]',
    lightBg: 'bg-[#EAF8F1]'
  },
  {
    number: 5,
    id: 'On Hold',
    label: 'On Hold',
    icon: Moon,
    color: 'bg-[#71869B]',
    textColor: 'text-[#71869B]',
    borderColor: 'border-l-[#71869B]',
    lightBg: 'bg-[#F4F8FC]'
  },
  {
    number: 6,
    id: 'Cancelled',
    label: 'Cancelled',
    icon: XCircle,
    color: 'bg-[#F5365C]',
    textColor: 'text-[#F5365C]',
    borderColor: 'border-l-[#F5365C]',
    lightBg: 'bg-[#FDF2F2]'
  }
];

// Core progression pipeline for stepper
const PROJECT_PIPELINE = [
  'Planning',
  'In Progress',
  'Testing & Review',
  'Completed'
];

// Helper to resolve status meta styling and icon
const getProjectStatusMeta = (status) => {
  if (!status) return PROJECT_STATUSES[0];
  const clean = String(status).trim().toLowerCase();

  const exact = PROJECT_STATUSES.find(s => s.id.toLowerCase() === clean);
  if (exact) return exact;

  if (clean.includes('plan') || clean.includes('not started') || clean.includes('kickoff') || clean.includes('init')) {
    return PROJECT_STATUSES[0];
  }
  if (clean.includes('progress') || clean.includes('develop') || clean.includes('active') || clean.includes('build')) {
    return PROJECT_STATUSES[1];
  }
  if (clean.includes('test') || clean.includes('review') || clean.includes('qa') || clean.includes('audit')) {
    return PROJECT_STATUSES[2];
  }
  if (clean.includes('complet') || clean.includes('deliver') || clean.includes('done') || clean.includes('finish')) {
    return PROJECT_STATUSES[3];
  }
  if (clean.includes('hold') || clean.includes('pause') || clean.includes('wait')) {
    return PROJECT_STATUSES[4];
  }
  if (clean.includes('cancel') || clean.includes('drop') || clean.includes('reject')) {
    return PROJECT_STATUSES[5];
  }

  return {
    number: '•',
    id: status,
    label: status,
    icon: FolderKanban,
    color: 'bg-[#4689C8]',
    textColor: 'text-[#4689C8]',
    borderColor: 'border-l-[#4689C8]',
    lightBg: 'bg-blue-50'
  };
};

function ProjectViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toLowerCase().includes('admin');

  // Support ?id=..., ?project_id=..., ?projects_id=...
  const projectId = searchParams.get('id') || searchParams.get('project_id') || searchParams.get('projects_id');

  const [project, setProject] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Delete Activity / Milestone Modal state
  const [isDeleteActivityModalOpen, setIsDeleteActivityModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [deletingActivity, setDeletingActivity] = useState(false);

  // Activity Logging form state
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  const [newActivityStatus, setNewActivityStatus] = useState('In Progress');
  const [newActivityNotes, setNewActivityNotes] = useState('');
  const [syncProjectStatus, setSyncProjectStatus] = useState(true);
  const [submittingActivity, setSubmittingActivity] = useState(false);

  // Fetch project details and activity history
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
        setActivities(res.data.activities || []);
        if (res.data.status) {
          setNewActivityStatus(res.data.status);
        }
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

  // Format standard date
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

  // Format timeline date and time
  const formatTimelineDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'pm' : 'am';
      hours = hours % 12;
      hours = hours ? hours : 12;
      return `${month}-${day}-${year} ${hours}:${minutes} ${ampm}`;
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

  // Clean phone number for WhatsApp link
  const waPhone = useMemo(() => {
    if (!project?.client_phone) return '';
    const digits = String(project.client_phone).replace(/\D/g, '');
    if (digits.length === 10) return `91${digits}`;
    return digits;
  }, [project?.client_phone]);

  // Quick project status update
  const handleStatusChange = async (targetStatus) => {
    if (!project || project.status === targetStatus || updatingStatus) return;

    try {
      setUpdatingStatus(true);
      await projectService.updateProject(project.id, {
        status: targetStatus,
        status_note: `Project lifecycle phase transitioned to "${targetStatus}".`
      });
      toast.success(`Project moved to ${targetStatus}`);
      await fetchProjectDetails();
    } catch (err) {
      console.error('Failed to change project status:', err);
      toast.error(err?.response?.data?.error?.message || 'Could not update project status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Submit new activity / milestone record
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    if (!newActivityNotes.trim()) {
      toast.warning('Please enter activity notes or remarks.');
      return;
    }

    try {
      setSubmittingActivity(true);
      await projectService.createProjectActivity(project.id, {
        status: newActivityStatus,
        notes: newActivityNotes.trim(),
        update_project_status: syncProjectStatus
      });

      toast.success('Activity milestone recorded successfully!');
      setNewActivityNotes('');
      setIsAddingActivity(false);
      await fetchProjectDetails();
    } catch (err) {
      console.error('Failed to record activity:', err);
      toast.error(err?.response?.data?.error?.message || 'Could not save activity.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Trigger Delete Milestone / Activity modal
  const openDeleteActivityModal = (activity) => {
    setActivityToDelete(activity);
    setIsDeleteActivityModalOpen(true);
  };

  // Confirm Delete Activity / Milestone
  const confirmDeleteActivity = async () => {
    if (!activityToDelete) return;

    try {
      setDeletingActivity(true);
      await projectService.deleteProjectActivity(activityToDelete.id);
      toast.success('Activity removed.');
      setActivities((prev) => prev.filter((a) => a.id !== activityToDelete.id));
      setIsDeleteActivityModalOpen(false);
      setActivityToDelete(null);
    } catch (err) {
      console.error('Failed to delete activity:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to delete activity.');
    } finally {
      setDeletingActivity(false);
    }
  };

  // Delete project confirmation
  const confirmDeleteProject = async () => {
    if (!project) return;
    try {
      setDeleting(true);
      await projectService.deleteProject(project.id);
      toast.success('Project contract removed successfully.');
      router.push('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      toast.error(err?.response?.data?.error?.message || 'Failed to delete project.');
    } finally {
      setDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Pipeline stage calculations
  const normalizedCurrentStatus = useMemo(() => {
    if (!project?.status) return 'Planning';
    const s = project.status.toLowerCase();
    if (s.includes('not started') || s.includes('plan')) return 'Planning';
    if (s.includes('progress') || s.includes('develop')) return 'In Progress';
    if (s.includes('test') || s.includes('review')) return 'Testing & Review';
    if (s.includes('complet') || s.includes('deliver')) return 'Completed';
    return project.status;
  }, [project?.status]);

  const isCompleted = normalizedCurrentStatus === 'Completed';
  const completionPercentage = isCompleted ? 100 : normalizedCurrentStatus === 'Testing & Review' ? 75 : normalizedCurrentStatus === 'In Progress' ? 50 : 25;

  const currentStatusMeta = getProjectStatusMeta(project?.status);

  return (
    <AppLayout title="Project Details & Reports">
      <div className="container-fluid px-0 sm:px-2">
        {/* MAIN MASTER CARD */}
        <div className="card shadow-sm mb-4 mainCard bg-white border border-[#DFEAF2] rounded-xl overflow-hidden">
          {/* Card Header with Back Button and Actions */}
          <div className="card-header bg-white border-b border-[#DFEAF2] py-4 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push('/projects')}
                className="btn btn-sm inline-flex items-center justify-center w-9 h-9 rounded-lg bg-[#EAF3FB] hover:bg-[#4689C8] hover:text-white text-[#4689C8] border border-[#78A9D7]/40 shadow-xs transition cursor-pointer flex-shrink-0"
                title="Back to Projects"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight m-0">
                    Project Details &amp; Reports
                  </h2>
                  {project?.status && (
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${currentStatusMeta.lightBg} ${currentStatusMeta.textColor} border border-current/30`}>
                      {project.status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71869B] mt-0.5">
                  End-to-end client deliverables, pipeline lifecycle milestones, and execution timeline.
                </p>
              </div>
            </div>

            {/* Header Right Action Buttons */}
            {project && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Edit Project Button */}
                <button
                  type="button"
                  onClick={() => setIsProjectModalOpen(true)}
                  className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg shadow-xs transition cursor-pointer"
                  title="Edit Project Details"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Project</span>
                </button>

                {/* Quick Lifecycle Stage Selector Dropdown */}
                <div className="inline-flex items-center gap-1">
                  <select
                    value={project.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none cursor-pointer"
                  >
                    {PROJECT_STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        Stage #{s.number}: {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Delete Button (Admin Only) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="btn btn-sm inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#F5365C] bg-[#FDF2F2] hover:bg-[#F5365C]/10 border border-[#F5365C]/30 rounded-lg shadow-xs transition cursor-pointer"
                    title="Delete Project Contract"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={fetchProjectDetails}
                  disabled={loading}
                  className="btn btn-sm inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white hover:bg-[#EAF3FB] text-[#19324D] border border-[#DFEAF2] shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Reload details"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#4689C8]' : ''}`} />
                </button>
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="card-body p-4 sm:p-6 bg-[#F4F8FC]/50 space-y-6">
            {/* Loading Spinner */}
            {loading && !project && (
              <div className="py-20 text-center text-[#71869B]">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
                <p className="text-sm font-semibold">Loading project contract details and activity timeline...</p>
              </div>
            )}

            {/* Error Message */}
            {!loading && error && (
              <div className="p-6 text-center bg-white border border-red-200 rounded-xl shadow-xs my-6">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <h3 className="text-base font-bold text-[#19324D]">Unable to Load Project</h3>
                <p className="text-xs text-red-600 mt-1 max-w-md mx-auto">{error}</p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <Link
                    href="/projects"
                    className="btn btn-sm px-4 py-2 text-xs font-semibold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg"
                  >
                    Return to Projects
                  </Link>
                </div>
              </div>
            )}

            {/* Project Content */}
            {!loading && project && (
              <>
                {/* 0. END-TO-END TRACEABILITY BREADCRUMB (Lead -> Client -> Project) */}
                <div className="bg-white border border-[#DFEAF2] rounded-xl p-3 sm:p-4 shadow-2xs">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
                      <span className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider mr-1">
                        Lifecycle Traceability:
                      </span>

                      {/* 1. Origin Lead (If converted) */}
                      {project.origin_lead_id ? (
                        <Link
                          href={`/leads/view?id=${project.origin_lead_id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#EAF3FB] text-[#4689C8] hover:bg-[#4689C8] hover:text-white border border-[#78A9D7]/40 transition group"
                          title="View Original Lead Pipeline Record"
                        >
                          <Tag className="w-3.5 h-3.5" />
                          <span>Origin Lead #{project.origin_lead_number || '1'} ({project.origin_lead_name || 'Inquiry'})</span>
                          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#F4F8FC] text-[#71869B] border border-[#DFEAF2]">
                          <span>Direct Client Acquisition</span>
                        </span>
                      )}

                      <ChevronRight className="w-3.5 h-3.5 text-[#71869B]" />

                      {/* 2. Client Profile */}
                      <Link
                        href={`/clients`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#EAF8F1] text-[#20A36B] hover:bg-[#20A36B] hover:text-white border border-[#20A36B]/40 transition group"
                        title="View Client Profile"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Client #{project.client_number || 'Linked'} ({project.client_company || project.client_name})</span>
                        <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                      </Link>

                      <ChevronRight className="w-3.5 h-3.5 text-[#71869B]" />

                      {/* 3. Active Project */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#19324D] text-white shadow-2xs">
                        <FolderKanban className="w-3.5 h-3.5 text-[#5FC8D6]" />
                        <span>Project #{project.id.slice(0, 8)}: {project.title}</span>
                      </span>
                    </div>

                    {project.origin_lead_id && (
                      <Link
                        href={`/leads/view?id=${project.origin_lead_id}`}
                        className="text-xs font-bold text-[#4689C8] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Full Lead History</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* 1. PROJECT & CLIENT BASIC INFORMATION CARD */}
                <div className="card shadow-sm border border-[#DFEAF2] rounded-xl overflow-hidden bg-white">
                  {/* Brand Gradient Banner */}
                  <div className="bg-gradient-to-r from-[#3475B2] via-[#4689C8] to-[#5FC8D6] text-white px-5 py-3.5 flex items-center justify-between">
                    <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                      <FolderKanban className="w-4 h-4 text-white" />
                      <span>Project Deliverable &amp; Client Information</span>
                    </h5>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/20 text-white border border-white/30 backdrop-blur-xs">
                      #{project.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* 2-Column Grid of Bordered Field Boxes */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      {/* Project Title */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Project Title / Deliverable
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5">
                          {project.title}
                        </div>
                      </div>

                      {/* Client Name with Profile Badge */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Client / Contact Person
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{project.client_name || '-'}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#EAF8F1] text-[#20A36B] border border-[#20A36B]/30">
                            Client #{project.client_number || 'Linked'}
                          </span>
                        </div>
                      </div>

                      {/* Company Name */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Company / Business Entity
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#71869B]" />
                          <span>{project.client_company || 'Individual Client'}</span>
                        </div>
                      </div>

                      {/* Origin Lead Connection */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Origin Lead &amp; Inquiry
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5 flex items-center gap-2">
                          {project.origin_lead_id ? (
                            <Link
                              href={`/leads/view?id=${project.origin_lead_id}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4689C8] hover:underline"
                            >
                              <Tag className="w-3.5 h-3.5 text-[#4689C8]" />
                              <span>Lead #{project.origin_lead_number}: {project.origin_lead_inquiry || 'Inquiry Won'}</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          ) : (
                            <span className="text-xs text-[#71869B] font-medium">Direct Account (No Prior Lead)</span>
                          )}
                        </div>
                      </div>

                      {/* Client Phone with WhatsApp Quick Action */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Primary Contact No
                        </div>
                        <div className="text-sm font-bold text-[#19324D] mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{project.client_phone || '—'}</span>
                          {waPhone && (
                            <a 
                              href={`https://wa.me/${waPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#20A36B]/10 text-[#20A36B] hover:bg-[#20A36B]/20 transition"
                              title="Chat with client on WhatsApp"
                            >
                              <WhatsAppIcon className="w-3.5 h-3.5 text-[#20A36B]" />
                              <span>WhatsApp</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Client Email */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Client Email Address
                        </div>
                        <div className="text-sm font-semibold text-[#19324D] mt-0.5">
                          {project.client_email ? (
                            <a 
                              href={`mailto:${project.client_email}`} 
                              className="text-[#4689C8] hover:underline flex items-center gap-1.5"
                            >
                              <Mail className="w-3.5 h-3.5 text-[#4689C8]" />
                              <span>{project.client_email}</span>
                            </a>
                          ) : (
                            <span className="text-[#71869B] font-normal italic">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Start Date */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Project Start Date
                        </div>
                        <div className="text-xs font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-[#4689C8]" />
                          <span>{formatDate(project.start_date || project.created_at)}</span>
                        </div>
                      </div>

                      {/* Expected Completion Date */}
                      <div className="border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Target Completion Date
                        </div>
                        <div className="text-xs font-semibold text-[#19324D] mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#39AFC0]" />
                          <span>{formatDate(project.target_date || project.deadline)}</span>
                        </div>
                      </div>

                      {/* Billing Address */}
                      <div className="md:col-span-2 border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Billing Address
                        </div>
                        <div className="text-xs font-semibold text-[#19324D] mt-0.5 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#71869B] mt-0.5 flex-shrink-0" />
                          <span>{project.client_address || 'No address specified'}</span>
                        </div>
                      </div>

                      {/* Technical Scope / Description */}
                      <div className="md:col-span-2 border border-[#DFEAF2] p-2.5 rounded-lg bg-white hover:border-[#4689C8]/40 transition">
                        <div className="text-[11px] font-bold text-[#71869B] uppercase tracking-wider">
                          Project Description &amp; Technical Scope
                        </div>
                        <div className="text-xs text-[#19324D] mt-1 whitespace-pre-line leading-relaxed">
                          {project.description || 'No detailed technical scope recorded for this contract.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. ACTIVITY & MILESTONE HISTORY (Vertical Timeline) */}
                <div className="card shadow-sm border border-[#DFEAF2] rounded-xl overflow-hidden bg-white">
                  <div className="bg-gradient-to-r from-[#19324D] to-[#3475B2] text-white px-5 py-3.5 flex items-center justify-between">
                    <div>
                      <h5 className="text-sm sm:text-base font-bold flex items-center gap-2 m-0 text-white">
                        <FolderKanban className="w-4 h-4 text-white" />
                        <span>Activity &amp; Milestone History ({activities.length})</span>
                      </h5>
                      <p className="text-xs text-[#E8F8FA] mt-0.5 m-0">
                        Real-time delivery progress logs &amp; milestone timeline
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddingActivity(!isAddingActivity)}
                      className="btn btn-sm inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg shadow-xs transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isAddingActivity ? 'Close Form' : 'Log Activity'}</span>
                    </button>
                  </div>

                  <div className="p-4 sm:p-6">
                    {/* Collapsible New Activity Form */}
                    {isAddingActivity && (
                      <div className="mb-6 p-4 sm:p-5 bg-[#F4F8FC] border border-[#DFEAF2] rounded-xl shadow-2xs">
                        <div className="flex items-center justify-between mb-3 border-b border-[#DFEAF2] pb-2">
                          <h6 className="text-xs font-bold text-[#19324D] uppercase tracking-wider flex items-center gap-1.5 m-0">
                            <Plus className="w-3.5 h-3.5 text-[#4689C8]" />
                            <span>Record Milestone / Progress Note</span>
                          </h6>
                          <button
                            type="button"
                            onClick={() => setIsAddingActivity(false)}
                            className="text-xs text-[#71869B] hover:text-[#19324D] font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleCreateActivity} className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-[#19324D] uppercase mb-1">
                                Lifecycle Stage *
                              </label>
                              <select
                                value={newActivityStatus}
                                onChange={(e) => setNewActivityStatus(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none cursor-pointer"
                              >
                                {PROJECT_STATUSES.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    Stage #{s.number}: {s.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex items-end">
                              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#19324D] pb-2 select-none">
                                <input
                                  type="checkbox"
                                  checked={syncProjectStatus}
                                  onChange={(e) => setSyncProjectStatus(e.target.checked)}
                                  className="rounded text-[#4689C8] focus:ring-[#4689C8]"
                                />
                                <span>Also sync current project status to &quot;{newActivityStatus}&quot;</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-[#19324D] uppercase mb-1">
                              Milestone Remark / Notes *
                            </label>
                            <textarea
                              rows="3"
                              value={newActivityNotes}
                              onChange={(e) => setNewActivityNotes(e.target.value)}
                              placeholder="Enter progress update, sprint delivery notes, client feedback remarks here..."
                              className="w-full px-3 py-2 text-xs rounded-lg border border-[#DFEAF2] bg-white text-[#19324D] placeholder-[#71869B] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none leading-relaxed resize-none"
                              required
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingActivity(false);
                                setNewActivityNotes('');
                              }}
                              className="btn btn-sm px-3.5 py-1.5 text-xs font-semibold text-[#19324D] bg-white border border-[#DFEAF2] hover:bg-[#EAF3FB] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submittingActivity}
                              className="btn btn-sm inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#4689C8] hover:bg-[#3475B2] rounded-lg shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>{submittingActivity ? 'Saving...' : 'Save Milestone Record'}</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* VERTICAL TIMELINE CONTAINER */}
                    {activities.length === 0 ? (
                      <div className="py-12 text-center text-[#71869B] bg-[#F4F8FC] border border-dashed border-[#DFEAF2] rounded-xl">
                        <FolderKanban className="w-10 h-10 mx-auto text-[#71869B]/40 mb-2.5 opacity-60" />
                        <h4 className="font-bold text-sm text-[#19324D]">No delivery activities recorded yet</h4>
                        <p className="text-xs text-[#71869B] mt-1 max-w-sm mx-auto">
                          Click &quot;Log Activity&quot; above or update the delivery stage to start capturing progress remarks.
                        </p>
                      </div>
                    ) : (
                      <div className="relative pt-2 pb-4 px-1 sm:px-4">
                        {/* Continuous vertical timeline stem line */}
                        <div className="hidden sm:block absolute left-[169px] top-6 bottom-6 w-0.5 bg-[#DFEAF2]" />
                        <div className="sm:hidden absolute left-5 top-6 bottom-6 w-0.5 bg-[#DFEAF2]" />

                        <div className="space-y-7">
                          {activities.map((item, idx) => {
                            const meta = getProjectStatusMeta(item.status);
                            const StatusIcon = meta.icon;
                            const formattedDate = formatTimelineDateTime(item.activity_date || item.created_at);

                            return (
                              <div
                                key={item.id || idx}
                                className="relative flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 group"
                              >
                                {/* 1. Date & Time */}
                                <div className="pl-12 sm:pl-0 sm:w-[130px] sm:text-right flex-shrink-0 pt-1">
                                  <span className="text-[11px] font-mono font-medium text-[#71869B] tracking-tight">
                                    {formattedDate}
                                  </span>
                                </div>

                                {/* 2. Timeline Circle Node */}
                                <div className="absolute left-1 sm:relative sm:left-auto flex-shrink-0 z-10">
                                  <div className={`w-8 h-8 rounded-full ${meta.color} flex items-center justify-center text-white ring-4 ring-white shadow-xs transition-transform group-hover:scale-110`}>
                                    <StatusIcon className="w-4 h-4" />
                                  </div>
                                </div>

                                {/* 3. Status Title & Remark Card */}
                                <div className="pl-12 sm:pl-0 flex-1 min-w-0">
                                  {/* Status Name Header */}
                                  <div className="flex items-center gap-2 mb-2 pt-0.5">
                                    <h4 className="text-sm font-bold text-[#19324D] tracking-tight m-0">
                                      {meta.label}
                                    </h4>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${meta.lightBg} ${meta.textColor} border border-current/20`}>
                                      Stage #{meta.number}
                                    </span>
                                    {item.created_by_name && (
                                      <span className="text-[10px] text-[#71869B]">
                                        by {item.created_by_name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Sub-branch Connector & Single Remark Card */}
                                  <div className="flex items-start gap-2.5">
                                    {/* Branch connector line with circle */}
                                    <div className="flex items-center h-6 text-[#DFEAF2] select-none pt-1">
                                      <span className="w-3.5 h-0.5 bg-[#DFEAF2] inline-block" />
                                      <span className="w-2 h-2 rounded-full border border-[#DFEAF2] bg-white inline-block -ml-0.5" />
                                    </div>

                                    {/* Remark Card */}
                                    <div className={`flex-1 bg-[#F8FAFD] border border-[#DFEAF2] border-l-4 ${meta.borderColor} rounded-r-xl p-3.5 shadow-2xs relative hover:bg-white hover:border-[#CBDCEB] transition duration-150`}>
                                      <div className="text-xs sm:text-sm text-[#19324D] leading-relaxed pr-8 whitespace-pre-wrap">
                                        {item.notes || 'Activity milestone logged without additional notes.'}
                                      </div>

                                      {/* Hover Delete Action Button */}
                                      {isAdmin && (
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                          <button
                                            type="button"
                                            onClick={() => openDeleteActivityModal(item)}
                                            className="p-1.5 text-[#71869B] hover:text-[#F5365C] hover:bg-[#FDF2F2] rounded-md border border-transparent hover:border-[#F5365C]/30 transition cursor-pointer"
                                            title="Delete Activity Record"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. PROJECT SCOPE & DELIVERY METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Card: Project Contract & Scope Details */}
                  <div className="rounded-xl p-5 text-white shadow-md relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #4689C8 0%, #5FC8D6 100%)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <h5 className="text-sm font-bold uppercase tracking-wider text-white/95 flex items-center gap-1.5 m-0">
                          <FolderKanban className="w-4 h-4 text-white" />
                          <span>Project Milestones &amp; Scope</span>
                        </h5>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {activities.length}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Logged Milestones
                            </div>
                          </div>

                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              Stage #{currentStatusMeta.number || 1}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Active Phase
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 text-xs text-white/90 font-medium border-t border-white/20 flex items-center justify-between flex-wrap gap-2">
                          <span>Initiated: <strong>{formatDate(project.start_date || project.created_at)}</strong></span>
                          <span>Target: <strong>{formatDate(project.target_date || project.deadline)}</strong></span>
                        </div>
                      </div>

                      {/* Icon Badge */}
                      <div className="flex-shrink-0 hidden sm:flex items-center justify-center w-20 h-20 rounded-2xl bg-white/15 backdrop-blur-xs border border-white/25">
                        <FolderKanban className="w-10 h-10 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Right Card: Delivery Status & Lifecycle Progress */}
                  <div className="rounded-xl p-5 text-white shadow-md relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #3475B2 0%, #4689C8 100%)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-3">
                        <h5 className="text-sm font-bold uppercase tracking-wider text-white/95 flex items-center gap-1.5 m-0">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                          <span>Delivery Status &amp; Progress</span>
                        </h5>

                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {project.status || 'Planning'}
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Current Phase
                            </div>
                          </div>

                          <div>
                            <div className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                              {completionPercentage}%
                            </div>
                            <div className="text-[11px] text-white/85 font-semibold mt-0.5 uppercase tracking-wider">
                              Execution Status
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

              </>
            )}
          </div>
        </div>
      </div>

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

      {/* Delete Project Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDeleteProject}
        loading={deleting}
        title="Delete Project Contract"
        message={`Are you sure you want to permanently delete project contract "${project?.title}"? This will remove all associated activity records.`}
      />

      {/* Delete Milestone / Activity Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteActivityModalOpen}
        onClose={() => {
          setIsDeleteActivityModalOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={confirmDeleteActivity}
        loading={deletingActivity}
        title="Delete Milestone / Activity"
        message="Are you sure you want to delete this activity milestone? This entry will be permanently removed from the project timeline."
      />
    </AppLayout>
  );
}

export default function ProjectViewPage() {
  return (
    <Suspense fallback={
      <AppLayout title="Loading Project Reports...">
        <div className="py-20 text-center text-[#71869B]">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#4689C8] mb-3" />
          <p className="text-sm font-semibold">Loading Project Reports...</p>
        </div>
      </AppLayout>
    }>
      <ProjectViewContent />
    </Suspense>
  );
}
