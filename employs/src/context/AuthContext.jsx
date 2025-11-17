'use client';

import { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

// ✅ Create API instance OUTSIDE component (only once ever)
const API_URL = process.env.NEXT_PUBLIC_API_URL 

const createApiInstance = () => {
  const instance = axios.create({ 
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' }
  });

  instance.interceptors.request.use(
    (config) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          const publicPages = ['/auth', '/pending-approval', '/table'];
          const currentPath = window.location.pathname;
          
          if (!publicPages.some(page => currentPath.startsWith(page))) {
            window.location.href = '/auth';
          }
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// ✅ Single shared instance
const api = createApiInstance();

export const AuthProvider = ({ children }) => {
  // ✅ Use single state object to reduce re-renders
  const [state, setState] = useState({
    user: null,
    loading: true,
    error: null,
    success: null,
  });

  const router = useRouter();
  const verificationAttempted = useRef(false);
  const mounted = useRef(false);

  // ✅ Mark as mounted
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // ✅ Clear error after 5s
  useEffect(() => {
    if (state.error) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.error]);

  // ✅ Clear success after 5s
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, success: null }));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success]);

  // ✅ Verify token ONLY ONCE on mount
  useEffect(() => {
    const verifyInitialToken = async () => {
      if (verificationAttempted.current) return;
      verificationAttempted.current = true;

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

      if (!token) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        const { data } = await api.get('/employ/me');
        if (data.success && mounted.current) {
          setState(prev => ({ ...prev, user: data.user, loading: false }));
        } else {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
          }
          if (mounted.current) {
            setState(prev => ({ ...prev, user: null, loading: false }));
          }
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
        }
        if (mounted.current) {
          setState(prev => ({ ...prev, user: null, loading: false }));
        }
      }
    };

    verifyInitialToken();
  }, []); // ✅ EMPTY DEPS - runs once

  // ========== AUTH METHODS (with useCallback) ==========
  const register = useCallback(async (name, email, password, role = 'waiter') => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));

      const { data } = await axios.post(`${API_URL}/employ/register`, {
        name, email, password, role,
      });

      if (data.success) {
        setState(prev => ({ ...prev, success: data.message }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      setState(prev => ({ ...prev, error: message }));
      return { success: false, message };
    }
  }, []);

  const verifyOTP = useCallback(async (email, otp) => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));

      const { data } = await axios.post(`${API_URL}/employ/verify-otp`, { email, otp });

      if (data.success) {
        setState(prev => ({ ...prev, success: data.message }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'OTP verification failed';
      setState(prev => ({ ...prev, error: message }));
      return { success: false, message };
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));

      const { data } = await axios.post(`${API_URL}/employ/login`, { email, password });

      if (data.success) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', data.token);
        }
        setState(prev => ({ ...prev, user: data.user, success: 'Login successful!' }));
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      setState(prev => ({ ...prev, error: message }));
      return { success: false, message };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));

      const { data } = await axios.post(`${API_URL}/employ/forgot-password`, { email });

      if (data.success) {
        setState(prev => ({ ...prev, success: data.message }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to send reset email';
      setState(prev => ({ ...prev, error: message }));
      return { success: false, message };
    }
  }, []);

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    try {
      setState(prev => ({ ...prev, error: null, success: null }));

      const { data } = await axios.post(`${API_URL}/employ/reset-password`, {
        email, otp, newPassword,
      });

      if (data.success) {
        setState(prev => ({ ...prev, success: data.message }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message };
    } catch (err) {
      const message = err.response?.data?.message || 'Password reset failed';
      setState(prev => ({ ...prev, error: message }));
      return { success: false, message };
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setState({ user: null, loading: false, error: null, success: null });
    router.push('/auth');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const { data } = await api.get('/employ/me');
      if (data.success) {
        setState(prev => ({ ...prev, user: data.user }));
        return { success: true, user: data.user };
      }
      return { success: false };
    } catch (err) {
      console.error('Failed to refresh user:', err);
      return { success: false };
    }
  }, []);

  const verifyToken = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setState(prev => ({ ...prev, loading: false }));
      return { success: false };
    }

    try {
      const { data } = await api.get('/employ/me');
      if (data.success) {
        setState(prev => ({ ...prev, user: data.user, loading: false }));
        return { success: true, user: data.user };
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setState(prev => ({ ...prev, user: null, loading: false }));
      return { success: false };
    } catch (error) {
      console.error('Token verification failed:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
      setState(prev => ({ ...prev, user: null, loading: false }));
      return { success: false };
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearSuccess = useCallback(() => {
    setState(prev => ({ ...prev, success: null }));
  }, []);

  const clearMessages = useCallback(() => {
    setState(prev => ({ ...prev, error: null, success: null }));
  }, []);

  // ✅ FIXED: Direct object - React will handle re-renders properly
  // Functions are stable (useCallback), api is stable (outside component)
  // Only state values change, which is expected
  const value = {
    // State (these SHOULD change and trigger re-renders)
    user: state.user,
    loading: state.loading,
    error: state.error,
    success: state.success,
    isAuthenticated: !!state.user,
    isApproved: state.user?.isAproved || false,
    isVerified: state.user?.isVerified || false,
    userRole: state.user?.role || null,

    // Methods (stable - useCallback)
    register,
    verifyOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
    refreshUser,
    verifyToken,
    clearError,
    clearSuccess,
    clearMessages,

    // API instance (stable - created once outside)
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};