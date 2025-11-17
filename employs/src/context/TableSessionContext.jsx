'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';

const TableSessionContext = createContext();

export const TableSessionProvider = ({ children }) => {
    const [activeSessions, setActiveSessions] = useState([]); // Today's sessions (active + expired)
    const [sessionStats, setSessionStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const { api } = useAuth();

    const API_URL = process.env.NEXT_PUBLIC_API_URL 

    /* ---------------------------------------------------------------------- */
    /* 🧾 Generate QR for a table                                             */
    /* ---------------------------------------------------------------------- */
    const generateTableQR = async (tableNumber) => {
        try {
            setLoading(true);
            console.log('📝 Generating QR for table:', tableNumber);

            const { data } = await api.post('/table-session/generate', { tableNumber });

            console.log('✅ QR generated:', data);

            if (data.success) {
                // Add new session to the top of the list
                setActiveSessions((prev) => [data.session, ...prev]);
                return { success: true, session: data.session };
            }

            return { success: false, message: data.message };
        } catch (error) {
            console.error('❌ Generate QR error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to generate QR',
            };
        } finally {
            setLoading(false);
        }
    };

    /* ---------------------------------------------------------------------- */
    /* ✅ Validate session token (Public - for customers)                     */
    /* ---------------------------------------------------------------------- */
    const validateSession = async (token) => {
        try {
            console.log('🔍 Validating session:', token);
            const { data } = await axios.get(`${API_URL}/table-session/validate/${token}`);
            console.log('✅ Validation result:', data);
            return data;
        } catch (error) {
            console.error('❌ Validation error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Invalid session',
            };
        }
    };

    /* ---------------------------------------------------------------------- */
    /* 🔒 Get today's sessions (Active + Expired) - With Auto-Expiry         */
    /* ---------------------------------------------------------------------- */
    const getActiveSessions = useCallback(async () => {
        try {
            setLoading(true);
            console.log('📥 Fetching today\'s sessions...');

            const { data } = await api.get('/table-session/active');

            if (data.success) {
                setActiveSessions(data.sessions);
                console.log(`✅ Loaded ${data.sessions.length} sessions`);
                
                // Count active vs expired
                const activeCount = data.sessions.filter(s => s.isActive).length;
                const expiredCount = data.sessions.length - activeCount;
                console.log(`📊 Active: ${activeCount}, Expired: ${expiredCount}`);

                return { 
                    success: true, 
                    sessions: data.sessions, 
                    count: data.count 
                };
            }

            console.warn('⚠️ Failed to fetch sessions:', data.message);
            return { success: false, message: data.message };
        } catch (error) {
            console.error('❌ Error fetching sessions:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch sessions',
            };
        } finally {
            setLoading(false);
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Get session statistics (Waiter's own stats)                         */
    /* ---------------------------------------------------------------------- */
    const getSessionStats = useCallback(async () => {
        try {
            console.log('📊 Fetching session stats...');

            const { data } = await api.get('/table-session/stats');

            if (data.success) {
                setSessionStats(data.stats);
                console.log('✅ Stats loaded:', data.stats);
                return { 
                    success: true, 
                    stats: data.stats, 
                    date: data.date 
                };
            }

            console.warn('⚠️ Failed to fetch stats:', data.message);
            return { success: false, message: data.message };
        } catch (error) {
            console.error('❌ Error fetching statistics:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch statistics',
            };
        }
    }, [api]);

    /* ---------------------------------------------------------------------- */
    /* 🛒 Place order (Customer - Public)                                     */
    /* ---------------------------------------------------------------------- */
    const placeOrder = async (sessionToken, items) => {
        try {
            console.log('🛒 Placing order:', { sessionToken, itemCount: items.length });

            const { data } = await axios.post(`${API_URL}/order/place`, {
                sessionToken,
                items,
            });

            console.log('✅ Order placed:', data);
            return data;
        } catch (error) {
            console.error('❌ Error placing order:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to place order',
            };
        }
    };

    /* ---------------------------------------------------------------------- */
    /* 📋 Get orders by table (Waiter)                                        */
    /* ---------------------------------------------------------------------- */
    const getOrdersByTable = async (tableNumber) => {
        try {
            console.log('📋 Fetching orders for table:', tableNumber);

            const { data } = await api.get(`/order/table/${tableNumber}`);

            console.log('✅ Orders fetched:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch orders',
            };
        }
    };

    /* ---------------------------------------------------------------------- */
    /* 🔄 Helper: Separate active and expired sessions                        */
    /* ---------------------------------------------------------------------- */
    const getSeparatedSessions = useCallback(() => {
        const active = activeSessions.filter(s => s.isActive === true);
        const expired = activeSessions.filter(s => s.isActive === false);
        return { active, expired };
    }, [activeSessions]);

    /* ---------------------------------------------------------------------- */
    /* 📊 Helper: Get quick stats from current sessions                       */
    /* ---------------------------------------------------------------------- */
    const getQuickStats = useCallback(() => {
        const active = activeSessions.filter(s => s.isActive === true);
        const expired = activeSessions.filter(s => s.isActive === false);
        
        return {
            activeCount: active.length,
            expiredCount: expired.length,
            totalCount: activeSessions.length,
        };
    }, [activeSessions]);

    /* ---------------------------------------------------------------------- */
    /* 🔍 Helper: Find session by table number                                */
    /* ---------------------------------------------------------------------- */
    const findSessionByTable = useCallback((tableNumber) => {
        return activeSessions.find(s => s.tableNumber === tableNumber);
    }, [activeSessions]);

    /* ---------------------------------------------------------------------- */
    /* ✅ Helper: Check if table has active session                           */
    /* ---------------------------------------------------------------------- */
    const hasActiveSession = useCallback((tableNumber) => {
        return activeSessions.some(
            s => s.tableNumber === tableNumber && s.isActive === true
        );
    }, [activeSessions]);

    const value = {
        // State
        activeSessions, // All today's sessions (active + expired)
        sessionStats,
        loading,

        // Actions
        generateTableQR,
        validateSession,
        getActiveSessions,
        getSessionStats,
        placeOrder,
        getOrdersByTable,

        // Helpers
        getSeparatedSessions,
        getQuickStats,
        findSessionByTable,
        hasActiveSession,
    };

    return (
        <TableSessionContext.Provider value={value}>
            {children}
        </TableSessionContext.Provider>
    );
};

export const useTableSession = () => {
    const context = useContext(TableSessionContext);
    if (!context) {
        throw new Error('useTableSession must be used within TableSessionProvider');
    }
    return context;
};