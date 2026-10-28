import api from '@/lib/api';

export const authService = {
  // 1. Authenticate user credentials and retrieve JWT tokens
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    // Expected response format: { success: true, data: { user, token, accessToken, refreshToken } }
    return response.data;
  },

  // 2. Register a new user or administrator
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // 3. Refresh Access Token using stored Refresh Token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  // 4. Clear active session, revoke refresh token, and clear credentials from localStorage
  logout: async () => {
    if (typeof window !== 'undefined') {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch {
          // Ignore network errors during logout
        }
      }
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  // 5. Retrieve currently authenticated user profile from localStorage
  getCurrentUser: () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  },

  // 6. Update current user account profile and settings
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    // Expected response format: { success: true, data: { user, token } }
    return response.data;
  }
};

export default authService;
