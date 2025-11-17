'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSocket } from './socketContext';

const AdminTableSessionContext = createContext();

export const AdminTableSessionProvider = ({ children }) => {
    const [allSessions, setAllSessions] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);
    const { api } = useAuth();
    const { socket, isConnected } = useSocket();

    const isApiReady = !!api;
    const isReady = isApiReady && isConnected;

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    /* ---------------------------------------------------------------------- */
    /* 🔄 Real-time Socket Event Listeners                                   */
    /* ---------------------------------------------------------------------- */
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleSessionCreated = (data) => {
            if (data?.session) {
                setAllSessions((prev) => {
                    const exists = prev.some(s => s._id === data.session._id);
                    if (exists) {
                        return prev.map(s => s._id === data.session._id ? data.session : s);
                    }
                    return [data.session, ...prev];
                });
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleSessionUpdated = (data) => {
            if (data?.session) {
                setAllSessions((prev) =>
                    prev.map((session) =>
                        session._id === data.session._id ? data.session : session
                    )
                );
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleSessionExpired = (data) => {
            if (data?.sessionId) {
                setAllSessions((prev) =>
                    prev.map((session) =>
                        session._id === data.sessionId
                            ? { 
                                ...session, 
                                isActive: false, 
                                expiredAt: data.expiredAt || new Date().toISOString() 
                            }
                            : session
                    )
                );
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleSessionDeleted = (data) => {
            if (data?.sessionId) {
                setAllSessions((prev) =>
                    prev.filter((session) => session._id !== data.sessionId)
                );
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleAnalyticsUpdated = (data) => {
            if (data?.analytics) {
                setAnalytics(data.analytics);
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleQrScanned = (data) => {
            if (data?.session) {
                setAllSessions((prev) => {
                    const exists = prev.some(s => s._id === data.session._id);
                    if (exists) {
                        return prev.map(s => s._id === data.session._id ? data.session : s);
                    }
                    return [data.session, ...prev];
                });
                setLastUpdate(new Date().toISOString());
            }
        };

        const handleTableStatusChanged = (data) => {
            if (data?.tableNumber) {
                setAllSessions((prev) =>
                    prev.map((session) =>
                        session.tableNumber === data.tableNumber
                            ? { ...session, status: data.status }
                            : session
                    )
                );
                setLastUpdate(new Date().toISOString());
            }
        };

        socket.on('session:created', handleSessionCreated);
        socket.on('session:updated', handleSessionUpdated);
        socket.on('session:expired', handleSessionExpired);
        socket.on('session:ended', handleSessionExpired);
        socket.on('session:deleted', handleSessionDeleted);
        socket.on('analytics:updated', handleAnalyticsUpdated);
        socket.on('qr:scanned', handleQrScanned);
        socket.on('table:statusChanged', handleTableStatusChanged);

        return () => {
            socket.off('session:created', handleSessionCreated);
            socket.off('session:updated', handleSessionUpdated);
            socket.off('session:expired', handleSessionExpired);
            socket.off('session:ended', handleSessionExpired);
            socket.off('session:deleted', handleSessionDeleted);
            socket.off('analytics:updated', handleAnalyticsUpdated);
            socket.off('qr:scanned', handleQrScanned);
            socket.off('table:statusChanged', handleTableStatusChanged);
        };
    }, [socket, isConnected]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Get All Sessions (All Waiters) with Filters                        */
    /* ---------------------------------------------------------------------- */
    const getAllSessions = useCallback(async (filters = {}) => {
        if (!api) {
            const errorMsg = 'API not initialized';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }

        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams();
            if (filters.date) params.append('date', filters.date);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.waiterId) params.append('waiterId', filters.waiterId);
            if (filters.tableNumber) params.append('tableNumber', filters.tableNumber);
            if (filters.status) params.append('status', filters.status);
            if (filters.range) params.append('range', filters.range);

            const queryString = params.toString();
            const url = queryString
                ? `/api/table-session/all?${queryString}`
                : '/api/table-session/all';

            const { data } = await api.get(url);

            if (data.success) {
                setAllSessions(data.sessions || []);
                setLastUpdate(new Date().toISOString());
                setError(null);
                return { success: true, sessions: data.sessions, count: data.count };
            }

            const errorMsg = data.message || 'Failed to fetch sessions';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch sessions';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📈 Get Analytics Dashboard Data                                       */
    /* ---------------------------------------------------------------------- */
    const getAnalytics = useCallback(async (timeRange = 'today') => {
        if (!api) {
            const errorMsg = 'API not initialized';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }

        try {
            setLoading(true);
            setError(null);

            const { data } = await api.get(`/api/table-session/admin/analytics?range=${timeRange}`);

            if (data.success) {
                setAnalytics(data.analytics);
                setLastUpdate(new Date().toISOString());
                setError(null);
                return { success: true, analytics: data.analytics };
            }

            const errorMsg = data.message || 'Failed to fetch analytics';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to fetch analytics';
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 👥 Get All Waiters Performance                                        */
    /* ---------------------------------------------------------------------- */
    const getWaitersPerformance = useCallback(async (timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.get(`/api/table-session/admin/waiters-performance?range=${timeRange}`);

            if (data.success) {
                return { success: true, waiters: data.waiters };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch waiters data',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📅 Get Sessions by Date Range                                         */
    /* ---------------------------------------------------------------------- */
    const getSessionsByDateRange = useCallback(async (startDate, endDate) => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            setLoading(true);

            const { data } = await api.get(`/api/table-session/all?startDate=${startDate}&endDate=${endDate}`);

            if (data.success) {
                setAllSessions(data.sessions);
                setLastUpdate(new Date().toISOString());
                return { success: true, sessions: data.sessions, count: data.count };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch sessions',
            };
        } finally {
            setLoading(false);
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 🏆 Get Top Tables                                                     */
    /* ---------------------------------------------------------------------- */
    const getTopTables = useCallback(async (limit = 10, timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.get(`/api/table-session/admin/top-tables?limit=${limit}&range=${timeRange}`);

            if (data.success) {
                return { success: true, tables: data.tables };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch top tables',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Get Sessions Statistics                                            */
    /* ---------------------------------------------------------------------- */
    const getSessionsStats = useCallback(async (timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.get(`/api/table-session/admin/stats?range=${timeRange}`);

            if (data.success) {
                return { success: true, stats: data.stats };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch stats',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* ✅ Memoized Table Session Analytics Loader                            */
    /* ---------------------------------------------------------------------- */
    const loadTableSessionAnalytics = useCallback(async (range) => {
        if (!api || !isReady) return;

        try {
            const [waitersRes, tablesRes, statsRes] = await Promise.allSettled([
                getWaitersPerformance(range),
                getTopTables(5, range),
                getSessionsStats(range),
            ]);

            if (waitersRes.status === 'fulfilled' && waitersRes.value?.success) {
                // Handle waiters performance
            }
            if (tablesRes.status === 'fulfilled' && tablesRes.value?.success) {
                // Handle top tables
            }
            if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
                // Handle session stats
            }
        } catch (error) {
            console.error('Error loading table analytics:', error);
        }
    }, [api, isReady, getWaitersPerformance, getTopTables, getSessionsStats]);

    /* ---------------------------------------------------------------------- */
    /* 🗑️ Cleanup Old Sessions                                               */
    /* ---------------------------------------------------------------------- */
    const cleanupOldSessions = useCallback(async (days = 30) => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            setLoading(true);

            const { data } = await api.delete(`/api/table-session/cleanup?days=${days}`);

            if (data.success) {
                await getAllSessions();
                return {
                    success: true,
                    deletedCount: data.deletedCount,
                    message: data.message
                };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to cleanup sessions',
            };
        } finally {
            setLoading(false);
        }
    }, [api, getAllSessions]);

    /* ---------------------------------------------------------------------- */
    /* 🕒 Expire Session (Admin can expire any session)                      */
    /* ---------------------------------------------------------------------- */
    const expireSession = useCallback(async (sessionId) => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.put(`/api/table-session/${sessionId}/expire`);

            if (data.success) {
                setAllSessions((prev) =>
                    prev.map((session) =>
                        session._id === sessionId
                            ? { ...session, isActive: false }
                            : session
                    )
                );
                setLastUpdate(new Date().toISOString());

                return { success: true, message: data.message };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to expire session',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Get Revenue Analytics                                              */
    /* ---------------------------------------------------------------------- */
    const getRevenueAnalytics = useCallback(async (timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.get(`/api/admin/revenue?range=${timeRange}`);

            if (data.success) {
                return { success: true, revenue: data.revenue };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch revenue data',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📈 Get Peak Hours Analytics                                           */
    /* ---------------------------------------------------------------------- */
    const getPeakHours = useCallback(async (timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const { data } = await api.get(`/api/admin/peak-hours?range=${timeRange}`);

            if (data.success) {
                return { success: true, peakHours: data.peakHours };
            }

            return { success: false, message: data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch peak hours',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Export Data to CSV                                                 */
    /* ---------------------------------------------------------------------- */
    const exportSessionsCSV = useCallback(async (filters = {}) => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            const params = new URLSearchParams(filters);
            const url = `/api/admin/export/sessions?${params.toString()}`;

            const { data } = await api.get(url, { responseType: 'blob' });

            const blob = new Blob([data], { type: 'text/csv' });
            const urlObj = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = urlObj;
            link.download = `sessions-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();

            setTimeout(() => window.URL.revokeObjectURL(urlObj), 100);

            return { success: true, message: 'CSV downloaded successfully' };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to export data',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 🔄 Refresh All Data (useful for manual refresh)                       */
    /* ---------------------------------------------------------------------- */
    const refreshAllData = useCallback(async (timeRange = 'today') => {
        if (!api) {
            return { success: false, message: 'API not initialized' };
        }

        try {
            setLoading(true);

            const [sessionsResult, analyticsResult] = await Promise.all([
                getAllSessions({ range: timeRange }),
                getAnalytics(timeRange),
            ]);

            setLastUpdate(new Date().toISOString());
            
            return { 
                success: sessionsResult.success && analyticsResult.success, 
                message: 'Data refreshed successfully' 
            };
        } catch (error) {
            return {
                success: false,
                message: 'Failed to refresh data',
            };
        } finally {
            setLoading(false);
        }
    }, [api, getAllSessions, getAnalytics]);

    /* ---------------------------------------------------------------------- */
    /* 🚀 INITIAL DATA LOAD - Auto-fetch on mount                           */
    /* ---------------------------------------------------------------------- */
    useEffect(() => {
        if (!isReady) return;

        let isMounted = true;
        
        const loadInitialData = async () => {
            try {
                await Promise.all([
                    getAllSessions({ range: 'today' }),
                    getAnalytics('today'),
                ]);
            } catch (error) {
                // Silent error handling
            }
        };

        if (isMounted) {
            loadInitialData();
        }

        return () => {
            isMounted = false;
        };
    }, [isReady, getAllSessions, getAnalytics]); // ✅ Fixed: Now has all dependencies

    const value = {
        // State
        allSessions,
        analytics,
        loading,
        error,
        isApiReady,
        isConnected,
        isReady,
        lastUpdate,

        // Session Management
        getAllSessions,
        getSessionsByDateRange,
        expireSession,
        cleanupOldSessions,

        // Analytics
        getAnalytics,
        getSessionsStats,
        getWaitersPerformance,
        getTopTables,
        getPeakHours,
        getRevenueAnalytics,
        loadTableSessionAnalytics,

        // Export
        exportSessionsCSV,

        // Utility
        refreshAllData,
        clearError,
    };

    return (
        <AdminTableSessionContext.Provider value={value}>
            {children}
        </AdminTableSessionContext.Provider>
    );
};

export const useAdminTableSession = () => {
    const context = useContext(AdminTableSessionContext);
    if (!context) {
        throw new Error('useAdminTableSession must be used within AdminTableSessionProvider');
    }
    return context;
};