import api from '@/lib/api';

export const leadService = {
  // 1. Get all leads with optional query filters (status, search, lead_type)
  getLeads: async (params = {}) => {
    const response = await api.get('/leads', { params });
    // Expected response format: { success: true, count: number, data: Lead[] }
    return response.data;
  },

  // 2. Get single lead details by ID
  getLeadById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // 3. Create a new Client Lead
  createLead: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },

  // 4. Update Lead full details
  updateLead: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  },

  // 5. Update Lead status in pipeline
  updateLeadStatus: async (id, statusData) => {
    const response = await api.patch(`/leads/${id}/status`, statusData);
    return response.data;
  },

  // 6. Delete Lead by ID (Administrator privilege)
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },

  // 7. Get Team Members / Active Assignees
  getAssignees: async () => {
    const response = await api.get('/leads/assignees');
    return response.data;
  },

  // 8. Check Duplicate Phone across Leads and Clients
  checkDuplicatePhone: async (phone, excludeLeadId = null) => {
    const response = await api.get('/leads/check-duplicate', {
      params: { phone, excludeLeadId }
    });
    return response.data;
  }
};

export default leadService;
