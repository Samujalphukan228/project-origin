'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

// Create Context
const AuthContext = createContext(undefined);

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  // ✅ Check if window exists (SSR safe)
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ✅ Handle unauthorized responses - FIXED TO PREVENT INFINITE LOOP
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data on unauthorized
      if (typeof window !== 'undefined') {
        const wasAuthenticated = localStorage.getItem('adminToken');
        
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        
        // ✅ Only redirect if NOT already on auth page AND was previously authenticated
        if (wasAuthenticated && !window.location.pathname.startsWith('/auth')) {
          console.log('❌ 401 Unauthorized - Redirecting to /auth');
          window.location.href = '/auth';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Handle API errors
const handleApiError = (error) => {
  if (axios.isAxiosError(error)) {
    return {
      success: false,
      message: error.response?.data?.message || 'An error occurred',
    };
  }
  return {
    success: false,
    message: 'An unexpected error occurred',
  };
};

// Auth Provider Component
export function AuthProvider({ children }) {
  const router = useRouter();
  const [state, setState] = useState({
    admin: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ✅ Load auth state from localStorage on mount
  useEffect(() => {
    // Check if running in browser
    if (typeof window === 'undefined') {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    const validateAuth = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const adminData = localStorage.getItem('adminData');

        if (token && adminData) {
          try {
            const admin = JSON.parse(adminData);
            
            setState({
              admin,
              token,
              isLoading: false,
              isAuthenticated: true,
            });
            console.log('✅ Auth state loaded from localStorage');
          } catch (parseError) {
            // Invalid JSON, clear everything
            console.error('❌ Invalid admin data in localStorage');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminData');
            setState((prev) => ({ ...prev, isLoading: false }));
          }
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('❌ Failed to load auth state:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    validateAuth();
  }, []);

  // Register
  const register = useCallback(async (data) => {
    try {
      const response = await api.post('/api/admin/register', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }, []);

  // Verify OTP
  const verifyOTP = useCallback(async (data) => {
    try {
      const response = await api.post('/api/admin/verify-otp', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }, []);

  // Login
  const login = useCallback(
    async (data) => {
      try {
        const response = await api.post('/api/admin/login', data);
        const result = response.data;

        if (result.success && result.token && result.admin) {
          // ✅ Save to localStorage (browser only)
          if (typeof window !== 'undefined') {
            localStorage.setItem('adminToken', result.token);
            localStorage.setItem('adminData', JSON.stringify(result.admin));
          }

          // Update state
          setState({
            admin: result.admin,
            token: result.token,
            isLoading: false,
            isAuthenticated: true,
          });

          console.log('✅ Login successful');

          // Redirect to dashboard
          router.push('/dashboard');
        }

        return result;
      } catch (error) {
        return handleApiError(error);
      }
    },
    [router]
  );

  // Logout
  const logout = useCallback(() => {
    // ✅ Clear localStorage (browser only)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
    }

    // Reset state
    setState({
      admin: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });

    console.log('✅ Logout successful');

    // Redirect to login
    router.push('/auth');
  }, [router]);

  // Forgot Password
  const forgotPassword = useCallback(async (data) => {
    try {
      const response = await api.post('/api/admin/forgot-password', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }, []);

  // Reset Password
  const resetPassword = useCallback(async (data) => {
    try {
      const response = await api.post('/api/admin/reset-password', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  }, []);

  // ✅ Context value with API included
  const value = {
    // State
    admin: state.admin,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    
    // ✅ API Instance
    api,
    
    // Actions
    register,
    verifyOTP,
    login,
    logout,
    forgotPassword,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom Hook to use Auth Context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ✅ Export api instance for direct imports (optional)
export { api };