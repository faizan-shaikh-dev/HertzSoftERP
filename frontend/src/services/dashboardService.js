import api from '@/lib/api';

export const dashboardService = {
  // Fetch consolidated ERP analytics & KPIs (Leads, Projects, Financials, Documents, Recent Activity)
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    // Expected response format: { success: true, data: { leads, projects, financials, documents, recent_activity } }
    return response.data;
  }
};

export default dashboardService;
