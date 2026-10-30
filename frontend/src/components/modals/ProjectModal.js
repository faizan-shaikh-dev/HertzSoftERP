'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import projectService from '@/services/projectService';
import { 
  XCircle, 
  IndianRupee, 
  Loader2, 
  Plus, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
];

export default function ProjectModal({ isOpen, onClose, project = null, onSuccess }) {
  const [mounted, setMounted] = useState(false);
  const isEdit = !!project;

  const [clients, setClients] = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);

  // Quick Client Creation toggle
  const [isCreatingNewClient, setIsCreatingNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');

  // Project Fields
  const [clientId, setClientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [status, setStatus] = useState('In Progress');
  const [startDate, setStartDate] = useState('');
  const [deadline, setDeadline] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch clients for dropdown
  const loadClients = async () => {
    try {
      setLoadingClients(true);
      const res = await projectService.getClients();
      setClients(res.data || []);
      if (!clientId && res.data?.length > 0) {
        setClientId(String(res.data[0].id));
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadClients();
      setIsCreatingNewClient(false);
      setNewClientName('');
      setNewClientCompany('');
      setNewClientPhone('');
      setNewClientEmail('');
      setError('');

      if (project) {
        setClientId(String(project.client_id || ''));
        setTitle(project.title || '');
        setDescription(project.description || '');
        setTotalCost(project.total_cost ? String(project.total_cost) : '');
        setStatus(project.status || 'In Progress');
        setStartDate(project.start_date ? project.start_date.slice(0, 10) : '');
        setDeadline(project.deadline ? project.deadline.slice(0, 10) : '');
      } else {
        setTitle('');
        setDescription('');
        setTotalCost('');
        setStatus('In Progress');
        setStartDate(new Date().toISOString().slice(0, 10));
        setDeadline('');
      }
    }
  }, [project, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please provide a project title.');
      return;
    }
    if (!totalCost || Number(totalCost) < 0) {
      setError('Please specify a valid total contract amount.');
      return;
    }

    setLoading(true);

    try {
      let finalClientId = clientId;

      // If user is adding a new client on the fly
      if (isCreatingNewClient) {
        if (!newClientName.trim()) {
          setError('Client contact name is required.');
          setLoading(false);
          return;
        }
        const createdClient = await projectService.createClient({
          name: newClientName.trim(),
          company_name: newClientCompany.trim() || null,
          phone: newClientPhone.trim() || null,
          email: newClientEmail.trim() || null
        });
        finalClientId = createdClient.data.id;
      }

      if (!finalClientId) {
        setError('Please select or create an enterprise client.');
        setLoading(false);
        return;
      }

      const payload = {
        client_id: Number(finalClientId),
        title: title.trim(),
        description: description.trim() || null,
        total_cost: Number(totalCost),
        status,
        start_date: startDate || null,
        deadline: deadline || null
      };

      if (isEdit) {
        await projectService.updateProject(project.id, payload);
        toast.success(`Project "${title}" updated successfully!`);
      } else {
        await projectService.createProject(payload);
        toast.success(`New contract project "${title}" registered!`);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      const msg = err.message || 'Failed to save project. Please check inputs.';
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
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#e9ecef] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#172b4d] tracking-tight">
              {isEdit ? 'Edit Client Project' : 'Create Project'}
            </h3>
            <p className="text-xs text-[#8898aa] mt-0.5">
              {isEdit ? `Modifying project contract #${project.id}` : 'Record a new contract with milestones & payment terms'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#172b4d] hover:text-[#525f7f] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
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

          {/* Client Selection or Inline Creation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#525f7f]">
                Client / Company <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewClient((prev) => !prev)}
                className="text-xs font-bold text-[#4689C8] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingNewClient ? 'Choose Existing Client' : '+ New Client'}</span>
              </button>
            </div>

            {isCreatingNewClient ? (
              <div className="p-3.5 rounded-md bg-[#f8f9fe] border border-[#dee2e6] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#4689C8]">
                  Quick Client Registration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Contact Name *"
                    className="w-full px-3 py-2 bg-white text-xs text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-3 py-2 bg-white text-xs text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 bg-white text-xs text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none font-mono"
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-3 py-2 bg-white text-xs text-[#172b4d] rounded border border-[#dee2e6] focus:border-[#4689C8] outline-none"
                  />
                </div>
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loadingClients}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name ? `${c.company_name} (${c.name})` : c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Project Title */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Project Title <span className="text-[#f5365c] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud ERP Software & Operations Portal"
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
            />
          </div>

          {/* Cost & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Total Contract Value (INR) <span className="text-[#f5365c] font-bold ml-0.5">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#8898aa]">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Execution Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
                Estimated Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#525f7f] mb-1.5">
              Project Description & Key Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, technical stack, or project milestones..."
              className="w-full px-3.5 py-2.5 bg-white text-[#172b4d] placeholder-[#adb5bd] text-sm rounded-md border border-[#dee2e6] focus:border-[#4689C8] focus:ring-1 focus:ring-[#4689C8] outline-none transition resize-y"
            />
          </div>

          {/* Full-Width Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#4689C8] hover:bg-[#3876b0] text-white font-bold text-sm rounded shadow-md shadow-[#4689C8]/25 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Project...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEdit ? 'Update Project' : 'Create Project'}</span>
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
