'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useOrder } from '../../context/OrderContext';
import { useEmployee } from '../../context/employeeContext';
import { useMenu } from '../../context/menuContext';
import { useAdminTableSession } from '../../context/AdminTableSessionContext';
import {
    DollarSign,
    ShoppingCart,
    Users,
    Package,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle,
    Loader2,
    Star,
    RefreshCw,
    AlertCircle,
    X,
    QrCode,
    UserCheck,
    Table,
    Activity,
    BarChart3,
    TrendingUp,
    Filter,
    Calendar,
    Search,
    Download,
    ChevronDown,
    AlertTriangle,
} from 'lucide-react';

export default function DashboardPage() {
    const {
        orders,
        getAllOrders,
        dashboardStats,
        todaySales,
        totalRevenue,
        topSellingItems,
        isLoading: orderLoading,
        error: orderError,
        getDashboardStats,
        getTodaySales,
        getTotalRevenue,
        getTopSellingItems,
        clearError: clearOrderError,
    } = useOrder();

    const {
        totalEmployees,
        employees,
        isLoading: employeeLoading,
        error: employeeError,
        getAllEmployees,
        clearError: clearEmployeeError,
    } = useEmployee();

    const {
        menus,
        isLoading: menuLoading,
        error: menuError,
        getAllMenus,
        clearError: clearMenuError,
    } = useMenu();

    const {
        allSessions,
        analytics,
        loading: sessionLoading,
        error: sessionError,
        isApiReady,
        isReady,
        lastUpdate,
        getAllSessions,
        getAnalytics,
        getWaitersPerformance,
        getTopTables,
        getSessionsStats,
        clearError: clearSessionError,
    } = useAdminTableSession();

    const [timeRange, setTimeRange] = useState('today');
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [waitersPerf, setWaitersPerf] = useState([]);
    const [topTables, setTopTables] = useState([]);
    const [sessionStats, setSessionStats] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        status: [],
        waiter: [],
        table: [],
        minAmount: '',
        maxAmount: '',
        searchQuery: '',
    });

    const loadedTimeRanges = useRef(new Set());
    const isMounted = useRef(true);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const allErrors = [
        orderError && { source: 'Orders', message: orderError },
        employeeError && { source: 'Employees', message: employeeError },
        menuError && { source: 'Menu', message: menuError },
        sessionError && { source: 'Table Sessions', message: sessionError },
    ].filter(Boolean);

    const hasError = allErrors.length > 0;

    const clearAllErrors = useCallback(() => {
        clearOrderError?.();
        clearEmployeeError?.();
        clearMenuError?.();
        clearSessionError?.();
        setRetryCount(0);
    }, [clearOrderError, clearEmployeeError, clearMenuError, clearSessionError]);

    const loadTableSessionAnalytics = useCallback(async (range) => {
        if (!isReady || !isMounted.current) return;

        try {
            const [waitersRes, tablesRes, statsRes] = await Promise.allSettled([
                getWaitersPerformance(range),
                getTopTables(5, range),
                getSessionsStats(range),
            ]);

            if (!isMounted.current) return;

            if (waitersRes.status === 'fulfilled' && waitersRes.value?.success) {
                setWaitersPerf(waitersRes.value.waiters || []);
            }
            if (tablesRes.status === 'fulfilled' && tablesRes.value?.success) {
                setTopTables(tablesRes.value.tables || []);
            }
            if (statsRes.status === 'fulfilled' && statsRes.value?.success) {
                setSessionStats(statsRes.value.stats);
            }
        } catch (error) {
            console.error('Error loading table analytics:', error);
        }
    }, [isReady, getWaitersPerformance, getTopTables, getSessionsStats]);

    useEffect(() => {
        isMounted.current = true;
        let cancelled = false;

        const loadData = async () => {
            if (loadedTimeRanges.current.has(timeRange)) {
                setIsInitialLoading(false);
                return;
            }

            try {
                const corePromises = [
                    getAllOrders(),
                    getDashboardStats(),
                    getTodaySales(),
                    getTotalRevenue(),
                    getTopSellingItems(10, 'quantity'),
                    getAllEmployees(),
                    getAllMenus(),
                ];

                const sessionPromises = isReady ? [
                    getAllSessions({ range: timeRange }),
                    getAnalytics(timeRange),
                    loadTableSessionAnalytics(timeRange),
                ] : [];

                await Promise.allSettled([...corePromises, ...sessionPromises]);

                if (!cancelled) {
                    loadedTimeRanges.current.add(timeRange);
                    setIsInitialLoading(false);
                }
            } catch (error) {
                console.error('Data loading error:', error);
                if (!cancelled) {
                    setIsInitialLoading(false);
                }
            }
        };

        loadData();

        return () => {
            cancelled = true;
            isMounted.current = false;
        };
    }, [
        timeRange,
        isReady,
        getAllOrders,
        getDashboardStats,
        getTodaySales,
        getTotalRevenue,
        getTopSellingItems,
        getAllEmployees,
        getAllMenus,
        getAllSessions,
        getAnalytics,
        loadTableSessionAnalytics
    ]);

    const handleRefreshAll = useCallback(async () => {
        loadedTimeRanges.current.delete(timeRange);

        const results = await Promise.allSettled([
            getAllOrders(),
            getDashboardStats(),
            getTodaySales(),
            getTotalRevenue(),
            getTopSellingItems(10, 'quantity'),
            getAllEmployees(),
            getAllMenus(),
            isReady && getAllSessions({ range: timeRange }),
            isReady && getAnalytics(timeRange),
            isReady && loadTableSessionAnalytics(timeRange),
        ].filter(Boolean));

        const failures = results.filter(r => r.status === 'rejected');

        if (failures.length === 0) {
            showToast('Data refreshed successfully', 'success');
            setRetryCount(0);
            loadedTimeRanges.current.add(timeRange);
        } else if (failures.length < results.length) {
            showToast(`Partially refreshed (${failures.length} failed)`, 'warning');
        } else {
            showToast('Failed to refresh data', 'error');
        }
    }, [
        timeRange,
        isReady,
        getAllOrders,
        getDashboardStats,
        getTodaySales,
        getTotalRevenue,
        getTopSellingItems,
        getAllEmployees,
        getAllMenus,
        getAllSessions,
        getAnalytics,
        loadTableSessionAnalytics,
    ]);

    useEffect(() => {
        if (!hasError || retryCount >= 3) return;

        const timer = setTimeout(() => {
            showToast(`Retrying... (${retryCount + 1}/3)`, 'info');
            clearAllErrors();
            handleRefreshAll();
            setRetryCount(prev => prev + 1);
        }, 3000 * (retryCount + 1));

        return () => clearTimeout(timer);
    }, [hasError, retryCount, handleRefreshAll, clearAllErrors]);

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        if (filters.status.length > 0) count++;
        if (filters.waiter.length > 0) count++;
        if (filters.table.length > 0) count++;
        if (filters.minAmount) count++;
        if (filters.maxAmount) count++;
        if (filters.searchQuery) count++;
        return count;
    };

    const clearFilters = useCallback(() => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            status: [],
            waiter: [],
            table: [],
            minAmount: '',
            maxAmount: '',
            searchQuery: '',
        });
        showToast('Filters cleared');
    }, []);

    const applyFilters = useCallback(() => {
        showToast(`${getActiveFilterCount()} filter(s) applied`);
    }, [filters]);

    const filteredOrders = useMemo(() => {
        const sourceOrders = orders.length > 0
            ? orders
            : dashboardStats?.recentOrders || [];

        if (!Array.isArray(sourceOrders)) return [];

        let filtered = [...sourceOrders];

        const hasActiveFilters =
            filters.dateFrom ||
            filters.dateTo ||
            filters.status.length > 0 ||
            filters.minAmount ||
            filters.maxAmount ||
            filters.searchQuery;

        if (!hasActiveFilters) return filtered;

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
        }

        if (filters.status.length > 0) {
            filtered = filtered.filter(order =>
                filters.status.includes(order.status?.toLowerCase())
            );
        }

        if (filters.minAmount) {
            filtered = filtered.filter(order =>
                parseFloat(order.totalAmount || 0) >= parseFloat(filters.minAmount)
            );
        }
        if (filters.maxAmount) {
            filtered = filtered.filter(order =>
                parseFloat(order.totalAmount || 0) <= parseFloat(filters.maxAmount)
            );
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderId?.toLowerCase().includes(query) ||
                order._id?.toLowerCase().includes(query) ||
                order.customerName?.toLowerCase().includes(query) ||
                order.customer?.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [orders, dashboardStats, filters]);

    const filteredSessions = useMemo(() => {
        const sourceSessions = allSessions || [];
        if (!Array.isArray(sourceSessions)) return [];

        let filtered = [...sourceSessions];

        const hasActiveFilters =
            filters.dateFrom ||
            filters.dateTo ||
            filters.waiter.length > 0 ||
            filters.table.length > 0;

        if (!hasActiveFilters) return filtered;

        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filtered = filtered.filter(session => new Date(session.createdAt) >= fromDate);
        }
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(session => new Date(session.createdAt) <= toDate);
        }

        if (filters.waiter.length > 0) {
            filtered = filtered.filter(session =>
                filters.waiter.includes(session.createdBy?._id || session.createdBy)
            );
        }

        if (filters.table.length > 0) {
            filtered = filtered.filter(session =>
                filters.table.includes(session.tableNumber?.toString())
            );
        }

        return filtered;
    }, [allSessions, filters]);

    const uniqueWaiters = useMemo(() => {
        const waiters = new Map();
        allSessions?.forEach(session => {
            if (session.createdBy) {
                const id = session.createdBy._id || session.createdBy;
                const name = session.createdBy.name || 'Unknown';
                waiters.set(id, name);
            }
        });
        return Array.from(waiters, ([id, name]) => ({ id, name }));
    }, [allSessions]);

    const uniqueTables = useMemo(() => {
        const tables = new Set();
        allSessions?.forEach(session => {
            if (session.tableNumber) {
                tables.add(session.tableNumber.toString());
            }
        });
        return Array.from(tables).sort((a, b) => parseInt(a) - parseInt(b));
    }, [allSessions]);

    const stats = useMemo(() => {
        const safeNumber = (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        };

        const formatGrowth = (value) => value || '+0%';

        const revenueValue = safeNumber(todaySales?.totalRevenue || totalRevenue || 0);
        const ordersValue = parseInt(todaySales?.totalOrders || 0) || 0;
        const menuItems = Array.isArray(menus) ? menus.filter(m => m.status === 'approved').length : 0;
        const totalEmployeesCount = totalEmployees || 0;

        const totalSessions = analytics?.totalSessions || sessionStats?.total || 0;
        const activeSessions = analytics?.activeSessions || sessionStats?.active || 0;
        const activeWaiters = analytics?.activeWaitersCount || 0;
        const uniqueTablesUsed = analytics?.uniqueTablesUsed || 0;

        const revenueChange = formatGrowth(dashboardStats?.revenueGrowth || analytics?.revenueGrowth);
        const ordersChange = formatGrowth(dashboardStats?.ordersGrowth || analytics?.ordersGrowth);
        const sessionsChange = formatGrowth(analytics?.sessionsGrowth || sessionStats?.growth);
        const activeSessionsChange = formatGrowth(analytics?.activeSessionsGrowth);

        return {
            revenue: {
                value: revenueValue,
                change: revenueChange,
                trend: revenueChange.includes('-') ? 'down' : 'up'
            },
            orders: {
                value: ordersValue,
                change: ordersChange,
                trend: ordersChange.includes('-') ? 'down' : 'up'
            },
            employees: { value: totalEmployeesCount },
            menuItems: { value: menuItems },
            tableSessions: {
                value: totalSessions,
                change: sessionsChange,
                trend: sessionsChange.includes('-') ? 'down' : 'up'
            },
            activeSessions: {
                value: activeSessions,
                change: activeSessionsChange,
                trend: activeSessionsChange.includes('-') ? 'down' : 'up'
            },
            activeWaiters: { value: activeWaiters },
            uniqueTables: { value: uniqueTablesUsed },
        };
    }, [todaySales, totalRevenue, dashboardStats, menus, totalEmployees, analytics, sessionStats]);

    const peakHours = useMemo(() => {
        const hourlyStats = {};

        const ordersToProcess = filteredOrders.length > 0 ? filteredOrders : dashboardStats?.recentOrders || [];

        ordersToProcess.forEach(order => {
            try {
                const date = new Date(order.createdAt);
                const hour = date.getHours();

                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = { hour, orders: 0, sessions: 0, revenue: 0 };
                }

                hourlyStats[hour].orders++;
                hourlyStats[hour].revenue += parseFloat(order.totalAmount || 0);
            } catch (e) {
                // Silent
            }
        });

        filteredSessions.forEach(session => {
            try {
                const date = new Date(session.createdAt);
                const hour = date.getHours();

                if (!hourlyStats[hour]) {
                    hourlyStats[hour] = { hour, orders: 0, sessions: 0, revenue: 0 };
                }

                hourlyStats[hour].sessions++;
            } catch (e) {
                // Silent
            }
        });

        const hourlyData = Object.values(hourlyStats).sort((a, b) => a.hour - b.hour);

        let peakOrderHour = null;
        let peakSessionHour = null;
        let maxOrders = 0;
        let maxSessions = 0;

        hourlyData.forEach(data => {
            if (data.orders > maxOrders) {
                maxOrders = data.orders;
                peakOrderHour = data.hour;
            }
            if (data.sessions > maxSessions) {
                maxSessions = data.sessions;
                peakSessionHour = data.hour;
            }
        });

        const enrichedData = hourlyData.map(data => ({
            ...data,
            ordersPercent: maxOrders > 0 ? (data.orders / maxOrders) * 100 : 0,
            sessionsPercent: maxSessions > 0 ? (data.sessions / maxSessions) * 100 : 0,
            isPeakOrders: data.hour === peakOrderHour,
            isPeakSessions: data.hour === peakSessionHour,
        }));

        return {
            hourlyData: enrichedData,
            peakOrderHour,
            peakSessionHour,
            maxOrders,
            maxSessions,
            hasData: enrichedData.length > 0,
        };
    }, [filteredOrders, filteredSessions, dashboardStats]);

    const recentOrders = useMemo(() => {
        return filteredOrders.slice(0, 5).map(order => ({
            id: order.orderId || order._id || 'N/A',
            customer: order.customerName || order.customer?.name || `Table ${order.tableNumber || 'N/A'}`,
            amount: `$${parseFloat(order.totalAmount || 0).toFixed(2)}`,
            status: (order.status || 'pending').toLowerCase(),
            statusLabel: order.status || 'Pending',
            time: formatTimeAgo(order.createdAt),
        }));
    }, [filteredOrders, orders, dashboardStats]);

    const topItems = useMemo(() => {
        if (!topSellingItems || !Array.isArray(topSellingItems) || topSellingItems.length === 0) return [];
        return topSellingItems.slice(0, 5).map((item, index) => ({
            id: item._id || index,
            name: item.name || 'Unknown Item',
            orders: parseInt(item.totalQuantitySold || item.totalQuantity || item.quantity || 0) || 0,
            revenue: `$${parseFloat(item.totalRevenue || 0).toFixed(2)}`,
            growth: item.growth || item.growthPercentage || '+0%',
        }));
    }, [topSellingItems]);

    const activeTableSessions = useMemo(() => {
        if (!Array.isArray(filteredSessions) || filteredSessions.length === 0) return [];

        const activeSessions = filteredSessions.filter(session => {
            const isActiveBoolean = session.isActive === true;
            const isActiveString = session.isActive === 'true';
            const statusActive = session.status === 'active';
            const activeField = session.active === true;

            return isActiveBoolean || isActiveString || statusActive || activeField;
        });

        return activeSessions
            .slice(0, 5)
            .map(session => ({
                id: session._id,
                tableNumber: session.tableNumber,
                waiter: session.createdBy?.name || session.waiter?.name || 'Unknown',
                createdAt: formatTimeAgo(session.createdAt),
                rawSession: session,
            }));
    }, [filteredSessions]);

    const quickStats = useMemo(() => {
        const safeNumber = (value) => {
            const num = parseFloat(value);
            return isNaN(num) ? 0 : num;
        };

        const totalOrders = parseInt(todaySales?.totalOrders || 0) || 0;
        const totalRev = safeNumber(todaySales?.totalRevenue || 0);
        const avgOrderValue = totalOrders > 0 ? totalRev / totalOrders : 0;
        const completionRate = safeNumber(dashboardStats?.completionRate || analytics?.completionRate || 0);
        const avgPrepTime = parseInt(dashboardStats?.averagePreparationTime || analytics?.averagePreparationTime || 0) || 0;
        const rating = safeNumber(dashboardStats?.averageRating || analytics?.averageRating || 0);

        return {
            avgOrderValue: `$${avgOrderValue.toFixed(2)}`,
            completionRate: `${completionRate.toFixed(1)}%`,
            avgPrepTime: `${avgPrepTime} min`,
            rating: rating > 0 ? rating.toFixed(1) : 'N/A',
        };
    }, [todaySales, dashboardStats, analytics]);

    const isLoading = orderLoading || employeeLoading || menuLoading || sessionLoading;

    if (isInitialLoading) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                {/* ===== HEADER ===== */}
                <div className="sticky top-0 z-40 bg-[#fafafa]/95 dark:bg-black/95 backdrop-blur-xl border-b border-transparent pt-4 sm:pt-6 pb-3 sm:pb-4 -mx-3 px-3 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6">
                    {/* Title Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1.5 truncate">
                                Dashboard
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                                <p className="text-gray-600 dark:text-gray-400 font-medium">
                                    {timeRange === 'today' ? 'Today' :
                                        timeRange === 'week' ? 'This Week' :
                                            timeRange === 'month' ? 'This Month' : 'This Year'}
                                </p>
                                {lastUpdate && (
                                    <>
                                        <span className="text-gray-300 dark:text-gray-700">•</span>
                                        <p className="text-gray-500 dark:text-gray-500 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            Updated {formatTimeAgo(lastUpdate)}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="relative flex items-center justify-center gap-2 min-h-[44px] h-10 sm:h-11 min-w-[44px] px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-95 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                                aria-label="Toggle filters"
                            >
                                <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                <span className="hidden xs:inline">Filters</span>
                                {getActiveFilterCount() > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[22px] h-5.5 bg-blue-600 dark:bg-blue-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg ring-2 ring-[#fafafa] dark:ring-black animate-bounce-subtle">
                                        {getActiveFilterCount()}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={handleRefreshAll}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 min-h-[44px] h-10 sm:h-11 min-w-[44px] px-3 sm:px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                                aria-label="Refresh data"
                            >
                                <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden xs:inline">{isLoading ? 'Loading...' : 'Refresh'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Time Range Selector */}
                    <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                        <div className="flex gap-2 min-w-max sm:min-w-0" role="tablist" aria-label="Time range selector">
                            {[
                                { value: 'today', label: 'Today' },
                                { value: 'week', label: 'Week' },
                                { value: 'month', label: 'Month' },
                                { value: 'year', label: 'Year' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => setTimeRange(option.value)}
                                    disabled={!isReady}
                                    role="tab"
                                    aria-selected={timeRange === option.value}
                                    aria-controls={`${option.value}-panel`}
                                    className={`flex-shrink-0 min-h-[44px] h-10 px-5 sm:px-6 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black ${timeRange === option.value
                                        ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                        : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== FILTER PANEL ===== */}
                {showFilters && (
                    <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        uniqueWaiters={uniqueWaiters}
                        uniqueTables={uniqueTables}
                        onApply={applyFilters}
                        onClear={clearFilters}
                        onClose={() => setShowFilters(false)}
                    />
                )}

                {/* ===== ACTIVE FILTERS DISPLAY ===== */}
                {getActiveFilterCount() > 0 && (
                    <div className="mt-4 mb-4 flex flex-wrap items-center gap-2" role="region" aria-label="Active filters">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            Active Filters:
                        </span>
                        {filters.dateFrom && (
                            <FilterBadge
                                label={`From: ${new Date(filters.dateFrom).toLocaleDateString()}`}
                                onRemove={() => setFilters(prev => ({ ...prev, dateFrom: '' }))}
                            />
                        )}
                        {filters.dateTo && (
                            <FilterBadge
                                label={`To: ${new Date(filters.dateTo).toLocaleDateString()}`}
                                onRemove={() => setFilters(prev => ({ ...prev, dateTo: '' }))}
                            />
                        )}
                        {filters.status.map(status => (
                            <FilterBadge
                                key={status}
                                label={`Status: ${status}`}
                                onRemove={() => setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(s => s !== status)
                                }))}
                            />
                        ))}
                        {filters.waiter.map(waiterId => {
                            const waiter = uniqueWaiters.find(w => w.id === waiterId);
                            return (
                                <FilterBadge
                                    key={waiterId}
                                    label={`Waiter: ${waiter?.name || 'Unknown'}`}
                                    onRemove={() => setFilters(prev => ({
                                        ...prev,
                                        waiter: prev.waiter.filter(w => w !== waiterId)
                                    }))}
                                />
                            );
                        })}
                        {filters.table.map(table => (
                            <FilterBadge
                                key={table}
                                label={`Table: ${table}`}
                                onRemove={() => setFilters(prev => ({
                                    ...prev,
                                    table: prev.table.filter(t => t !== table)
                                }))}
                            />
                        ))}
                        {(filters.minAmount || filters.maxAmount) && (
                            <FilterBadge
                                label={`Amount: $${filters.minAmount || '0'} - $${filters.maxAmount || '∞'}`}
                                onRemove={() => setFilters(prev => ({ ...prev, minAmount: '', maxAmount: '' }))}
                            />
                        )}
                        {filters.searchQuery && (
                            <FilterBadge
                                label={`Search: "${filters.searchQuery}"`}
                                onRemove={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                            />
                        )}
                        <button
                            onClick={clearFilters}
                            className="text-xs text-red-600 dark:text-red-500 font-bold hover:underline underline-offset-2 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-black min-h-[44px] flex items-center"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {/* ===== ERROR ALERTS ===== */}
                {allErrors.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl sm:rounded-2xl p-4 sm:p-5 mb-4 space-y-3" role="alert" aria-live="assertive">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base font-bold text-red-700 dark:text-red-300 mb-2">
                                    {allErrors.length} Error{allErrors.length > 1 ? 's' : ''} Occurred
                                </h3>
                            </div>
                        </div>
                        {allErrors.map((error, index) => (
                            <div key={index} className="flex items-start gap-2.5 sm:gap-3 pl-8">
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 mb-0.5">
                                        {error.source}
                                    </p>
                                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 break-words">
                                        {error.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <div className="flex items-center gap-3 pt-2 border-t border-red-200 dark:border-red-500/20">
                            <button
                                onClick={clearAllErrors}
                                className="flex-1 min-h-[44px] text-xs sm:text-sm text-red-600 dark:text-red-500 font-bold hover:underline text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-black rounded-lg"
                            >
                                Dismiss All
                            </button>
                            {retryCount > 0 && (
                                <span className="text-xs text-red-500 dark:text-red-400">
                                    Auto-retrying: {retryCount}/3
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* ===== KEY STATS GRID ===== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6 mt-4">
                    <MobileStatCard
                        icon={DollarSign}
                        label="Revenue"
                        value={formatCurrency(stats.revenue.value)}
                        change={stats.revenue.change}
                        trend={stats.revenue.trend}
                    />
                    <MobileStatCard
                        icon={ShoppingCart}
                        label="Orders"
                        value={formatNumber(stats.orders.value)}
                        change={stats.orders.change}
                        trend={stats.orders.trend}
                    />
                    <MobileStatCard
                        icon={QrCode}
                        label="Sessions"
                        value={formatNumber(stats.tableSessions.value)}
                        change={stats.tableSessions.change}
                        trend={stats.tableSessions.trend}
                    />
                    <MobileStatCard
                        icon={Activity}
                        label="Active Now"
                        value={formatNumber(stats.activeSessions.value)}
                        subtitle={`${stats.activeWaiters.value} waiters`}
                    />
                </div>

                {/* ===== TABS NAVIGATION ===== */}
                <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
                    <div className="w-full overflow-x-auto scrollbar-hide px-3 sm:px-0">
                        <div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0 border-b border-gray-200 dark:border-[#222]" role="tablist">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'sessions', label: 'Sessions', icon: QrCode },
                                { id: 'peak-hours', label: 'Peak Hours', icon: TrendingUp },
                                { id: 'orders', label: 'Orders', icon: ShoppingCart },
                                { id: 'staff', label: 'Staff', icon: Users },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    role="tab"
                                    aria-selected={activeTab === tab.id}
                                    aria-controls={`${tab.id}-panel`}
                                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 min-h-[44px] py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black rounded-t-lg ${activeTab === tab.id
                                        ? 'border-black dark:border-white text-black dark:text-white bg-gray-50/50 dark:bg-[#111]/50'
                                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-[#111]/50'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== TAB CONTENT ===== */}
                <div className="space-y-4 sm:space-y-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div role="tabpanel" id="overview-panel" aria-labelledby="overview-tab">
                            <MobileSection title="Quick Metrics">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <QuickMetric icon={DollarSign} label="Avg. Order" value={quickStats.avgOrderValue} />
                                    <QuickMetric icon={CheckCircle} label="Completion" value={quickStats.completionRate} />
                                    <QuickMetric icon={Clock} label="Prep Time" value={quickStats.avgPrepTime} />
                                    <QuickMetric icon={Star} label="Rating" value={quickStats.rating} />
                                </div>
                            </MobileSection>

                            <MobileSection title="Resources">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    <ResourceCard icon={Users} label="Employees" value={formatNumber(stats.employees.value)} />
                                    <ResourceCard icon={Package} label="Menu Items" value={formatNumber(stats.menuItems.value)} />
                                    <ResourceCard icon={Table} label="Tables Used" value={formatNumber(stats.uniqueTables.value)} />
                                    <ResourceCard icon={UserCheck} label="Active Waiters" value={formatNumber(stats.activeWaiters.value)} />
                                </div>
                            </MobileSection>
                        </div>
                    )}

                    {/* SESSIONS TAB */}
                    {activeTab === 'sessions' && (
                        <div role="tabpanel" id="sessions-panel" aria-labelledby="sessions-tab">
                            <MobileSection title={`Active Sessions (${activeTableSessions.length})`}>
                                {sessionLoading ? (
                                    <LoadingContent text="Loading sessions..." />
                                ) : activeTableSessions.length === 0 ? (
                                    <EmptyContent icon={QrCode} text="No active sessions" description="Sessions will appear here when waiters create new table sessions" />
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {activeTableSessions.map((session) => (
                                            <MobileSessionCard key={session.id} session={session} />
                                        ))}
                                    </div>
                                )}
                            </MobileSection>

                            <MobileSection title="Top Tables">
                                {sessionLoading && topTables.length === 0 ? (
                                    <LoadingContent text="Loading tables..." />
                                ) : topTables.length === 0 ? (
                                    <EmptyContent icon={Table} text="No table data" description="Table statistics will appear as sessions are created" />
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {topTables.map((table, index) => (
                                            <MobileTableCard key={table._id} table={table} rank={index + 1} />
                                        ))}
                                    </div>
                                )}
                            </MobileSection>
                        </div>
                    )}

                    {/* PEAK HOURS TAB */}
                    {activeTab === 'peak-hours' && (
                        <div role="tabpanel" id="peak-hours-panel" aria-labelledby="peak-hours-tab">
                            {!peakHours.hasData ? (
                                <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center">
                                    <Clock className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-700 mx-auto mb-3 sm:mb-4" />
                                    <p className="text-sm sm:text-base font-semibold text-gray-600 dark:text-gray-400 mb-1">
                                        No activity data available yet
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
                                        Data will appear as orders and sessions are created
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                        <div className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-500/5 dark:to-[#0a0a0a] border border-blue-100 dark:border-blue-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                                                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-blue-50 dark:ring-blue-500/5">
                                                    <ShoppingCart className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-500" />
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                                    Busiest Orders
                                                </span>
                                            </div>
                                            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-blue-600 dark:text-blue-400 mb-2 sm:mb-2.5">
                                                {formatHour(peakHours.peakOrderHour)}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                {formatNumber(peakHours.maxOrders)} orders placed
                                            </p>
                                        </div>

                                        <div className="bg-gradient-to-br from-green-50 to-white dark:from-green-500/5 dark:to-[#0a0a0a] border border-green-100 dark:border-green-500/20 rounded-xl sm:rounded-2xl p-5 sm:p-6 hover:shadow-lg transition-shadow">
                                            <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
                                                <div className="w-11 h-11 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0 ring-4 ring-green-50 dark:ring-green-500/5">
                                                    <QrCode className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-green-600 dark:text-green-500" />
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
                                                    Busiest Sessions
                                                </span>
                                            </div>
                                            <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-green-600 dark:text-green-400 mb-2 sm:mb-2.5">
                                                {formatHour(peakHours.peakSessionHour)}
                                            </p>
                                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                                {formatNumber(peakHours.maxSessions)} sessions started
                                            </p>
                                        </div>
                                    </div>

                                    <MobileSection title="Hourly Activity Breakdown">
                                        <div className="space-y-5 sm:space-y-6">
                                            {peakHours.hourlyData.map((hour) => (
                                                <div key={hour.hour} className="space-y-3 sm:space-y-4 p-4 sm:p-5 bg-gray-50/50 dark:bg-[#111]/50 rounded-xl hover:bg-gray-100/50 dark:hover:bg-[#1a1a1a]/50 transition-colors border border-gray-100 dark:border-[#222]">
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                        <div className="flex items-center gap-2 bg-white dark:bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#222]">
                                                            <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                                                            <span className="text-sm sm:text-base font-bold text-black dark:text-white">
                                                                {formatHour(hour.hour)}
                                                            </span>
                                                        </div>
                                                        {hour.isPeakOrders && (
                                                            <span className="text-[10px] sm:text-xs bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold border border-blue-200 dark:border-blue-500/20 flex items-center gap-1">
                                                                <TrendingUp className="w-3 h-3" />
                                                                Peak Orders
                                                            </span>
                                                        )}
                                                        {hour.isPeakSessions && (
                                                            <span className="text-[10px] sm:text-xs bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 px-2.5 sm:px-3 py-1.5 rounded-lg font-bold border border-green-200 dark:border-green-500/20 flex items-center gap-1">
                                                                <TrendingUp className="w-3 h-3" />
                                                                Peak Sessions
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                                        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 sm:p-4 text-center border border-gray-200 dark:border-[#222] hover:border-blue-200 dark:hover:border-blue-500/20 transition-colors">
                                                            <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-1.5">
                                                                {formatNumber(hour.orders)}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                                                                Orders
                                                            </p>
                                                        </div>
                                                        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 sm:p-4 text-center border border-gray-200 dark:border-[#222] hover:border-green-200 dark:hover:border-green-500/20 transition-colors">
                                                            <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-1.5">
                                                                {formatNumber(hour.sessions)}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                                                                Sessions
                                                            </p>
                                                        </div>
                                                        <div className="bg-white dark:bg-[#0a0a0a] rounded-xl p-3 sm:p-4 text-center border border-gray-200 dark:border-[#222] hover:border-green-200 dark:hover:border-green-500/20 transition-colors">
                                                            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-500 mb-1.5">
                                                                {formatCurrency(hour.revenue, true)}
                                                            </p>
                                                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-semibold">
                                                                Revenue
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3 sm:space-y-3.5">
                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                                                                    <ShoppingCart className="w-3.5 h-3.5" />
                                                                    Orders Activity
                                                                </span>
                                                                <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400">
                                                                    {hour.ordersPercent.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-[#222] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-full transition-all duration-700 ease-out"
                                                                    style={{ width: `${hour.ordersPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div className="flex items-center justify-between mb-2">
                                                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1.5">
                                                                    <QrCode className="w-3.5 h-3.5" />
                                                                    Session Activity
                                                                </span>
                                                                <span className="text-xs sm:text-sm font-bold text-green-600 dark:text-green-400">
                                                                    {hour.sessionsPercent.toFixed(0)}%
                                                                </span>
                                                            </div>
                                                            <div className="h-2.5 sm:h-3 bg-gray-200 dark:bg-[#222] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-400 dark:to-green-500 rounded-full transition-all duration-700 ease-out"
                                                                    style={{ width: `${hour.sessionsPercent}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </MobileSection>
                                </>
                            )}
                        </div>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <div role="tabpanel" id="orders-panel" aria-labelledby="orders-tab">
                            <MobileSection title={`Recent Orders (${formatNumber(filteredOrders.length)})`}>
                                {isLoading && recentOrders.length === 0 ? (
                                    <LoadingContent text="Loading orders..." />
                                ) : recentOrders.length === 0 ? (
                                    <EmptyContent icon={ShoppingCart} text="No orders found" description="Orders will appear here when customers place them" />
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {recentOrders.map((order) => (
                                            <MobileOrderCard key={order.id} order={order} />
                                        ))}
                                    </div>
                                )}
                            </MobileSection>

                            <MobileSection title="Top Selling Items">
                                {isLoading && topItems.length === 0 ? (
                                    <LoadingContent text="Loading items..." />
                                ) : topItems.length === 0 ? (
                                    <EmptyContent icon={Package} text="No selling data yet" description="Top selling items will appear as orders are placed" />
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {topItems.map((item, index) => (
                                            <MobileTopItem key={item.id} item={item} rank={index + 1} />
                                        ))}
                                    </div>
                                )}
                            </MobileSection>
                        </div>
                    )}

                    {/* STAFF TAB */}
                    {activeTab === 'staff' && (
                        <div role="tabpanel" id="staff-panel" aria-labelledby="staff-tab">
                            <MobileSection title="Waiter Performance">
                                {sessionLoading && waitersPerf.length === 0 ? (
                                    <LoadingContent text="Loading waiters..." />
                                ) : waitersPerf.length === 0 ? (
                                    <EmptyContent icon={UserCheck} text="No waiter data yet" description="Waiter performance will show when they create sessions" />
                                ) : (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {waitersPerf.slice(0, 5).map((waiter) => (
                                            <MobileWaiterCard key={waiter._id} waiter={waiter} />
                                        ))}
                                    </div>
                                )}
                            </MobileSection>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast Notification */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// ===== HELPER COMPONENTS =====

function FilterPanel({ filters, setFilters, uniqueWaiters, uniqueTables, onApply, onClear, onClose }) {
    const [localFilters, setLocalFilters] = useState(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const handleApply = () => {
        setFilters(localFilters);
        onApply();
        onClose();
    };

    const handleClearAll = () => {
        const emptyFilters = {
            dateFrom: '',
            dateTo: '',
            status: [],
            waiter: [],
            table: [],
            minAmount: '',
            maxAmount: '',
            searchQuery: '',
        };
        setLocalFilters(emptyFilters);
        setFilters(emptyFilters);
        onClear();
    };

    const toggleArrayFilter = (key, value) => {
        setLocalFilters(prev => ({
            ...prev,
            [key]: prev[key].includes(value)
                ? prev[key].filter(item => item !== value)
                : [...prev[key], value]
        }));
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="filter-panel-title"
        >
            <div
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-3xl border-t sm:border border-gray-200 dark:border-[#222] max-h-[92vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222] p-5 sm:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3 sm:gap-3.5">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <Filter className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                        </div>
                        <div>
                            <h2 id="filter-panel-title" className="text-lg sm:text-xl font-bold text-black dark:text-white">
                                Advanced Filters
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Refine your dashboard data
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#111] text-gray-500 hover:text-black dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                        aria-label="Close filter panel"
                    >
                        <X className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-6 sm:space-y-7">
                    {/* Date Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Date Range
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                    From
                                </label>
                                <input
                                    type="date"
                                    value={localFilters.dateFrom}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    className="w-full min-h-[44px] h-11 sm:h-12 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                    To
                                </label>
                                <input
                                    type="date"
                                    value={localFilters.dateTo}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                    className="w-full min-h-[44px] h-11 sm:h-12 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Search
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Order ID, customer name..."
                                value={localFilters.searchQuery}
                                onChange={(e) => setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                                className="w-full min-h-[44px] h-11 sm:h-12 pl-11 pr-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        </div>
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                            Order Status
                        </label>
                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                            {['pending', 'preparing', 'served'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => toggleArrayFilter('status', status)}
                                    className={`min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black ${localFilters.status.includes(status)
                                        ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/25 focus:ring-blue-500'
                                        : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] focus:ring-gray-400'
                                        }`}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Amount Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                            <DollarSign className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Amount Range
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                    Min ($)
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.minAmount}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minAmount: e.target.value }))}
                                    className="w-full min-h-[44px] h-11 sm:h-12 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                                    Max ($)
                                </label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={localFilters.maxAmount}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
                                    className="w-full min-h-[44px] h-11 sm:h-12 px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Waiters */}
                    {uniqueWaiters.length > 0 && (
                        <div>
                            <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                                <UserCheck className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                Waiters
                            </label>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                {uniqueWaiters.map(waiter => (
                                    <button
                                        key={waiter.id}
                                        onClick={() => toggleArrayFilter('waiter', waiter.id)}
                                        className={`min-h-[44px] px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black ${localFilters.waiter.includes(waiter.id)
                                            ? 'bg-green-600 dark:bg-green-500 text-white shadow-lg shadow-green-500/25 focus:ring-green-500'
                                            : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] focus:ring-gray-400'
                                            }`}
                                    >
                                        {waiter.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tables */}
                    {uniqueTables.length > 0 && (
                        <div>
                            <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3 sm:mb-4">
                                <Table className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                Tables
                            </label>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                {uniqueTables.map(table => (
                                    <button
                                        key={table}
                                        onClick={() => toggleArrayFilter('table', table)}
                                        className={`min-h-[44px] min-w-[44px] px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black ${localFilters.table.includes(table)
                                            ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-lg shadow-purple-500/25 focus:ring-purple-500'
                                            : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] focus:ring-gray-400'
                                            }`}
                                    >
                                        {table}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222] p-5 sm:p-6 flex gap-3 sm:gap-4">
                    <button
                        onClick={handleClearAll}
                        className="flex-1 min-h-[44px] h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-black"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 min-h-[44px] h-11 sm:h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-98 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                    >
                        Apply Filters
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterBadge({ label, onRemove }) {
    return (
        <div className="inline-flex items-center gap-2 min-h-[36px] px-3 sm:px-3.5 py-2 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-200 dark:hover:bg-blue-500/20 transition-colors group">
            <span className="truncate max-w-[150px] sm:max-w-none">{label}</span>
            <button
                onClick={onRemove}
                className="flex-shrink-0 hover:bg-blue-300 dark:hover:bg-blue-500/30 rounded-md p-1 transition-colors active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-black min-w-[24px] min-h-[24px] flex items-center justify-center"
                aria-label={`Remove ${label} filter`}
            >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
        </div>
    );
}

function MobileStatCard({ icon: Icon, label, value, change, trend, subtitle }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-5 hover:shadow-xl dark:hover:shadow-2xl dark:hover:shadow-white/5 hover:border-gray-300 dark:hover:border-[#333] transition-all duration-300 group">
            <div className="flex items-center justify-between mb-3 sm:mb-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-gray-100 to-gray-50 dark:from-[#111] dark:to-[#0a0a0a] rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300 border border-gray-200 dark:border-[#222]">
                    <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-gray-700 dark:text-gray-300" />
                </div>
                {change && (
                    <div className={`flex items-center gap-1 text-xs sm:text-sm font-bold px-2 py-1 rounded-lg ${trend === 'up'
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500'
                        : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500'
                        }`}>
                        {trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        {change}
                    </div>
                )}
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1.5 sm:mb-2 truncate">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{subtitle || label}</p>
        </div>
    );
}

function MobileSection({ title, children }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all duration-300">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-[#222] bg-gradient-to-r from-gray-50/50 to-transparent dark:from-[#111]/50">
                <h3 className="text-base sm:text-lg font-bold text-black dark:text-white truncate">{title}</h3>
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}

function QuickMetric({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3 sm:gap-3.5 p-4 sm:p-4.5 bg-gradient-to-br from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white dark:bg-[#0a0a0a] rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-[#222] group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 sm:mb-1.5 font-medium truncate">{label}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-black dark:text-white truncate">{value}</p>
            </div>
        </div>
    );
}

function ResourceCard({ icon: Icon, label, value }) {
    return (
        <div className="p-4 sm:p-5 bg-gradient-to-br from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white dark:bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-3 sm:mb-4 border border-gray-200 dark:border-[#222] group-hover:scale-110 transition-transform duration-300">
                <Icon className="w-5.5 h-5.5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
            </div>
            <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black dark:text-white mb-1.5 sm:mb-2">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        </div>
    );
}

function MobileOrderCard({ order }) {
    const statusColors = {
        served: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20',
        preparing: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-200 dark:border-blue-500/20',
        pending: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20',
    };

    return (
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-4.5 bg-gradient-to-r from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1.5 sm:mb-2">
                    <p className="text-sm sm:text-base font-bold text-black dark:text-white truncate">{order.id}</p>
                    <span className={`text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${statusColors[order.status] || statusColors.pending}`}>
                        {order.statusLabel}
                    </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" />
                    {order.customer}
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <Clock className="w-3.5 h-3.5" />
                    {order.time}
                </p>
            </div>
            <p className="text-lg sm:text-xl font-bold text-black dark:text-white flex-shrink-0">{order.amount}</p>
        </div>
    );
}

function MobileTopItem({ item, rank }) {
    const rankColors = {
        1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/25',
        2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-500/25',
        3: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25',
    };

    return (
        <div className="flex items-center gap-3 sm:gap-4 p-4 sm:p-4.5 bg-gradient-to-r from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className={`min-w-[32px] w-8 h-8 sm:w-9 sm:h-9 ${rankColors[rank] || 'bg-gray-200 dark:bg-[#222] text-gray-700 dark:text-gray-300'} rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-base group-hover:scale-110 transition-transform duration-300`}>
                #{rank}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-black dark:text-white truncate mb-1">{item.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <ShoppingCart className="w-3.5 h-3.5" />
                    {formatNumber(item.orders)} orders
                    <span className="text-gray-300 dark:text-gray-700">•</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                    {item.growth}
                </p>
            </div>
            <p className="text-base sm:text-lg font-bold text-green-600 dark:text-green-500 flex-shrink-0">{item.revenue}</p>
        </div>
    );
}

function MobileSessionCard({ session }) {
    return (
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-4.5 bg-gradient-to-r from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-500/10 dark:to-transparent border border-green-200 dark:border-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Table className="w-6 h-6 sm:w-6.5 sm:h-6.5 text-green-600 dark:text-green-500" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-black dark:text-white mb-1 truncate">
                        Table {session.tableNumber}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />
                        {session.waiter}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
                <Clock className="w-3.5 h-3.5" />
                {session.createdAt}
            </div>
        </div>
    );
}

function MobileTableCard({ table, rank }) {
    const rankColors = {
        1: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/25',
        2: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-500/25',
        3: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/25',
    };

    return (
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-4.5 bg-gradient-to-r from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className={`min-w-[32px] w-8 h-8 sm:w-9 sm:h-9 ${rankColors[rank] || 'bg-gray-200 dark:bg-[#222] text-gray-700 dark:text-gray-300'} rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm sm:text-base group-hover:scale-110 transition-transform duration-300`}>
                    #{rank}
                </div>
                <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-black dark:text-white truncate">Table {table._id}</p>
                    <p className="text-xs sm:text-sm text-green-600 dark:text-green-500 font-medium">
                        {formatNumber(table.activeCount || 0)} active
                    </p>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-2xl sm:text-3xl font-bold text-black dark:text-white">{formatNumber(table.count || 0)}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">sessions</p>
            </div>
        </div>
    );
}

function MobileWaiterCard({ waiter }) {
    return (
        <div className="flex items-center justify-between gap-3 sm:gap-4 p-4 sm:p-4.5 bg-gradient-to-r from-gray-50 to-white dark:from-[#111] dark:to-[#0a0a0a] rounded-xl hover:from-gray-100 hover:to-gray-50 dark:hover:from-[#1a1a1a] dark:hover:to-[#111] transition-all duration-300 border border-gray-200 dark:border-[#222] group">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 sm:w-13 sm:h-13 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/10 dark:to-transparent border border-blue-200 dark:border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">
                        {waiter.name?.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-sm sm:text-base font-bold text-black dark:text-white mb-1 truncate">{waiter.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{waiter.email}</p>
                </div>
            </div>
            <div className="flex gap-5 sm:gap-6 flex-shrink-0">
                <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-black dark:text-white">{formatNumber(waiter.totalSessions || 0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Total</p>
                </div>
                <div className="text-center">
                    <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-500">{formatNumber(waiter.activeSessions || 0)}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">Active</p>
                </div>
            </div>
        </div>
    );
}

function LoadingContent({ text }) {
    return (
        <div className="py-12 sm:py-14 text-center">
            <Loader2 className="w-8 h-8 sm:w-9 sm:h-9 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">{text}</p>
        </div>
    );
}

function EmptyContent({ icon: Icon, text, description }) {
    return (
        <div className="py-12 sm:py-14 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 border border-gray-200 dark:border-[#222]">
                <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-600 dark:text-gray-400 mb-2">{text}</p>
            {description && (
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 max-w-xs mx-auto">{description}</p>
            )}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                <div className="space-y-4 sm:space-y-6">
                    <div className="h-9 sm:h-10 bg-gray-200 dark:bg-[#111] rounded-xl w-32 sm:w-40 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-5 animate-pulse">
                                <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-200 dark:bg-[#111] rounded-xl mb-3" />
                                <div className="h-8 sm:h-9 bg-gray-200 dark:bg-[#111] rounded-lg w-16 sm:w-20 mb-2" />
                                <div className="h-4 bg-gray-200 dark:bg-[#111] rounded w-20 sm:w-24" />
                            </div>
                        ))}
                    </div>
                    <div className="flex items-center justify-center py-20">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 text-blue-500 dark:text-blue-400 animate-spin mx-auto mb-4" />
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Loading Dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Toast({ message, type, onClose }) {
    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500',
    };

    const typeIcons = {
        success: CheckCircle,
        error: AlertCircle,
        warning: AlertTriangle,
        info: Activity,
    };

    const Icon = typeIcons[type] || CheckCircle;

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 sm:top-auto sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0 w-[calc(100%-24px)] sm:w-96 z-[60] animate-slide-down sm:animate-slide-up" role="alert" aria-live="polite">
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-4.5 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${typeStyles[type] || typeStyles.success}`}>
                        <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                    </div>
                    <p className="flex-1 text-sm sm:text-base font-semibold text-black dark:text-white">{message}</p>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#111] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-black"
                        aria-label="Close notification"
                    >
                        <X className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// ===== UTILITY FUNCTIONS =====

function formatTimeAgo(date) {
    if (!date) return 'Just now';
    try {
        const now = new Date();
        const past = new Date(date);
        const diffInSeconds = Math.floor((now - past) / 1000);
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch {
        return 'Just now';
    }
}

function formatHour(hour) {
    if (hour === null || hour === undefined) return 'N/A';
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
}

function formatCurrency(value, compact = false) {
    const num = parseFloat(value) || 0;
    if (compact && num >= 1000) {
        return `$${(num / 1000).toFixed(1)}k`;
    }
    return `$${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function formatNumber(value) {
    const num = parseInt(value) || 0;
    return num.toLocaleString('en-US');
}