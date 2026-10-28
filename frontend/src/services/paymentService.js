import api from '@/lib/api';

export const paymentService = {
  // 1. Record a new payment installment
  recordPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    // Expected response format: { success: true, data: Payment }
    return response.data;
  },

  // 2. Get payment records (filter by project_id or client_id)
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  // 3. Get single payment receipt
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // 4. Delete payment installment record (Admin only)
  deletePayment: async (id) => {
    const response = await api.delete(`/payments/${id}`);
    return response.data;
  },

  // 5. Get overall financial summary
  getFinancialSummary: async () => {
    const response = await api.get('/payments/summary');
    return response.data;
  }
};

export default paymentService;
