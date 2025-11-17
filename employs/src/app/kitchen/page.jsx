'use client';

import { useEffect, useState, useRef } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useOrder } from '@/context/OrderContext';
import { useSocketEvent } from '@/context/SocketContext';
import toast from 'react-hot-toast';

export default function KitchenDashboardPage() {
    const { user, logout } = useAuth();
    const {
        orders,
        setOrders,
        updateOrderStatus,
        loading,
    } = useOrder();

    const [filter, setFilter] = useState('pending');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    const menuRef = useRef(null);
    const audioRef = useRef(null);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            audioRef.current = new Audio('/notification.mp3');
            audioRef.current.volume = 0.5;
        }
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_URL}/order/all`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();

            if (response.ok && data.orders) {
                const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const recentOrders = data.orders.filter(order => {
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= twentyFourHoursAgo;
                });
                setOrders(recentOrders);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        } finally {
            setInitialLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    useSocketEvent('newOrder', (newOrder) => {
        if (newOrder && newOrder._id) {
            const orderDate = new Date(newOrder.createdAt);
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

            if (orderDate >= twentyFourHoursAgo) {
                setOrders(prev => [newOrder, ...prev]);
                toast.success(`New Order - Table ${newOrder.tableNumber}`);
                if (audioRef.current) {
                    audioRef.current.play().catch(() => { });
                }
            }
        }
    });

    useSocketEvent('orderStatusUpdated', (updatedOrder) => {
        if (updatedOrder && updatedOrder._id) {
            setOrders(prev => prev.map(order =>
                order._id === updatedOrder._id ? updatedOrder : order
            ));
        }
    });

    const handleStatusChange = async (orderId, newStatus) => {
        const result = await updateOrderStatus(orderId, newStatus);

        if (result.success) {
            toast.success(`Order ${newStatus}`);
            setSelectedOrder(null);
        } else {
            toast.error(result.error || 'Update failed');
        }
    };

    const getFilteredOrders = () => {
        if (!Array.isArray(orders)) return [];
        let filtered = [...orders];
        if (filter !== 'all') {
            filtered = filtered.filter(order => order.status === filter);
        }
        return filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    };

    const getElapsedMinutes = (date) => {
        if (!date) return 0;
        return Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    };

    const formatElapsedTime = (minutes) => {
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: { label: 'Pending', class: 'bg-amber-50 text-amber-700 border-amber-200' },
            preparing: { label: 'Preparing', class: 'bg-blue-50 text-blue-700 border-blue-200' },
            served: { label: 'Served', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        };
        return badges[status] || badges.pending;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                setShowUserMenu(false);
                setSelectedOrder(null);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const filteredOrders = getFilteredOrders();

    const stats = {
        pending: orders.filter(o => o.status === 'pending').length,
        preparing: orders.filter(o => o.status === 'preparing').length,
        served: orders.filter(o => o.status === 'served').length,
    };

    if (initialLoading) {
        return (
            <ProtectedRoute allowedRoles={['kitchen']}>
                <div className="min-h-screen bg-white flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                        <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['kitchen']}>
            <div className="min-h-screen bg-white pb-safe">
                {/* HEADER */}
                <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
                        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
                            {/* Left */}
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-md bg-black">
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-xs sm:text-sm font-semibold leading-none truncate">Kitchen Display</h1>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 hidden xs:block">Order Management</p>
                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* Time - hidden on mobile */}
                                <div className="hidden md:flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5">
                                    <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-xs font-mono text-gray-600 tabular-nums">
                                        {currentTime.toLocaleTimeString('en-US', { hour12: false })}
                                    </span>
                                </div>

                                {/* Refresh - icon only on mobile */}
                                <button
                                    onClick={fetchOrders}
                                    className="flex h-8 sm:h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-2 sm:px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                                >
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>

                                {/* Profile */}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700 hover:border-gray-300 transition-all active:scale-95"
                                    >
                                        {user?.name?.[0]?.toUpperCase() || 'K'}
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 sm:w-64 origin-top-right rounded-lg border border-gray-200 bg-white shadow-xl">
                                            <div className="p-3 sm:p-4 border-b border-gray-100">
                                                <p className="text-sm font-medium text-black truncate">{user?.name || 'Kitchen Staff'}</p>
                                                <p className="text-xs text-gray-500 mt-1 truncate">{user?.email || 'No email'}</p>
                                                <div className="mt-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                    Kitchen Staff
                                                </div>
                                            </div>
                                            <div className="p-2">
                                                <button
                                                    onClick={logout}
                                                    className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors active:bg-gray-200"
                                                >
                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs - Scrollable on mobile */}
                        <div className="flex items-center gap-0.5 sm:gap-1 -mb-px overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'pending', label: 'Pending' },
                                { id: 'preparing', label: 'Preparing' },
                                { id: 'served', label: 'Served' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${filter === tab.id
                                            ? 'text-black'
                                            : 'text-gray-500 hover:text-gray-700 active:text-black'
                                        }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`inline-flex h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] items-center justify-center rounded-full px-1 sm:px-1.5 text-[10px] sm:text-xs font-semibold tabular-nums transition-colors ${filter === tab.id
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {stats[tab.id]}
                                    </span>
                                    {filter === tab.id && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                {/* MAIN */}
                <main className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-4 sm:py-6 lg:py-8">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-lg border border-gray-200 bg-white">
                            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="text-sm sm:text-base font-medium text-black">No {filter} orders</h3>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 text-center px-4">New orders will appear here</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {filteredOrders.map(order => {
                                const elapsed = getElapsedMinutes(order.createdAt);
                                const badge = getStatusBadge(order.status);

                                return (
                                    <button
                                        key={order._id}
                                        onClick={() => setSelectedOrder(order)}
                                        className="group relative overflow-hidden rounded-lg border border-gray-200 bg-white p-4 sm:p-5 text-left transition-all hover:border-gray-300 hover:shadow-lg active:scale-[0.98]"
                                    >
                                        {/* Header */}
                                        <div className="mb-3 sm:mb-4 flex items-start justify-between gap-3">
                                            <div>
                                                <div className="mb-1 text-xl sm:text-2xl font-bold tabular-nums text-black">
                                                    {order.tableNumber}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-gray-500">
                                                    Table Number
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="mb-1 font-mono text-sm font-semibold tabular-nums text-black">
                                                    {formatElapsedTime(elapsed)}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-gray-500">
                                                    Elapsed
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="mb-3 sm:mb-4">
                                            <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] sm:text-xs font-medium ${badge.class}`}>
                                                {badge.label}
                                            </span>
                                        </div>

                                        {/* Items */}
                                        <div className="mb-3 sm:mb-4 space-y-1.5 sm:space-y-2 border-t border-gray-100 pt-3 sm:pt-4">
                                            {order.items?.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                                                    <span className="font-mono font-semibold tabular-nums text-black flex-shrink-0">
                                                        {item.quantity}×
                                                    </span>
                                                    <span className="flex-1 truncate text-gray-700">
                                                        {item.name}
                                                    </span>
                                                </div>
                                            ))}
                                            {order.items?.length > 3 && (
                                                <p className="text-[10px] sm:text-xs text-gray-400">
                                                    +{order.items.length - 3} more items
                                                </p>
                                            )}
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:pt-4">
                                            <span className="text-[10px] sm:text-xs text-gray-500">
                                                {order.items?.length} {order.items?.length === 1 ? 'item' : 'items'}
                                            </span>
                                            <span className="font-mono text-sm sm:text-base font-bold tabular-nums text-black">
                                                ₹{order.totalAmount?.toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Hover Indicator */}
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black scale-x-0 transition-transform group-hover:scale-x-100" />
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </main>

                {/* MODAL */}
                {selectedOrder && (
                    <div
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
                        onClick={() => setSelectedOrder(null)}
                    >
                        <div
                            className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-xl border-t sm:border border-gray-200 bg-white shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="sticky top-0 border-b border-gray-200 bg-white px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
                                            <h2 className="text-xl sm:text-2xl font-bold tabular-nums text-black">
                                                Table {selectedOrder.tableNumber}
                                            </h2>
                                            <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium ${getStatusBadge(selectedOrder.status).class}`}>
                                                {getStatusBadge(selectedOrder.status).label}
                                            </span>
                                        </div>
                                        <p className="text-xs sm:text-sm text-gray-500">
                                            Ordered {formatElapsedTime(getElapsedMinutes(selectedOrder.createdAt))} ago
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-black transition-colors active:bg-gray-200"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                {/* Items */}
                                <div className="mb-5 sm:mb-6">
                                    <h3 className="mb-3 sm:mb-4 text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Order Items
                                    </h3>
                                    <div className="space-y-2 sm:space-y-3">
                                        {selectedOrder.items?.map((item, index) => (
                                            <div key={index} className="flex gap-3 sm:gap-4 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4">
                                                <div className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-md bg-black font-mono text-sm font-bold text-white">
                                                    {item.quantity}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="mb-1 font-medium text-sm sm:text-base text-black">
                                                        {item.name}
                                                    </div>
                                                    {item.notes && (
                                                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-amber-900">
                                                            {item.notes}
                                                        </div>
                                                    )}
                                                    <p className="mt-1 font-mono text-[10px] sm:text-xs text-gray-500">
                                                        ₹{item.price?.toFixed(2)} each
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <div className="font-mono text-sm sm:text-base font-bold tabular-nums text-black">
                                                        ₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="mb-5 sm:mb-6 flex items-center justify-between rounded-lg border border-gray-900 bg-black px-4 sm:px-6 py-3 sm:py-4">
                                    <span className="text-xs sm:text-sm font-medium text-white">Total Amount</span>
                                    <span className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-white">
                                        ₹{selectedOrder.totalAmount?.toFixed(2)}
                                    </span>
                                </div>

                                {/* Actions */}
                                <div className="space-y-2 sm:space-y-3">
                                    {selectedOrder.status === 'pending' && (
                                        <button
                                            onClick={() => handleStatusChange(selectedOrder._id, 'preparing')}
                                            disabled={loading}
                                            className="flex h-12 sm:h-11 w-full items-center justify-center rounded-lg bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {loading ? 'Updating...' : 'Start Preparing'}
                                        </button>
                                    )}
                                    {selectedOrder.status === 'preparing' && (
                                        <button
                                            onClick={() => handleStatusChange(selectedOrder._id, 'served')}
                                            disabled={loading}
                                            className="flex h-12 sm:h-11 w-full items-center justify-center rounded-lg bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                        >
                                            {loading ? 'Updating...' : 'Mark as Served'}
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSelectedOrder(null)}
                                        className="flex h-12 sm:h-11 w-full items-center justify-center rounded-lg border border-gray-200 text-sm font-medium text-black hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-95"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>

                            {/* Safe bottom padding for mobile */}
                            <div className="h-safe-bottom sm:hidden" />
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}