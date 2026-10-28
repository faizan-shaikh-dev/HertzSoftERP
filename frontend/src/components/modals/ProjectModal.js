'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'react-toastify';
import projectService from '@/services/projectService';
import { 
  X, 
  FolderKanban, 
  Building2, 
  IndianRupee, 
  Calendar, 
  Loader2, 
  Plus, 
  User 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="fixed inset-0 -z-10" 
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-indigo-50/90 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isEdit ? 'Edit Client Project' : 'Create New Client Project'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEdit ? `Modifying project contract #${project.id}` : 'Record a new contract with milestones & payment terms'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Client Selection or Inline Creation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                Client / Company *
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingNewClient((prev) => !prev)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingNewClient ? 'Choose Existing Client' : '+ New Client'}</span>
              </button>
            </div>

            {isCreatingNewClient ? (
              <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100 space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-800">
                  Quick Client Registration
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Contact Name *"
                    className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-900 rounded border border-slate-200 focus:border-indigo-600 outline-none"
                  />
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-900 rounded border border-slate-200 focus:border-indigo-600 outline-none"
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-900 rounded border border-slate-200 focus:border-indigo-600 outline-none"
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-2.5 py-1.5 bg-white text-xs text-slate-900 rounded border border-slate-200 focus:border-indigo-600 outline-none"
                  />
                </div>
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loadingClients}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud ERP Software & Operations Portal"
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Cost & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Total Contract Value (INR) *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  required
                  min="0"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="e.g. 250000"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Execution Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Estimated Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Project Description & Key Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, technical stack, or project milestones..."
              className="w-full px-3 py-2 bg-slate-50/70 focus:bg-white text-slate-900 text-xs rounded-md border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-md shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isEdit ? 'Save Project' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

