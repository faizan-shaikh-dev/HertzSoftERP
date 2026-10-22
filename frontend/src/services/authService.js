import api from '@/lib/api';

export const authService = {
  // 1. Authenticate user credentials and retrieve JWT token
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Expected response format: { success: true, data: { user, token } }
    return response.data;
  },

  // 2. Register a new user or administrator
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 3. Clear active session and stored credentials from localStorage
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // 4. Retrieve currently authenticated user profile from localStorage
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }
};

export default authService;
