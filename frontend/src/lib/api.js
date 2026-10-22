import axios from 'axios';

// 1. Initialize Axios instance with backend API base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 2. Request Interceptor: Automatically inject JWT Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Handle session expiry (401) and standardize error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Automatically terminate session and redirect if token is expired or invalid
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
    }

    const serverMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';

    error.message = serverMessage;
    return Promise.reject(error);
  }
);

export default api;
