'use client';

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useSocket, useSocketEvent } from './SocketContext';

const OrderContext = createContext();

export const useOrder = () => {
    const context = useContext(OrderContext);
    if (!context) {
        throw new Error('useOrder must be used within OrderProvider');
    }
    return context;
};

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [tableOrders, setTableOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { connected } = useSocket();

    const mountedRef = useRef(false);
    const API_URL = process.env.NEXT_PUBLIC_API_URL 

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const getToken = () => {
        return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    };

    const placeOrder = useCallback(async (sessionToken, items) => {
        try {
            setLoading(true);
            setError(null);

            if (!sessionToken || !items || items.length === 0) {
                throw new Error('Session token and items are required');
            }

            const response = await fetch(`${API_URL}/order/place`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionToken, items }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to place order');
            }

            return { success: true, order: data.order, message: data.message };
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
            }
            return { success: false, message: err.message };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [API_URL]);

    const getAllOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const response = await fetch(`${API_URL}/order/all`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }

            if (mountedRef.current) {
                setOrders(data.orders || []);
            }
            return { success: true, orders: data.orders || [] };
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
                setOrders([]);
            }
            return { success: false, message: err.message, orders: [] };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [API_URL]);

    const getOrdersByTable = useCallback(async (tableNumber) => {
        try {
            setLoading(true);
            setError(null);

            if (!tableNumber) {
                throw new Error('Table number is required');
            }

            const response = await fetch(`${API_URL}/order/table/${tableNumber}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch orders');
            }

            if (mountedRef.current) {
                setTableOrders(data.orders || []);
            }
            return { success: true, orders: data.orders || [] };
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
                setTableOrders([]);
            }
            return { success: false, message: err.message, orders: [] };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [API_URL]);

    const updateOrderStatus = useCallback(async (orderId, status) => {
        try {
            setLoading(true);
            setError(null);

            const token = getToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            if (!['preparing', 'served', 'pending'].includes(status)) {
                throw new Error('Invalid status');
            }

            const response = await fetch(`${API_URL}/order/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ status }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update order status');
            }

            if (mountedRef.current) {
                setOrders(prev => prev.map(order =>
                    order._id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
                ));

                setTableOrders(prev => prev.map(order =>
                    order._id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
                ));
            }

            return { success: true, order: data.order, message: data.message };
        } catch (err) {
            if (mountedRef.current) {
                setError(err.message);
            }
            return { success: false, message: err.message };
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [API_URL]);

    const refreshOrders = useCallback(async (tableNumber) => {
        if (tableNumber) {
            await getOrdersByTable(tableNumber);
        } else {
            await getAllOrders();
        }
    }, [getAllOrders, getOrdersByTable]);

    const clearOrders = useCallback(() => {
        setOrders([]);
        setTableOrders([]);
        setError(null);
    }, []);

    const getOrderStats = useCallback(() => {
        const pendingCount = orders.filter(o => o.status === 'pending').length;
        const preparingCount = orders.filter(o => o.status === 'preparing').length;
        const servedCount = orders.filter(o => o.status === 'served').length;
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

        return {
            pendingCount,
            preparingCount,
            servedCount,
            totalOrders,
            totalRevenue,
        };
    }, [orders]);

    // ✅ Socket listeners
    useSocketEvent('newOrder', useCallback((newOrder) => {
        if (newOrder?._id && mountedRef.current) {
            setOrders(prev => {
                const exists = prev.some(order => order._id === newOrder._id);
                return exists ? prev : [newOrder, ...prev];
            });

            setTableOrders(prev => {
                const exists = prev.some(order => order._id === newOrder._id);
                if (exists) return prev;
                if (prev.length > 0 && prev[0].tableNumber === newOrder.tableNumber) {
                    return [newOrder, ...prev];
                }
                return prev;
            });
        }
    }, []));

    useSocketEvent('orderStatusUpdated', useCallback((updatedOrder) => {
        if (updatedOrder?._id && mountedRef.current) {
            setOrders(prev => prev.map(order =>
                order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
            ));

            setTableOrders(prev => prev.map(order =>
                order._id === updatedOrder._id ? { ...order, ...updatedOrder } : order
            ));
        }
    }, []));

    useSocketEvent('orderDeleted', useCallback((deletedOrderId) => {
        if (deletedOrderId && mountedRef.current) {
            setOrders(prev => prev.filter(order => order._id !== deletedOrderId));
            setTableOrders(prev => prev.filter(order => order._id !== deletedOrderId));
        }
    }, []));

    // ✅ Memoized value object
    const value = useMemo(() => ({
        orders,
        tableOrders,
        loading,
        error,
        connected,
        placeOrder,
        getAllOrders,
        getOrdersByTable,
        updateOrderStatus,
        refreshOrders,
        clearOrders,
        getOrderStats,
        setOrders,
        setTableOrders,
    }), [
        orders,
        tableOrders,
        loading,
        error,
        connected,
        placeOrder,
        getAllOrders,
        getOrdersByTable,
        updateOrderStatus,
        refreshOrders,
        clearOrders,
        getOrderStats,
    ]);

    return (
        <OrderContext.Provider value={value}>
            {children}
        </OrderContext.Provider>
    );
};