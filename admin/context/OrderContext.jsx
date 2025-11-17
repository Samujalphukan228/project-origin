'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import axios from 'axios';
import { useSocket } from './socketContext';

const OrderContext = createContext();

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within OrderProvider');
    }
    return context;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL 

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [dashboardStats, setDashboardStats] = useState(null);
    const [todaySales, setTodaySales] = useState(null);
    const [totalRevenue, setTotalRevenue] = useState(null);
    const [topSellingItems, setTopSellingItems] = useState([]);
    const [salesAnalytics, setSalesAnalytics] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const { socket } = useSocket();

    const getToken = useCallback(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('adminToken');
        }
        return null;
    }, []);

    const getConfig = useCallback(() => ({
        headers: {
            Authorization: `Bearer ${getToken()}`,
        },
    }), [getToken]);

    // ✅ Fetch all orders
    const getAllOrders = useCallback(async (params = {}) => {
        try {
            setIsLoading(true);
            setError(null);
            
            const queryParams = new URLSearchParams();
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.status) queryParams.append('status', params.status);
            if (params.tableNumber) queryParams.append('tableNumber', params.tableNumber);
            if (params.startDate) queryParams.append('startDate', params.startDate);
            if (params.endDate) queryParams.append('endDate', params.endDate);
            
            const url = `${API_URL}/api/admin/orders?${queryParams.toString()}`;
            console.log('📡 Fetching orders from:', url);
            
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Orders loaded:', response.data.orders.length);
                setOrders(response.data.orders || []);
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get all orders error:', err);
            const message = err.response?.data?.message || 'Failed to fetch orders';
            setError(message);
            return { success: false, message };
        } finally {
            setIsLoading(false);
        }
    }, [getConfig]);

    const getDashboardStats = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            const url = `${API_URL}/api/admin/orders/dashboard-stats`;
            console.log('📡 Fetching dashboard stats from:', url);
            
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Dashboard stats loaded');
                setDashboardStats(response.data.stats);
                
                // Store recent orders from dashboard stats
                if (response.data.stats.recentOrders) {
                    setOrders(prevOrders => {
                        const newOrders = response.data.stats.recentOrders;
                        const existingIds = new Set(prevOrders.map(o => o._id));
                        const merged = [...prevOrders];
                        
                        newOrders.forEach(order => {
                            if (!existingIds.has(order._id)) {
                                merged.push(order);
                            }
                        });
                        
                        return merged.sort((a, b) => 
                            new Date(b.createdAt) - new Date(a.createdAt)
                        );
                    });
                }
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get dashboard stats error:', err);
            const message = err.response?.data?.message || 'Failed to fetch dashboard stats';
            setError(message);
            return { success: false, message };
        } finally {
            setIsLoading(false);
        }
    }, [getConfig]);

    const getTodaySales = useCallback(async () => {
        try {
            setError(null);
            
            const url = `${API_URL}/api/admin/orders/today-sales`;
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Today sales loaded:', response.data.today);
                setTodaySales(response.data.today);
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get today sales error:', err);
            const message = err.response?.data?.message || 'Failed to fetch today sales';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    const getTotalRevenue = useCallback(async () => {
        try {
            setError(null);
            
            const url = `${API_URL}/api/admin/orders/total-revenue`;
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Total revenue loaded:', response.data.revenue);
                setTotalRevenue(response.data.revenue);
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get total revenue error:', err);
            const message = err.response?.data?.message || 'Failed to fetch total revenue';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    const getTopSellingItems = useCallback(async (limit = 10, sortBy = 'quantity') => {
        try {
            setError(null);
            
            const url = `${API_URL}/api/admin/orders/top-selling?limit=${limit}&sortBy=${sortBy}`;
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Top selling items loaded:', response.data.topItems.length);
                setTopSellingItems(response.data.topItems);
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get top selling error:', err);
            const message = err.response?.data?.message || 'Failed to fetch top selling items';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    const getSalesAnalytics = useCallback(async (startDate = null, endDate = null) => {
        try {
            setError(null);
            
            let url = `${API_URL}/api/admin/orders/sales-analytics`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }
            
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Sales analytics loaded');
                setSalesAnalytics(response.data.analytics);
            }
            return response.data;
        } catch (err) {
            console.error('❌ Get sales analytics error:', err);
            const message = err.response?.data?.message || 'Failed to fetch sales analytics';
            setError(message);
            return { success: false, message };
        }
    }, [getConfig]);

    // 🔥 NEW: Get stats by date range for growth calculations
    const getStatsByDateRange = useCallback(async (startDate, endDate) => {
        try {
            setError(null);
            
            const url = `${API_URL}/api/admin/orders/stats-by-range?startDate=${startDate}&endDate=${endDate}`;
            console.log('📡 Fetching stats by range:', url);
            
            const response = await axios.get(url, getConfig());

            if (response.data.success) {
                console.log('✅ Stats by range loaded');
                return response.data.stats;
            }
            return null;
        } catch (err) {
            console.error('❌ Get stats by range error:', err);
            return null;
        }
    }, [getConfig]);

    const refreshAllData = useCallback(async () => {
        console.log('🔄 Refreshing all order data...');
        try {
            setIsLoading(true);
            await Promise.all([
                getAllOrders(),
                getDashboardStats(),
                getTodaySales(),
                getTotalRevenue(),
                getTopSellingItems(),
                getSalesAnalytics(),
            ]);
            console.log('✅ All order data refreshed');
        } catch (err) {
            console.error('❌ Refresh all data error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [getAllOrders, getDashboardStats, getTodaySales, getTotalRevenue, getTopSellingItems, getSalesAnalytics]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const refreshAllDataRef = useRef(refreshAllData);

    useEffect(() => {
        refreshAllDataRef.current = refreshAllData;
    }, [refreshAllData]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = (data) => {
            console.log('📢 Socket event - order update:', data);
            
            setOrders(prevOrders => {
                const exists = prevOrders.some(o => o._id === data._id || o._id === data.orderId);
                
                if (exists) {
                    return prevOrders.map(o => 
                        (o._id === data._id || o._id === data.orderId) 
                            ? { ...o, ...data } 
                            : o
                    );
                } else {
                    return [data, ...prevOrders];
                }
            });
            
            getDashboardStats();
            getTodaySales();
        };

        const handleOrderDelete = (data) => {
            console.log('📢 Socket event - order deleted:', data);
            setOrders(prevOrders => 
                prevOrders.filter(o => o._id !== data._id && o._id !== data.orderId)
            );
            getDashboardStats();
            getTodaySales();
        };

        socket.on('newOrder', handleOrderUpdate);
        socket.on('orderStatusUpdated', handleOrderUpdate);
        socket.on('orderCancelled', handleOrderDelete);

        return () => {
            socket.off('newOrder', handleOrderUpdate);
            socket.off('orderStatusUpdated', handleOrderUpdate);
            socket.off('orderCancelled', handleOrderDelete);
        };
    }, [socket, getDashboardStats, getTodaySales]);

    const value = {
        orders,
        getAllOrders,
        dashboardStats,
        todaySales,
        totalRevenue,
        topSellingItems,
        salesAnalytics,
        isLoading,
        error,
        getDashboardStats,
        getTodaySales,
        getTotalRevenue,
        getTopSellingItems,
        getSalesAnalytics,
        getStatsByDateRange, // ✅ NEW
        refreshAllData,
        clearError,
    };

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};