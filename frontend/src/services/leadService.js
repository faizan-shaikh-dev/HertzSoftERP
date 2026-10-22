import api from '@/lib/api';

export const leadService = {
  // 1. Fetch leads with optional query filters (lead_type, status, search)
  getLeads: async (params = {}) => {
    const response = await api.get('/leads', { params });
    return response.data;
  },

  // 2. Fetch single lead details by UUID
  getLeadById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },

  // 3. Create a new lead (Student inquiry or Client project inquiry)
  createLead: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },

  // 4. Update basic lead information
  updateLead: async (id, leadData) => {
    const response = await api.patch(`/leads/${id}`, leadData);
    return response.data;
  },

  // 5. Update lead pipeline status (New, Contacted, In Discussion, Won, Lost)
  updateLeadStatus: async (id, statusData) => {
    const response = await api.patch(`/leads/${id}/status`, statusData);
    return response.data;
  },

  // 6. Delete a lead record
  deleteLead: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  }
};

export default leadService;