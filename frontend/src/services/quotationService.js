import api from '@/lib/api';

export const quotationService = {
  // 1. Get all quotations (with filters: client_id, project_id, status, search)
  getQuotations: async (params = {}) => {
    const response = await api.get('/quotations', { params });
    return response.data;
  },

  // 2. Get single quotation by ID with line items & version history
  getQuotationById: async (id) => {
    const response = await api.get(`/quotations/${id}`);
    return response.data;
  },

  // 3. Get quotation financial metrics & conversion stats
  getQuotationMetrics: async () => {
    const response = await api.get('/quotations/metrics');
    return response.data;
  },

  // 4. Create new quotation with line items
  createQuotation: async (quotationData) => {
    const response = await api.post('/quotations', quotationData);
    return response.data;
  },

  // 5. Update draft quotation
  updateQuotation: async (id, quotationData) => {
    const response = await api.put(`/quotations/${id}`, quotationData);
    return response.data;
  },

  // 6. Revise quotation (Creates v2, v3... and marks previous as Superseded)
  reviseQuotation: async (id, revisionData) => {
    const response = await api.post(`/quotations/${id}/revise`, revisionData);
    return response.data;
  },

  // 7. Update quotation status (Draft, Sent, Accepted, Rejected, Expired)
  updateQuotationStatus: async (id, status) => {
    const response = await api.patch(`/quotations/${id}/status`, { status });
    return response.data;
  },

  // 8. Delete quotation (Admin only)
  deleteQuotation: async (id) => {
    const response = await api.delete(`/quotations/${id}`);
    return response.data;
  },

  // 9. Printable HTML URL
  getPrintableUrl: (id) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/quotations/${id}/print`;
  }
};

export default quotationService;

