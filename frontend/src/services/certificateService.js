import api from '@/lib/api';

export const certificateService = {
  // 1. Get all issued certificates & offer letters
  getCertificates: async (params = {}) => {
    const response = await api.get('/certificates', { params });
    // Expected response format: { success: true, count: number, data: Certificate[] }
    return response.data;
  },

  // 2. Get single certificate details by ID
  getCertificateById: async (id) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  // 3. Issue a new Certificate or Offer Letter
  issueCertificate: async (data) => {
    const response = await api.post('/certificates', data);
    return response.data;
  },

  // 4. Public certificate verification by certificate number
  verifyCertificate: async (serialNo) => {
    const response = await api.get(`/certificates/verify/${serialNo}`);
    return response.data;
  },

  // 5. Direct Preview / Print URL
  getPreviewUrl: (id) => {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const cleanBase = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    return `${cleanBase}/certificates/${id}/preview`;
  }
};

export default certificateService;
