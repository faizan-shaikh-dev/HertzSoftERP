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
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setToken(null);
        setUser(null);
      }
    } else {
      // If localStorage was wiped, immediately invalidate the server cookie as well
      document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  // 2. Authenticate user credentials and save active session
  const login = async (credentials) => {
    const res = await authService.login(credentials);
    // Backend returns: { success: true, data: { user, token, accessToken, refreshToken } }
    const { user: userData, token: jwtToken, accessToken, refreshToken } = res.data;
    const finalAccessToken = accessToken || jwtToken;

    localStorage.setItem('token', finalAccessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    localStorage.setItem('user', JSON.stringify(userData));

    // Synchronize token to cookie (7-day max-age aligned with refresh window)
    document.cookie = `token=${finalAccessToken}; path=/; max-age=604800; SameSite=Lax`;

    setUser(userData);
    setToken(finalAccessToken);

    // Redirect to home dashboard upon successful login
    router.push('/');
    return res;
  };

  // 3. Register a new user account
  const register = async (userData) => {
    const res = await authService.register(userData);
    return res;
  };

  // 4. Terminate active session, revoke refresh token, and redirect to login page
  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors on logout
    }
    document.cookie = 'token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    setUser(null);
    setToken(null);
    router.push('/login');
  };

  // 5. Update user profile and refresh active session state
  const updateProfile = async (profileData) => {
    const res = await authService.updateProfile(profileData);
    const { user: updatedUser, token: updatedToken, accessToken } = res.data;
    const finalToken = accessToken || updatedToken;

    if (finalToken) {
      localStorage.setItem('token', finalToken);
      document.cookie = `token=${finalToken}; path=/; max-age=604800; SameSite=Lax`;
      setToken(finalToken);
    }
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    }
    return res;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
