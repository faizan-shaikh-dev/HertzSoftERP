import axios from 'axios';

// 1. Initialize Axios instance with backend API base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Variables to handle concurrent requests during token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 2. Request Interceptor: Automatically inject JWT Bearer token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor: Silent Auto-Refresh on 401 Unauthorized or Expired Token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Standardize error message
    const serverMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    error.message = serverMessage;

    // Check if error is authentication-related (401 or 403 INVALID_TOKEN/TOKEN_EXPIRED)
    const status = error.response?.status;
    const errorCode = error.response?.data?.error?.code;
    const isAuthExpired =
      status === 401 ||
      (status === 403 && (
        errorCode === 'INVALID_TOKEN' ||
        errorCode === 'TOKEN_EXPIRED' ||
        serverMessage.toLowerCase().includes('expired') ||
        serverMessage.toLowerCase().includes('invalid token')
      ));

    // If not an auth error, pass it through directly
    if (!error.response || !isAuthExpired) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest?.url || '';

    // Do NOT refresh on login, refresh, or logout endpoints
    if (
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout')
    ) {
      if (typeof window !== 'undefined' && requestUrl.includes('/auth/refresh')) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      return Promise.reject(error);
    }

    // Avoid infinite retry loops
    if (originalRequest?._retry) {
      return Promise.reject(error);
    }

    // If refresh is already underway, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

    if (!refreshToken) {
      isRefreshing = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      return Promise.reject(error);
    }

    try {
      // Use clean axios call directly to avoid recursion
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const refreshEndpoint = baseURL.endsWith('/') ? `${baseURL}auth/refresh` : `${baseURL}/auth/refresh`;

      const response = await axios.post(refreshEndpoint, {
        refreshToken
      });

      const { accessToken, token: jwtToken, refreshToken: newRefreshToken, user } = response.data.data;
      const finalAccessToken = accessToken || jwtToken;

      if (typeof window !== 'undefined') {
        localStorage.setItem('token', finalAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        document.cookie = `token=${finalAccessToken}; path=/; max-age=604800; SameSite=Lax`;
      }

      api.defaults.headers.common['Authorization'] = `Bearer ${finalAccessToken}`;
      originalRequest.headers['Authorization'] = `Bearer ${finalAccessToken}`;

      // Resolve all queued requests
      processQueue(null, finalAccessToken);

      // Retry original request
      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        if (!window.location.pathname.startsWith('/login')) {
          window.location.href = '/login?expired=true';
        }
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
