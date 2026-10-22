import api from '@/lib/api';

export const paymentService = {
  // 1. Record a new payment installment for a project
  recordPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  // 2. Fetch payment transactions (with optional project_id / client_id filters)
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  // 3. Fetch overall financial summary (Total Deals, Total Collected, Pending Due)
  getFinancialSummary: async () => {
    const response = await api.get('/payments/summary');
    return response.data;
  },

  // 4. Fetch single payment receipt details by UUID
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // 5. Delete or void a payment transaction record
  deletePayment: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  }
};

export default paymentService;
