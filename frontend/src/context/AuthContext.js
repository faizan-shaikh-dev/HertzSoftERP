'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 1. Check and restore authenticated session on initial client mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse cached user profile:', error);
        authService.logout();
      }
    }
    setLoading(false);
  }, []);

  // 2. Authenticate user credentials and save active session
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    // Backend returns: { success: true, data: { user, token } }
    const { user: userData, token: jwtToken } = res.data;

    localStorage.setItem('token', jwtToken);
    localStorage.setItem('user', JSON.stringify(userData));
    // Synchronize token to cookie so Next.js Edge Middleware can verify server-side
    document.cookie = `token=${jwtToken}; path=/; max-age=86400; SameSite=Lax`;

    setUser(userData);
    setToken(jwtToken);

    // Redirect to home dashboard upon successful login
    router.push('/');
    return res;
  };

  // 3. Register a new user account
  const register = async (userData) => {
    const res = await authService.register(userData);
    return res;
  };

  // 4. Terminate active session and redirect to login page
  const logout = () => {
    authService.logout();
    document.cookie = 'token=; path=/; max-age=0';
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to consume authentication context in any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
