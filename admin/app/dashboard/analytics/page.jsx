'use client';

import { useEffect, useState, useMemo } from 'react';
import { useOrder } from '../../../context/OrderContext';
import { useEmployee } from '../../../context/employeeContext';
import { useMenu } from '../../../context/menuContext';
import {
    LineChart, Line, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Users,
    ChefHat,
    RefreshCw,
    Loader2,
    Filter,
    X,
    ArrowUp,
    ArrowDown,
    Calendar,
    BarChart3,
    Package,
    Activity,
    Search,
    Tag,
} from 'lucide-react';

export default function AnalyticsPage() {
    const {
        dashboardStats,
        todaySales,
        topSellingItems,
        salesAnalytics,
        isLoading: orderLoading,
        refreshAllData: refreshOrders,
        getSalesAnalytics,
        getStatsByDateRange,
    } = useOrder();

    const {
        employees,
        isLoading: employeeLoading,
        getAllEmployees,
    } = useEmployee();

    const {
        menus,
        isLoading: menuLoading,
        getAllMenus,
    } = useMenu();

    const [showFilterModal, setShowFilterModal] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [toast, setToast] = useState(null);
    const [previousPeriodData, setPreviousPeriodData] = useState(null);

    const [filters, setFilters] = useState({
        dateFrom: '',
        dateTo: '',
        categories: [],
        minRevenue: '',
        maxRevenue: '',
        minOrders: '',
        maxOrders: '',
        searchQuery: '',
        orderStatus: [],
        quickFilter: 'all',
    });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchPreviousPeriodData = async () => {
        try {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            const yesterdayStart = yesterday.toISOString().split('T')[0];
            const yesterdayEnd = yesterday.toISOString().split('T')[0];

            const stats = await getStatsByDateRange(yesterdayStart, yesterdayEnd);

            if (stats) {
                setPreviousPeriodData({
                    revenue: stats.totalRevenue || 0,
                    orders: stats.totalOrders || 0,
                });
            }
        } catch (error) {
            console.error('Error fetching previous period data:', error);
        }
    };

    useEffect(() => {
        refreshOrders();
        getAllEmployees();
        getAllMenus();
        fetchPreviousPeriodData();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const calculateGrowth = (current, previous) => {
        if (!previous || previous === 0) {
            return current > 0 ? '+100%' : '+0%';
        }
        const growth = ((current - previous) / previous) * 100;
        const sign = growth >= 0 ? '+' : '';
        return `${sign}${growth.toFixed(1)}%`;
    };

    const getTrend = (growthString) => {
        return growthString.startsWith('-') ? 'down' : 'up';
    };

    const stats = useMemo(() => {
        const todayOrdersCount = todaySales?.totalOrders || 0;
        const todayRevenueAmount = todaySales?.totalRevenue || 0;
        const totalStaffCount = employees.length;
        const totalMenuCount = menus.length;

        let revenueGrowth = '+0%';
        let ordersGrowth = '+0%';

        if (dashboardStats?.revenueGrowth) {
            revenueGrowth = dashboardStats.revenueGrowth;
        } else if (dashboardStats?.last7Days && dashboardStats.last7Days.length >= 2) {
            const sortedDays = [...dashboardStats.last7Days].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );
            const today = sortedDays[0];
            const yesterday = sortedDays[1];

            if (today && yesterday) {
                revenueGrowth = calculateGrowth(
                    today.totalRevenue || 0,
                    yesterday.totalRevenue || 0
                );
                ordersGrowth = calculateGrowth(
                    today.totalOrders || 0,
                    yesterday.totalOrders || 0
                );
            }
        } else if (previousPeriodData) {
            revenueGrowth = calculateGrowth(todayRevenueAmount, previousPeriodData.revenue);
            ordersGrowth = calculateGrowth(todayOrdersCount, previousPeriodData.orders);
        }

        if (dashboardStats?.ordersGrowth) {
            ordersGrowth = dashboardStats.ordersGrowth;
        }

        return {
            todayOrders: todayOrdersCount,
            todayRevenue: todayRevenueAmount,
            totalStaff: totalStaffCount,
            totalMenu: totalMenuCount,
            avgOrderValue: todayOrdersCount > 0
                ? (todayRevenueAmount / todayOrdersCount)
                : 0,
            completionRate: dashboardStats?.completionRate || 0,
            revenueGrowth,
            ordersGrowth,
            revenueTrend: getTrend(revenueGrowth),
            ordersTrend: getTrend(ordersGrowth),
        };
    }, [todaySales, employees, menus, dashboardStats, previousPeriodData]);

    const uniqueCategories = useMemo(() => {
        const categories = new Set();
        menus.forEach(menu => {
            if (menu.category) categories.add(menu.category);
        });
        topSellingItems?.forEach(item => {
            if (item.category) categories.add(item.category);
        });
        return Array.from(categories).sort();
    }, [menus, topSellingItems]);

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.dateFrom) count++;
        if (filters.dateTo) count++;
        if (filters.categories.length > 0) count++;
        if (filters.minRevenue) count++;
        if (filters.maxRevenue) count++;
        if (filters.minOrders) count++;
        if (filters.maxOrders) count++;
        if (filters.searchQuery) count++;
        if (filters.orderStatus.length > 0) count++;
        if (filters.quickFilter !== 'all') count++;
        return count;
    };

    const clearFilters = () => {
        setFilters({
            dateFrom: '',
            dateTo: '',
            categories: [],
            minRevenue: '',
            maxRevenue: '',
            minOrders: '',
            maxOrders: '',
            searchQuery: '',
            orderStatus: [],
            quickFilter: 'all',
        });
        refreshOrders();
        showToast('Filters cleared');
    };

    const applyQuickFilter = async (preset) => {
        const today = new Date();
        let start, end;

        switch (preset) {
            case 'today':
                start = end = today.toISOString().split('T')[0];
                break;
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                start = end = yesterday.toISOString().split('T')[0];
                break;
            case 'last7days':
                end = today.toISOString().split('T')[0];
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                start = sevenDaysAgo.toISOString().split('T')[0];
                break;
            case 'last30days':
                end = today.toISOString().split('T')[0];
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                start = thirtyDaysAgo.toISOString().split('T')[0];
                break;
            case 'all':
                setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '', quickFilter: 'all' }));
                await refreshOrders();
                showToast('Showing all data');
                return;
            default:
                return;
        }

        setFilters(prev => ({ ...prev, dateFrom: start, dateTo: end, quickFilter: preset }));
        await getSalesAnalytics(start, end);
        showToast('Filter applied');
    };

    const applyCustomDateFilter = async () => {
        if (!filters.dateFrom || !filters.dateTo) {
            showToast('Please select both dates', 'error');
            return;
        }
        if (new Date(filters.dateFrom) > new Date(filters.dateTo)) {
            showToast('Start date must be before end date', 'error');
            return;
        }
        setFilters(prev => ({ ...prev, quickFilter: 'custom' }));
        await getSalesAnalytics(filters.dateFrom, filters.dateTo);
        setShowFilterModal(false);
        showToast('Custom filter applied');
    };

    const filteredTopItems = useMemo(() => {
        if (!topSellingItems || !Array.isArray(topSellingItems)) return [];

        let filtered = [...topSellingItems];

        if (filters.categories.length > 0) {
            filtered = filtered.filter(item =>
                filters.categories.includes(item.category)
            );
        }

        if (filters.minRevenue) {
            filtered = filtered.filter(item =>
                parseFloat(item.totalRevenue || 0) >= parseFloat(filters.minRevenue)
            );
        }
        if (filters.maxRevenue) {
            filtered = filtered.filter(item =>
                parseFloat(item.totalRevenue || 0) <= parseFloat(filters.maxRevenue)
            );
        }

        if (filters.minOrders) {
            filtered = filtered.filter(item =>
                parseInt(item.totalQuantity || item.quantity || 0) >= parseInt(filters.minOrders)
            );
        }
        if (filters.maxOrders) {
            filtered = filtered.filter(item =>
                parseInt(item.totalQuantity || item.quantity || 0) <= parseInt(filters.maxOrders)
            );
        }

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.name?.toLowerCase().includes(query) ||
                item.category?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [topSellingItems, filters]);

    const revenueChartData = useMemo(() => {
        const data = salesAnalytics && salesAnalytics.length > 0
            ? salesAnalytics
            : dashboardStats?.last7Days || [];

        return data.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            revenue: day.totalRevenue || 0,
        }));
    }, [salesAnalytics, dashboardStats]);

    const ordersChartData = useMemo(() => {
        const data = salesAnalytics && salesAnalytics.length > 0
            ? salesAnalytics
            : dashboardStats?.last7Days || [];

        return data.map(day => ({
            date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            orders: day.totalOrders || day.orders || day.orderCount || 0,
        }));
    }, [salesAnalytics, dashboardStats]);

    const topItemsChartData = useMemo(() => {
        return filteredTopItems.slice(0, 5).map(item => ({
            name: item.name.length > 12 ? item.name.substring(0, 12) + '...' : item.name,
            fullName: item.name,
            value: item.totalRevenue || 0,
        }));
    }, [filteredTopItems]);

    const categoryData = useMemo(() => {
        const categories = {};
        filteredTopItems.forEach(item => {
            const category = item.category || 'Other';
            categories[category] = (categories[category] || 0) + (item.totalRevenue || 0);
        });
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
    }, [filteredTopItems]);

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

    const refreshAll = async () => {
        await Promise.all([
            refreshOrders(),
            getAllEmployees(),
            getAllMenus(),
            fetchPreviousPeriodData(),
        ]);
        showToast('Data refreshed');
    };

    const isLoading = orderLoading || employeeLoading || menuLoading;

    if (isLoading && !dashboardStats && employees.length === 0 && menus.length === 0) {
        return <LoadingState />;
    }

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                {/* ===== HEADER ===== */}
                <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1.5 truncate">
                                Analytics
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {filters.quickFilter === 'all' ? 'All Time Data' :
                                    filters.quickFilter === 'custom' ? 'Custom Date Range' :
                                        filters.quickFilter === 'today' ? "Today's Analytics" :
                                            filters.quickFilter === 'yesterday' ? 'Yesterday' :
                                                filters.quickFilter === 'last7days' ? 'Last 7 Days' :
                                                    filters.quickFilter === 'last30days' ? 'Last 30 Days' : 'All Time Data'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowFilterModal(true)}
                                className="relative flex items-center justify-center gap-2 h-10 sm:h-11 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a] active:scale-95 rounded-xl text-sm font-semibold transition-all shadow-sm"
                            >
                                <Filter className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                <span className="hidden xs:inline">Filters</span>
                                {getActiveFilterCount() > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-blue-600 dark:bg-blue-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5 shadow-lg">
                                        {getActiveFilterCount()}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={refreshAll}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 h-10 sm:h-11 px-3 sm:px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden xs:inline">Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Quick Filter Buttons */}
                    <div className="w-full overflow-x-auto scrollbar-hide -mx-3 px-3 sm:mx-0 sm:px-0">
                        <div className="flex gap-2 min-w-max sm:min-w-0">
                            {[
                                { value: 'all', label: 'All Time' },
                                { value: 'today', label: 'Today' },
                                { value: 'last7days', label: '7 Days' },
                                { value: 'last30days', label: '30 Days' },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => applyQuickFilter(option.value)}
                                    className={`flex-shrink-0 h-10 px-5 sm:px-6 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-95 ${
                                        filters.quickFilter === option.value
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                            : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333]'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ===== ACTIVE FILTERS ===== */}
                {getActiveFilterCount() > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
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
                        {filters.categories.map(category => (
                            <FilterBadge
                                key={category}
                                label={`Category: ${category}`}
                                onRemove={() => setFilters(prev => ({
                                    ...prev,
                                    categories: prev.categories.filter(c => c !== category)
                                }))}
                            />
                        ))}
                        {(filters.minRevenue || filters.maxRevenue) && (
                            <FilterBadge
                                label={`Revenue: $${filters.minRevenue || '0'} - $${filters.maxRevenue || '∞'}`}
                                onRemove={() => setFilters(prev => ({ ...prev, minRevenue: '', maxRevenue: '' }))}
                            />
                        )}
                        {(filters.minOrders || filters.maxOrders) && (
                            <FilterBadge
                                label={`Orders: ${filters.minOrders || '0'} - ${filters.maxOrders || '∞'}`}
                                onRemove={() => setFilters(prev => ({ ...prev, minOrders: '', maxOrders: '' }))}
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
                            className="text-xs text-red-600 dark:text-red-500 font-bold hover:underline underline-offset-2 px-2 py-1"
                        >
                            Clear All
                        </button>
                    </div>
                )}

                {/* ===== KEY STATS ===== */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <MobileStatCard
                        icon={DollarSign}
                        label="Revenue"
                        value={`$${stats.todayRevenue.toFixed(0)}`}
                        change={stats.revenueGrowth}
                        trend={stats.revenueTrend}
                    />
                    <MobileStatCard
                        icon={ShoppingBag}
                        label="Orders"
                        value={stats.todayOrders.toString()}
                        change={stats.ordersGrowth}
                        trend={stats.ordersTrend}
                    />
                    <MobileStatCard
                        icon={Users}
                        label="Staff"
                        value={stats.totalStaff.toString()}
                        subtitle={`${employees.filter(e => e.isActive).length} active`}
                    />
                    <MobileStatCard
                        icon={ChefHat}
                        label="Menu Items"
                        value={stats.totalMenu.toString()}
                        subtitle={`${menus.filter(m => m.status === 'approved').length} approved`}
                    />
                </div>

                {/* ===== TABS ===== */}
                <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
                    <div className="w-full overflow-x-auto scrollbar-hide px-3 sm:px-0">
                        <div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0 border-b border-gray-200 dark:border-[#222]">
                            {[
                                { id: 'overview', label: 'Overview', icon: BarChart3 },
                                { id: 'revenue', label: 'Revenue', icon: DollarSign },
                                { id: 'orders', label: 'Orders', icon: ShoppingBag },
                                { id: 'items', label: 'Items', icon: Package },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                                        activeTab === tab.id
                                            ? 'border-black dark:border-white text-black dark:text-white'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
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
                        <>
                            <MobileSection title="Quick Metrics">
                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                                    <QuickMetric
                                        label="Avg. Order"
                                        value={`$${stats.avgOrderValue.toFixed(2)}`}
                                        icon={DollarSign}
                                    />
                                    <QuickMetric
                                        label="Completion"
                                        value={`${stats.completionRate.toFixed(1)}%`}
                                        icon={Activity}
                                    />
                                </div>
                            </MobileSection>

                            <MobileChartCard title="Revenue Trend">
                                {revenueChartData.length > 0 ? (
                                    <div className="w-full" style={{ height: '240px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-[#222]" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={40}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    formatter={(value) => ['$' + value.toFixed(2), 'Revenue']}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3b82f6', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                    fill="url(#gradient)"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={DollarSign} message="No revenue data available" />
                                )}
                            </MobileChartCard>

                            <MobileSection title={`Top Selling Items (${filteredTopItems.length})`}>
                                {filteredTopItems.length > 0 ? (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {filteredTopItems.slice(0, 5).map((item, index) => (
                                            <TopItemRow
                                                key={item._id}
                                                item={item}
                                                rank={index + 1}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={Package} message="No items found" />
                                )}
                            </MobileSection>
                        </>
                    )}

                    {/* REVENUE TAB */}
                    {activeTab === 'revenue' && (
                        <>
                            <MobileChartCard title="Revenue Trend">
                                {revenueChartData.length > 0 ? (
                                    <div className="w-full" style={{ height: '280px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={revenueChartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                                <defs>
                                                    <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-[#222]" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={45}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    formatter={(value) => ['$' + value.toFixed(2), 'Revenue']}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="revenue"
                                                    stroke="#3b82f6"
                                                    strokeWidth={3}
                                                    dot={{ fill: '#3b82f6', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                    fill="url(#gradient)"
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={DollarSign} message="No revenue data available" />
                                )}
                            </MobileChartCard>

                            <MobileSection title="Revenue Breakdown">
                                {revenueChartData.length > 0 ? (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {revenueChartData.slice(0, 7).map((day, index) => (
                                            <div key={index} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-[#111] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                                                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">{day.date}</span>
                                                <span className="text-sm sm:text-base font-bold text-black dark:text-white">
                                                    ${day.revenue.toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={DollarSign} message="No revenue breakdown available" />
                                )}
                            </MobileSection>
                        </>
                    )}

                    {/* ORDERS TAB */}
                    {activeTab === 'orders' && (
                        <>
                            <MobileChartCard title="Orders Trend">
                                {ordersChartData.length > 0 ? (
                                    <div className="w-full" style={{ height: '280px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ordersChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-[#222]" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={35}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    formatter={(value) => [value, 'Orders']}
                                                    cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                                                />
                                                <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={ShoppingBag} message="No order data available" subtitle="Try changing the date filter" />
                                )}
                            </MobileChartCard>

                            <MobileSection title="Orders Breakdown">
                                {ordersChartData.length > 0 ? (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {ordersChartData.slice(0, 7).map((day, index) => (
                                            <div key={index} className="flex items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-[#111] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                                                <span className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium">{day.date}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm sm:text-base font-bold text-black dark:text-white">
                                                        {day.orders} orders
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={ShoppingBag} message="No orders found" />
                                )}
                            </MobileSection>
                        </>
                    )}

                    {/* ITEMS TAB */}
                    {activeTab === 'items' && (
                        <>
                            <MobileChartCard title="Top Items by Revenue">
                                {topItemsChartData.length > 0 ? (
                                    <div className="w-full" style={{ height: '280px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topItemsChartData} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-[#222]" horizontal={false} />
                                                <XAxis
                                                    type="number"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    stroke="#9ca3af"
                                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    width={100}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    formatter={(value) => ['$' + value.toFixed(2), 'Revenue']}
                                                    labelFormatter={(value, props) => props[0]?.payload?.fullName || value}
                                                    cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                                                />
                                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <EmptyState icon={Package} message="No top selling items" />
                                )}
                            </MobileChartCard>

                            {categoryData.length > 0 && (
                                <MobileChartCard title="Revenue by Category">
                                    <div className="w-full" style={{ height: '240px' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={categoryData}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={3}
                                                    dataKey="value"
                                                >
                                                    {categoryData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#fff',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        padding: '8px 12px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                                    }}
                                                    formatter={(value) => '$' + value.toFixed(2)}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
                                        {categoryData.map((cat, index) => (
                                            <div key={cat.name} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#111] rounded-lg">
                                                <div
                                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                />
                                                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium truncate">{cat.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </MobileChartCard>
                            )}

                            <MobileSection title={`All Items (${filteredTopItems.length})`}>
                                {filteredTopItems.length > 0 ? (
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {filteredTopItems.map((item, index) => (
                                            <TopItemRow
                                                key={item._id}
                                                item={item}
                                                rank={index + 1}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState icon={Package} message="No items found" subtitle="Try adjusting your filters" />
                                )}
                            </MobileSection>
                        </>
                    )}
                </div>
            </div>

            {/* Filter Modal */}
            {showFilterModal && (
                <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    uniqueCategories={uniqueCategories}
                    onApplyQuickFilter={applyQuickFilter}
                    onApplyCustomDate={applyCustomDateFilter}
                    onClear={clearFilters}
                    onClose={() => setShowFilterModal(false)}
                />
            )}

            {/* Toast */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// ============================================================================
// 🔥 COMPONENTS
// ============================================================================

function FilterPanel({ filters, setFilters, uniqueCategories, onApplyQuickFilter, onApplyCustomDate, onClear, onClose }) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 dark:border-[#222] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222] p-4 sm:p-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-100 dark:bg-[#111] rounded-xl flex items-center justify-center">
                            <Filter className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-black dark:text-white" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">Advanced Filters</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#111] text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-5 sm:space-y-6">
                    {/* Quick Date Filters */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                            <Calendar className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Quick Date Filters
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {[
                                { value: 'all', label: 'All Time' },
                                { value: 'today', label: 'Today' },
                                { value: 'yesterday', label: 'Yesterday' },
                                { value: 'last7days', label: '7 Days' },
                                { value: 'last30days', label: '30 Days' },
                            ].map((preset) => (
                                <button
                                    key={preset.value}
                                    onClick={() => {
                                        onApplyQuickFilter(preset.value);
                                        onClose();
                                    }}
                                    className={`h-11 sm:h-12 px-3 rounded-xl text-sm sm:text-base font-semibold transition-all active:scale-95 ${
                                        filters.quickFilter === preset.value
                                            ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                            : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333]'
                                    }`}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-[#222]" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white dark:bg-[#0a0a0a] text-xs sm:text-sm text-gray-400 font-medium">Custom Range</span>
                        </div>
                    </div>

                    {/* Custom Date Range */}
                    <div>
                        <label className="block text-sm sm:text-base font-bold text-black dark:text-white mb-3">Date Range</label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">From</label>
                                <input
                                    type="date"
                                    value={localFilters.dateFrom}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">To</label>
                                <input
                                    type="date"
                                    value={localFilters.dateTo}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        {localFilters.dateFrom && localFilters.dateTo && (
                            <button
                                onClick={() => {
                                    onApplyCustomDate();
                                    onClose();
                                }}
                                className="w-full mt-3 h-11 sm:h-12 bg-blue-600 dark:bg-blue-500 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-98 transition-all shadow-lg"
                            >
                                Apply Date Range
                            </button>
                        )}
                    </div>

                    {/* Search */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                            <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Search Items
                        </label>
                        <input
                            type="text"
                            placeholder="Item name or category..."
                            value={localFilters.searchQuery}
                            onChange={(e) => setLocalFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                            className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Categories */}
                    {uniqueCategories.length > 0 && (
                        <div>
                            <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                                <Tag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                Categories
                            </label>
                            <div className="flex flex-wrap gap-2 sm:gap-2.5">
                                {uniqueCategories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => toggleArrayFilter('categories', category)}
                                        className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 ${
                                            localFilters.categories.includes(category)
                                                ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333]'
                                        }`}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Revenue Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                            <DollarSign className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Revenue Range
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Min ($)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.minRevenue}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minRevenue: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Max ($)</label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={localFilters.maxRevenue}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxRevenue: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Orders Range */}
                    <div>
                        <label className="flex items-center gap-2 text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                            <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                            Orders Range
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Min</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={localFilters.minOrders}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minOrders: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">Max</label>
                                <input
                                    type="number"
                                    placeholder="∞"
                                    value={localFilters.maxOrders}
                                    onChange={(e) => setLocalFilters(prev => ({ ...prev, maxOrders: e.target.value }))}
                                    className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222] p-4 sm:p-5 flex gap-3 sm:gap-4">
                    <button
                        onClick={() => {
                            setLocalFilters({
                                dateFrom: '',
                                dateTo: '',
                                categories: [],
                                minRevenue: '',
                                maxRevenue: '',
                                minOrders: '',
                                maxOrders: '',
                                searchQuery: '',
                                orderStatus: [],
                                quickFilter: 'all',
                            });
                            onClear();
                            onClose();
                        }}
                        className="flex-1 h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222]"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={handleApply}
                        className="flex-1 h-11 sm:h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-98 transition-all shadow-lg"
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
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold border border-blue-200 dark:border-blue-500/20">
            <span className="truncate max-w-[150px] sm:max-w-none">{label}</span>
            <button
                onClick={onRemove}
                className="flex-shrink-0 hover:bg-blue-200 dark:hover:bg-blue-500/20 rounded-md p-0.5 transition-colors active:scale-95"
            >
                <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
        </div>
    );
}

function MobileStatCard({ icon: Icon, label, value, change, trend, subtitle }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-100 dark:bg-[#111] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5 text-gray-700 dark:text-gray-300" />
                </div>
                {change && (
                    <div className={`flex items-center gap-0.5 text-xs sm:text-sm font-bold ${
                        trend === 'up' ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'
                    }`}>
                        {trend === 'up' ? <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                        {change}
                    </div>
                )}
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1 truncate">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{subtitle || label}</p>
        </div>
    );
}

function MobileSection({ title, children }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-200 dark:border-[#222] bg-gray-50/50 dark:bg-[#111]/50">
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate">{title}</h3>
            </div>
            <div className="p-4 sm:p-5">{children}</div>
        </div>
    );
}

function MobileChartCard({ title, children }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-4 sm:mb-5">{title}</h3>
            {children}
        </div>
    );
}

function QuickMetric({ label, value, icon: Icon }) {
    return (
        <div className="flex items-center gap-2.5 sm:gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-[#111] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 font-medium">{label}</p>
                <p className="text-base sm:text-lg lg:text-xl font-bold text-black dark:text-white truncate">{value}</p>
            </div>
        </div>
    );
}

function TopItemRow({ item, rank }) {
    return (
        <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-[#111] rounded-xl hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-200 dark:bg-[#222] rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300">#{rank}</span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-black dark:text-white truncate mb-0.5 sm:mb-1">{item.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {item.totalQuantity || item.quantity || 0} sold • {item.category || 'Other'}
                </p>
            </div>
            <p className="text-sm sm:text-base font-bold text-black dark:text-white flex-shrink-0">${item.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
    );
}

function EmptyState({ icon: Icon, message, subtitle }) {
    return (
        <div className="h-48 sm:h-56 flex flex-col items-center justify-center text-gray-400 dark:text-gray-600 px-4">
            <Icon className="w-12 h-12 sm:w-14 sm:h-14 mb-3 opacity-50" />
            <p className="text-sm sm:text-base font-semibold text-center">{message}</p>
            {subtitle && <p className="text-xs sm:text-sm mt-1.5 text-center">{subtitle}</p>}
        </div>
    );
}

function Toast({ message, type, onClose }) {
    return (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[60] animate-slide-up">
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl px-4 py-3.5 sm:py-4 shadow-2xl">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-1 h-10 sm:h-12 rounded-full flex-shrink-0 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <p className="flex-1 text-sm sm:text-base font-semibold text-black dark:text-white">{message}</p>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#111] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                    >
                        <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

function LoadingState() {
    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
                <div className="space-y-4 sm:space-y-6">
                    <div className="h-8 sm:h-10 bg-gray-200 dark:bg-[#111] rounded-xl w-32 sm:w-40 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-5 animate-pulse">
                                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-200 dark:bg-[#111] rounded-xl mb-3" />
                                <div className="h-7 sm:h-8 bg-gray-200 dark:bg-[#111] rounded-lg w-16 sm:w-20 mb-2" />
                                <div className="h-3 sm:h-4 bg-gray-200 dark:bg-[#111] rounded w-20 sm:w-24" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}