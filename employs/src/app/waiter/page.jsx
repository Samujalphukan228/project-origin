'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { useTableSession } from '@/context/TableSessionContext';
import toast from 'react-hot-toast';
import { QRCodeCanvas } from 'qrcode.react';

export default function WaiterDashboardPage() {
    const { user, logout, api } = useAuth();
    const { activeSessions, getActiveSessions, generateTableQR, getQuickStats, hasActiveSession } = useTableSession();
    
    const CUSTOMER_APP_URL = process.env.NEXT_PUBLIC_CUSTOMER_APP_URL;
    
    const [filter, setFilter] = useState('active');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [tableNumber, setTableNumber] = useState('');
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedQR, setGeneratedQR] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const profileMenuRef = useRef(null);
    const initializedRef = useRef(false);
    const tableInputRef = useRef(null);
    const qrRef = useRef(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchSessions = useCallback(async (showToast = false) => {
        if (!api) return;
        
        try {
            await getActiveSessions();
            if (showToast) toast.success('Refreshed');
        } catch (err) {
            console.error('Failed to fetch sessions:', err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                toast.error('Session expired. Please login again.');
                setTimeout(() => logout(), 2000);
            } else if (!initializedRef.current) {
                toast.error('Failed to load tables');
            }
        }
    }, [api, getActiveSessions, logout]);

    useEffect(() => {
        if (initializedRef.current || !api) return;
        initializedRef.current = true;
        fetchSessions().finally(() => setInitialLoading(false));
        const interval = setInterval(() => fetchSessions(), 30000);
        return () => clearInterval(interval);
    }, [api, fetchSessions]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await fetchSessions(true);
        setRefreshing(false);
    };

    const handleGenerateQR = async (e) => {
        e?.preventDefault();
        
        if (!tableNumber || tableNumber.trim() === '') {
            toast.error('Please enter a table number');
            return;
        }

        const tableNum = parseInt(tableNumber);
        if (isNaN(tableNum) || tableNum <= 0) {
            toast.error('Please enter a valid table number');
            return;
        }

        if (hasActiveSession && hasActiveSession(tableNum)) {
            toast.error(`Table ${tableNum} already has an active session`);
            return;
        }

        setIsGenerating(true);

        try {
            const result = await generateTableQR(tableNum);
            
            if (result.success) {
                const qrData = {
                    tableNumber: tableNum,
                    sessionToken: result.session.sessionToken,
                    url: `${CUSTOMER_APP_URL}/s/${result.session.sessionToken}/${tableNum}`,
                    createdAt: result.session.createdAt || new Date().toISOString()
                };

                setGeneratedQR(qrData);
                setShowGenerateModal(false);
                setShowQRModal(true);
                setTableNumber('');
                
                toast.success(`QR code generated for Table ${tableNum}`);
                setTimeout(() => fetchSessions(), 500);
            } else {
                toast.error(result.message || 'Failed to generate QR');
            }
        } catch (error) {
            console.error('Generate QR error:', error);
            toast.error('Failed to generate QR code');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadQR = () => {
        if (!qrRef.current) return;
        const canvas = qrRef.current.querySelector('canvas');
        if (!canvas) return;
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `table-${generatedQR.tableNumber}-qr.png`;
        link.href = url;
        link.click();
        toast.success('QR code downloaded');
    };

    const handlePrintQR = () => {
        const printWindow = window.open('', '_blank');
        const canvas = qrRef.current.querySelector('canvas');
        const dataUrl = canvas.toDataURL();

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Table ${generatedQR.tableNumber} QR Code</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: system-ui, -apple-system, sans-serif;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        min-height: 100vh;
                        padding: 40px;
                        background: white;
                    }
                    .container {
                        text-align: center;
                        border: 2px solid #000;
                        padding: 60px;
                        border-radius: 16px;
                        max-width: 600px;
                    }
                    h1 {
                        font-size: 48px;
                        font-weight: 700;
                        margin-bottom: 12px;
                        color: #000;
                    }
                    .subtitle {
                        font-size: 20px;
                        color: #666;
                        margin-bottom: 32px;
                    }
                    img {
                        width: 100%;
                        max-width: 350px;
                        height: auto;
                        border: 2px solid #e5e5e5;
                        border-radius: 12px;
                        margin: 20px 0;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Table ${generatedQR.tableNumber}</h1>
                    <p class="subtitle">Scan to Order</p>
                    <img src="${dataUrl}" alt="QR Code" />
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleViewQR = (session) => {
        if (!session.isActive) {
            toast.error('Cannot view QR for expired session');
            return;
        }
        
        const qrData = {
            tableNumber: session.tableNumber,
            sessionToken: session.sessionToken,
            url: `${CUSTOMER_APP_URL}/s/${session.sessionToken}/${session.tableNumber}`,
            createdAt: session.createdAt
        };

        setGeneratedQR(qrData);
        setShowQRModal(true);
    };

    const handleCopyURL = async (url) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied!');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy');
        }
    };

    useEffect(() => {
        if (showGenerateModal && tableInputRef.current) {
            setTimeout(() => tableInputRef.current?.focus(), 100);
        }
    }, [showGenerateModal]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
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
                setShowGenerateModal(false);
                setShowQRModal(false);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    const filteredSessions = (activeSessions || []).filter(session => {
        if (filter === 'active') return session.isActive === true;
        if (filter === 'expired') return session.isActive === false;
        return true;
    });

    const stats = getQuickStats ? getQuickStats() : {
        activeCount: (activeSessions || []).filter(s => s.isActive === true).length,
        expiredCount: (activeSessions || []).filter(s => s.isActive === false).length,
        totalCount: (activeSessions || []).length,
    };

    const formatTime = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    if (initialLoading) {
        return (
            <ProtectedRoute allowedRoles={['waiter']}>
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
        <ProtectedRoute allowedRoles={['waiter']}>
            <div className="min-h-screen bg-white pb-safe">
                {/* HEADER */}
                <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
                        <div className="flex h-14 sm:h-16 items-center justify-between gap-2">
                            {/* Left */}
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 items-center justify-center rounded-md bg-black">
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <h1 className="text-xs sm:text-sm font-semibold leading-none truncate">Waiter Dashboard</h1>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 hidden xs:block">Table Management</p>
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
                                    onClick={handleRefresh}
                                    disabled={refreshing}
                                    className="flex h-8 sm:h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-2 sm:px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 active:scale-95"
                                >
                                    <svg className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    <span className="hidden sm:inline">Refresh</span>
                                </button>

                                {/* New QR */}
                                <button
                                    onClick={() => setShowGenerateModal(true)}
                                    className="flex h-8 sm:h-9 items-center gap-1.5 sm:gap-2 rounded-md bg-black px-2.5 sm:px-3 text-xs font-medium text-white hover:bg-gray-800 transition-all active:scale-95"
                                >
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="hidden xs:inline">New QR</span>
                                </button>

                                {/* Profile */}
                                <div className="relative" ref={profileMenuRef}>
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-xs font-medium text-gray-700 hover:border-gray-300 transition-all active:scale-95"
                                    >
                                        {user?.name?.[0]?.toUpperCase() || 'W'}
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-56 sm:w-64 origin-top-right rounded-lg border border-gray-200 bg-white shadow-xl">
                                            <div className="p-3 sm:p-4 border-b border-gray-100">
                                                <p className="text-sm font-medium text-black truncate">{user?.name || 'Waiter'}</p>
                                                <p className="text-xs text-gray-500 mt-1 truncate">{user?.email || 'No email'}</p>
                                                <div className="mt-2 inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                                    Waiter
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
                                { id: 'active', label: 'Active' },
                                { id: 'expired', label: 'Expired' },
                                { id: 'all', label: 'All' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setFilter(tab.id)}
                                    className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                                        filter === tab.id
                                            ? 'text-black'
                                            : 'text-gray-500 hover:text-gray-700 active:text-black'
                                    }`}
                                >
                                    <span>{tab.label}</span>
                                    <span className={`inline-flex h-4 sm:h-5 min-w-[16px] sm:min-w-[20px] items-center justify-center rounded-full px-1 sm:px-1.5 text-[10px] sm:text-xs font-semibold tabular-nums transition-colors ${
                                        filter === tab.id
                                            ? 'bg-black text-white'
                                            : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        {tab.id === 'active' ? stats.activeCount : tab.id === 'expired' ? stats.expiredCount : stats.totalCount}
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
                    {/* Stats Cards - Responsive grid */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6 lg:mb-8">
                        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 lg:p-5">
                            <div className="mb-2 flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-md border border-green-200 bg-green-50">
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-black">{stats.activeCount}</div>
                            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 mt-0.5">Active</div>
                        </div>
                        
                        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 lg:p-5">
                            <div className="mb-2 flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50">
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-black">{stats.expiredCount}</div>
                            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 mt-0.5">Expired</div>
                        </div>
                        
                        <div className="rounded-lg border border-gray-200 bg-white p-3 sm:p-4 lg:p-5">
                            <div className="mb-2 flex h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 items-center justify-center rounded-md border border-blue-200 bg-blue-50">
                                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div className="font-mono text-xl sm:text-2xl lg:text-3xl font-bold tabular-nums text-black">{stats.totalCount}</div>
                            <div className="text-[10px] sm:text-xs lg:text-sm text-gray-500 mt-0.5">Total</div>
                        </div>
                    </div>

                    {/* Tables List */}
                    {filteredSessions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-20 rounded-lg border border-gray-200 bg-white">
                            <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-50">
                                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <h3 className="text-sm sm:text-base font-medium text-black">No {filter} sessions</h3>
                            <p className="mt-1 text-xs sm:text-sm text-gray-500 text-center px-4">Generate a QR code to get started</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                            {filteredSessions.map(session => (
                                <button
                                    key={session._id}
                                    onClick={() => session.isActive && handleViewQR(session)}
                                    className={`rounded-lg border bg-white p-3 sm:p-4 lg:p-5 text-left transition-all active:scale-95 ${
                                        session.isActive
                                            ? 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                                            : 'border-gray-200 opacity-60 cursor-default'
                                    }`}
                                >
                                    <div className="mb-3 sm:mb-4 flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-1 sm:mb-2 font-mono text-xl sm:text-2xl font-bold tabular-nums text-black">
                                                {session.tableNumber}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-gray-500">Table Number</div>
                                        </div>
                                        {session.isActive ? (
                                            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-md border border-green-200 bg-green-50 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-green-700 whitespace-nowrap">
                                                <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-green-600" />
                                                <span className="hidden xs:inline">Active</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium text-gray-600">
                                                Expired
                                            </span>
                                        )}
                                    </div>

                                    <div className="mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 border-t border-gray-100 pt-3 sm:pt-4 text-xs sm:text-sm text-gray-500">
                                        <svg className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="truncate">{formatTime(session.createdAt)}</span>
                                    </div>

                                    {session.isActive && (
                                        <div className="flex h-9 sm:h-10 items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs sm:text-sm font-medium text-black hover:bg-gray-100 transition-colors">
                                            View QR
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </main>

                {/* GENERATE QR MODAL */}
                {showGenerateModal && (
                    <div 
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
                        onClick={() => !isGenerating && setShowGenerateModal(false)}
                    >
                        <div 
                            className="relative w-full sm:max-w-md overflow-hidden rounded-t-2xl sm:rounded-xl border-t sm:border border-gray-200 bg-white shadow-2xl max-h-[90vh] sm:max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-bold text-black">Generate QR Code</h2>
                                        <p className="mt-1 text-xs sm:text-sm text-gray-500">Create a new table session</p>
                                    </div>
                                    <button
                                        onClick={() => setShowGenerateModal(false)}
                                        disabled={isGenerating}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-black transition-colors active:bg-gray-200 disabled:opacity-50"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                            
                            <form onSubmit={handleGenerateQR} className="p-4 sm:p-6 flex-1 overflow-y-auto">
                                <div className="mb-6">
                                    <label className="mb-2 block text-sm font-medium text-black">
                                        Table Number
                                    </label>
                                    <input
                                        ref={tableInputRef}
                                        type="number"
                                        value={tableNumber}
                                        onChange={(e) => setTableNumber(e.target.value)}
                                        disabled={isGenerating}
                                        className="flex h-12 sm:h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-base sm:text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50 transition-all"
                                        placeholder="Enter table number"
                                        min="1"
                                        required
                                        autoFocus
                                        inputMode="numeric"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowGenerateModal(false)}
                                        disabled={isGenerating}
                                        className="flex h-12 sm:h-11 flex-1 items-center justify-center rounded-lg border border-gray-200 text-sm font-medium text-black hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isGenerating || !tableNumber}
                                        className="flex h-12 sm:h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 transition-colors disabled:opacity-50"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                <span>Generating...</span>
                                            </>
                                        ) : (
                                            <span>Generate</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* VIEW QR MODAL */}
                {showQRModal && generatedQR && (
                    <div 
                        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm"
                        onClick={() => setShowQRModal(false)}
                    >
                        <div 
                            className="relative w-full sm:max-w-lg max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-xl border-t sm:border border-gray-200 bg-white shadow-2xl flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 flex-shrink-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-mono text-xl sm:text-2xl font-bold tabular-nums text-black">
                                            Table {generatedQR.tableNumber}
                                        </h2>
                                        <p className="mt-1 text-xs sm:text-sm text-gray-500">Scan to start ordering</p>
                                    </div>
                                    <button
                                        onClick={() => setShowQRModal(false)}
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-black transition-colors active:bg-gray-200"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                                <div ref={qrRef} className="mb-4 sm:mb-6 flex items-center justify-center rounded-lg border border-gray-200 bg-white p-6 sm:p-8">
                                    <QRCodeCanvas
                                        value={generatedQR.url}
                                        size={window.innerWidth < 640 ? 240 : 280}
                                        level="H"
                                        includeMargin={true}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                    />
                                </div>

                                <div className="mb-4 sm:mb-6">
                                    <label className="mb-2 block text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">
                                        Customer Link
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 sm:py-2.5">
                                            <code className="font-mono text-[11px] sm:text-xs text-black break-all">
                                                {generatedQR.url}
                                            </code>
                                        </div>
                                        <button
                                            onClick={() => handleCopyURL(generatedQR.url)}
                                            className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-lg border transition-all active:scale-95 ${
                                                copied 
                                                    ? 'border-green-300 bg-green-100' 
                                                    : 'border-gray-200 hover:bg-gray-100 active:bg-gray-200'
                                            }`}
                                        >
                                            {copied ? (
                                                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                                    <p className="flex items-start gap-2 text-xs text-green-800">
                                        <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Customers can scan this QR code to start ordering</span>
                                    </p>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 p-4 sm:p-5 flex-shrink-0 safe-bottom">
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <button
                                        onClick={handleDownloadQR}
                                        className="flex h-12 sm:h-11 items-center justify-center gap-2 rounded-lg bg-black text-sm font-medium text-white hover:bg-gray-800 active:bg-gray-900 transition-all active:scale-95"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        <span>Download</span>
                                    </button>
                                    <button
                                        onClick={handlePrintQR}
                                        className="flex h-12 sm:h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 text-sm font-medium text-black hover:bg-gray-50 active:bg-gray-100 transition-all active:scale-95"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                        </svg>
                                        <span>Print</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}