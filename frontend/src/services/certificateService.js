import api from '@/lib/api';

export const certificateService = {
  // 1. Issue a new course/internship certificate or offer letter
  issueCertificate: async (certData) => {
    const response = await api.post('/certificates', certData);
    return response.data;
  },

  // 2. Fetch all issued documents with optional filters (document_type, search)
  getCertificates: async (params = {}) => {
    const response = await api.get('/certificates', { params });
    return response.data;
  },

  // 3. Fetch single certificate details by UUID
  getCertificateById: async (id) => {
    const response = await api.get(`/certificates/${id}`);
    return response.data;
  },

  // 4. Public verification via unique certificate serial number (No auth required)
  verifyCertificate: async (serialNo) => {
    const response = await api.get(`/certificates/verify/${serialNo}`);
    return response.data;
  },

  // 5. Helper to construct direct printable HTML preview URL for browser/iframe
  getPreviewUrl: (id) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    return `${baseUrl}/certificates/${id}/preview`;
  }
};

export default certificateService;
