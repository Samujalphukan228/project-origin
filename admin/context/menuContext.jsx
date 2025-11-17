'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from './AuthContext';
import { useSocket } from './socketContext';
import axios from 'axios';

const MenuContext = createContext(undefined);

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

export function MenuProvider({ children }) {
  const { socket } = useSocket();
  const [state, setState] = useState({
    menus: [],
    currentMenu: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!socket) return;

    const handleNewMenu = (newMenu) => {
      setState((prev) => ({
        ...prev,
        menus: [newMenu, ...prev.menus],
      }));
    };

    const handleUpdateMenu = (updatedMenu) => {
      setState((prev) => ({
        ...prev,
        menus: prev.menus.map((menu) =>
          menu._id === updatedMenu._id ? updatedMenu : menu
        ),
        currentMenu:
          prev.currentMenu?._id === updatedMenu._id
            ? updatedMenu
            : prev.currentMenu,
      }));
    };

    const handleDeleteMenu = ({ id }) => {
      setState((prev) => ({
        ...prev,
        menus: prev.menus.filter((menu) => menu._id !== id),
        currentMenu: prev.currentMenu?._id === id ? null : prev.currentMenu,
      }));
    };

    const handleApprovedMenu = (approvedMenu) => {
      setState((prev) => ({
        ...prev,
        menus: prev.menus.map((menu) =>
          menu._id === approvedMenu._id ? approvedMenu : menu
        ),
      }));
    };

    const handleRejectedMenu = (rejectedMenu) => {
      setState((prev) => ({
        ...prev,
        menus: prev.menus.map((menu) =>
          menu._id === rejectedMenu._id ? rejectedMenu : menu
        ),
      }));
    };

    const handleRefresh = () => {
      // Optional: auto-refetch
      // getAllMenus();
    };

    socket.on('menu:new', handleNewMenu);
    socket.on('menu:update', handleUpdateMenu);
    socket.on('menu:delete', handleDeleteMenu);
    socket.on('menu:approved', handleApprovedMenu);
    socket.on('menu:rejected', handleRejectedMenu);
    socket.on('menu:refresh', handleRefresh);

    return () => {
      socket.off('menu:new', handleNewMenu);
      socket.off('menu:update', handleUpdateMenu);
      socket.off('menu:delete', handleDeleteMenu);
      socket.off('menu:approved', handleApprovedMenu);
      socket.off('menu:rejected', handleRejectedMenu);
      socket.off('menu:refresh', handleRefresh);
    };
  }, [socket]);

  const getAllMenus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get('/api/menu/all');
      setState((prev) => ({
        ...prev,
        menus: response.data.menus || [],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const getPublicMenus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get('/api/menu/public');
      setState((prev) => ({
        ...prev,
        menus: response.data.menus || [],
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const getMenuById = useCallback(async (id) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.get(`/api/menu/${id}`);
      setState((prev) => ({
        ...prev,
        currentMenu: response.data.menu,
        isLoading: false,
      }));
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const addMenu = useCallback(async (formData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.post('/api/menu/add', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setState((prev) => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const updateMenu = useCallback(async (id, formData) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.put(`/api/menu/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setState((prev) => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const deleteMenu = useCallback(async (id) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.delete(`/api/menu/${id}`);
      
      setState((prev) => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const approveMenu = useCallback(async (id) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.put(`/api/menu/${id}/approve`);
      
      setState((prev) => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const rejectMenu = useCallback(async (id, reason) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await api.put(`/api/menu/${id}/reject`, { reason });
      
      setState((prev) => ({ ...prev, isLoading: false }));
      
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      setState((prev) => ({
        ...prev,
        error: errorResult.message,
        isLoading: false,
      }));
      return errorResult;
    }
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const clearCurrentMenu = useCallback(() => {
    setState((prev) => ({ ...prev, currentMenu: null }));
  }, []);

  const refreshMenus = useCallback(() => {
    getAllMenus();
  }, [getAllMenus]);

  const value = {
    menus: state.menus,
    currentMenu: state.currentMenu,
    isLoading: state.isLoading,
    error: state.error,
    getAllMenus,
    getPublicMenus,
    getMenuById,
    addMenu,
    updateMenu,
    deleteMenu,
    approveMenu,
    rejectMenu,
    clearError,
    clearCurrentMenu,
    refreshMenus,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}