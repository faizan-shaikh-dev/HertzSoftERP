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
  'Planning',
  'In Progress',
  'Testing & Review',
  'Completed',
  'On Hold',
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

    setLoading(true);

    try {
      let finalClientId = clientId || (clients.length > 0 ? String(clients[0].id) : '');

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
        finalClientId = String(createdClient.data.id);
      }

      if (!finalClientId) {
        setError('Please select or create an enterprise client.');
        setLoading(false);
        return;
      }

      const payload = {
        client_id: String(finalClientId),
        title: title.trim(),
        description: description.trim() || null,
        total_cost: totalCost ? Number(totalCost) : (project?.total_cost || 0),
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
      const msg = err?.response?.data?.error?.message || err?.message || 'Failed to save project. Please check inputs.';
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
        className="relative w-full max-w-xl bg-white rounded-lg shadow-2xl border border-[#DFEAF2] overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header - OJT Style */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#DFEAF2] bg-white">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#19324D] tracking-tight">
              {isEdit ? 'Edit Client Project' : 'Create Project'}
            </h3>
            <p className="text-xs text-[#71869B] mt-0.5">
              {isEdit ? `Modifying project contract #${project.id}` : 'Record a new contract with milestones & payment terms'}
            </p>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-[#19324D] hover:text-[#71869B] transition cursor-pointer p-0.5 rounded-full"
            aria-label="Close dialog"
          >
            <XCircle className="w-7 h-7 stroke-[1.5]" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          {error && (
            <div className="p-3 rounded-md bg-[#FDF2F2] border border-[#F5365C]/30 text-xs text-[#F5365C] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client Selection or Inline Creation */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#71869B]">
                Client / Company <span className="text-[#F5365C] font-bold ml-0.5">*</span>
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
              <div className="p-3.5 rounded-md bg-[#F4F8FC] border border-[#DFEAF2] space-y-2.5">
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
                    className="w-full px-3 py-2 bg-white text-xs text-[#19324D] rounded border border-[#DFEAF2] focus:border-[#4689C8] outline-none"
                  />
                  <input
                    type="text"
                    value={newClientCompany}
                    onChange={(e) => setNewClientCompany(e.target.value)}
                    placeholder="Company Name"
                    className="w-full px-3 py-2 bg-white text-xs text-[#19324D] rounded border border-[#DFEAF2] focus:border-[#4689C8] outline-none"
                  />
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 bg-white text-xs text-[#19324D] rounded border border-[#DFEAF2] focus:border-[#4689C8] outline-none font-mono"
                  />
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="Email Address"
                    className="w-full px-3 py-2 bg-white text-xs text-[#19324D] rounded border border-[#DFEAF2] focus:border-[#4689C8] outline-none"
                  />
                </div>
              </div>
            ) : (
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={loadingClients}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition cursor-pointer"
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
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Project Title <span className="text-[#F5365C] font-bold ml-0.5">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud ERP Software & Operations Portal"
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] placeholder-[#adb5bd] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition"
            />
          </div>

          {/* Cost & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Total Contract Value (INR) <span className="text-[10px] text-[#71869B] font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#71869B]">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  value={totalCost}
                  onChange={(e) => setTotalCost(e.target.value)}
                  placeholder="Optional contract value"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white text-[#19324D] placeholder-[#adb5bd] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Execution Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
                Estimated Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white text-[#19324D] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#71869B] mb-1.5">
              Project Description & Key Deliverables
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline deliverables, technical stack, or project milestones..."
              className="w-full px-3.5 py-2.5 bg-white text-[#19324D] placeholder-[#adb5bd] text-sm rounded-md border border-[#DFEAF2] focus:border-[#4689C8] focus:ring-2 focus:ring-[#5FC8D6]/20 outline-none transition resize-y"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#DFEAF2] flex items-center justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 bg-white hover:bg-[#EAF3FB] border border-[#DFEAF2] text-[#71869B] font-semibold text-xs sm:text-sm rounded shadow-2xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-[#3475B2] via-[#4689C8] to-[#5FC8D6] hover:from-[#2a5d8d] hover:to-[#3475B2] text-white font-bold text-xs sm:text-sm rounded shadow-sm shadow-[#4689C8]/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
