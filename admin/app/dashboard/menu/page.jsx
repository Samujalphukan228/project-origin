'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useMenu } from '../../../context/menuContext';
import {
    Plus, Search, MoreVertical, Edit2, Trash2, CheckCircle, XCircle,
    Grid3x3, List, Image as ImageIcon, X, Upload, DollarSign,
    Clock, AlertCircle, Loader2, Package, Check, ChevronLeft, ChevronRight,
    Star, Filter, Tag
} from 'lucide-react';

export default function MenuPage() {
    const { 
        menus, 
        isLoading, 
        error, 
        getAllMenus, 
        addMenu, 
        updateMenu, 
        deleteMenu, 
        approveMenu, 
        rejectMenu, 
        clearError 
    } = useMenu();
    
    // State
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [modals, setModals] = useState({ add: false, edit: false, delete: false, reject: false });
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [toast, setToast] = useState(null);
    const [filters, setFilters] = useState({
        category: [],
        priceRange: { min: '', max: '' },
        bestseller: null,
    });
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => { 
        getAllMenus(); 
    }, [getAllMenus]);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = new Set();
        menus.forEach(menu => {
            if (menu.category) cats.add(menu.category);
        });
        return Array.from(cats).sort();
    }, [menus]);

    // Filtered menus
    const filteredMenus = useMemo(() => {
        return menus.filter(menu => {
            // Search filter
            const matchesSearch = menu.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                menu.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                menu.category?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // Tab filter
            const matchesTab = activeTab === 'all' || menu.status === activeTab;
            
            // Category filter
            const matchesCategory = filters.category.length === 0 || 
                                   filters.category.includes(menu.category);
            
            // Price filter
            const price = parseFloat(menu.price);
            const matchesMinPrice = !filters.priceRange.min || 
                                   price >= parseFloat(filters.priceRange.min);
            const matchesMaxPrice = !filters.priceRange.max || 
                                   price <= parseFloat(filters.priceRange.max);
            
            // Bestseller filter
            const matchesBestseller = filters.bestseller === null || 
                                     menu.bestseller === filters.bestseller;
            
            return matchesSearch && matchesTab && matchesCategory && 
                   matchesMinPrice && matchesMaxPrice && matchesBestseller;
        });
    }, [menus, searchQuery, activeTab, filters]);

    // Stats
    const stats = useMemo(() => ({
        total: menus.length,
        approved: menus.filter(m => m.status === 'approved').length,
        pending: menus.filter(m => m.status === 'pending').length,
        rejected: menus.filter(m => m.status === 'rejected').length,
        bestsellers: menus.filter(m => m.bestseller).length,
    }), [menus]);

    // Tabs
    const tabs = [
        { id: 'all', label: 'All Items', count: stats.total },
        { id: 'approved', label: 'Approved', count: stats.approved },
        { id: 'pending', label: 'Pending', count: stats.pending },
        { id: 'rejected', label: 'Rejected', count: stats.rejected },
    ];

    const getActiveFilterCount = () => {
        let count = 0;
        if (filters.category.length > 0) count++;
        if (filters.priceRange.min) count++;
        if (filters.priceRange.max) count++;
        if (filters.bestseller !== null) count++;
        return count;
    };

    const clearFilters = () => {
        setFilters({
            category: [],
            priceRange: { min: '', max: '' },
            bestseller: null,
        });
        setShowFilters(false);
        showToast('Filters cleared');
    };

    // Helpers
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openModal = (type, menu = null) => {
        setSelectedMenu(menu);
        setModals({ ...modals, [type]: true });
    };

    const closeModal = (type) => {
        setModals({ ...modals, [type]: false });
        setSelectedMenu(null);
    };

    const handleApprove = async (menuId) => {
        await approveMenu(menuId);
        showToast('Item approved');
    };

    const handleDelete = async () => {
        await deleteMenu(selectedMenu._id);
        showToast('Item deleted', 'error');
        closeModal('delete');
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                
                {/* ===== HEADER ===== */}
                <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1.5 truncate">
                                Menu Management
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {filteredMenus.length} of {menus.length} items
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
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
                                onClick={() => openModal('add')}
                                className="flex items-center justify-center gap-2 h-10 sm:h-11 px-3 sm:px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 rounded-xl text-sm font-semibold transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                                <span className="hidden xs:inline">Add Item</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== ERROR ALERT ===== */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 flex items-start gap-2.5 sm:gap-3">
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-300 mb-0.5">Error</p>
                            <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 break-words">{error}</p>
                        </div>
                        <button 
                            onClick={clearError} 
                            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-500 transition-colors flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* ===== STATS GRID ===== */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <MobileStatCard icon={Package} label="Total Items" value={stats.total} />
                    <MobileStatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
                    <MobileStatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
                    <MobileStatCard icon={XCircle} label="Rejected" value={stats.rejected} color="red" />
                    <MobileStatCard icon={Star} label="Bestsellers" value={stats.bestsellers} color="purple" />
                </div>

                {/* ===== SEARCH BAR ===== */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, description, category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-11 sm:h-12 pl-10 sm:pl-11 pr-10 sm:pr-11 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')} 
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* ===== FILTER PANEL ===== */}
                {showFilters && (
                    <FilterPanel
                        filters={filters}
                        setFilters={setFilters}
                        categories={categories}
                        onClose={() => setShowFilters(false)}
                        onClear={clearFilters}
                    />
                )}

                {/* ===== ACTIVE FILTERS ===== */}
                {getActiveFilterCount() > 0 && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {filters.category.map(cat => (
                            <FilterBadge
                                key={cat}
                                label={`Category: ${cat}`}
                                onRemove={() => setFilters(prev => ({
                                    ...prev,
                                    category: prev.category.filter(c => c !== cat)
                                }))}
                            />
                        ))}
                        {(filters.priceRange.min || filters.priceRange.max) && (
                            <FilterBadge
                                label={`Price: $${filters.priceRange.min || '0'} - $${filters.priceRange.max || '∞'}`}
                                onRemove={() => setFilters(prev => ({
                                    ...prev,
                                    priceRange: { min: '', max: '' }
                                }))}
                            />
                        )}
                        {filters.bestseller !== null && (
                            <FilterBadge
                                label={filters.bestseller ? 'Bestsellers Only' : 'Non-Bestsellers'}
                                onRemove={() => setFilters(prev => ({ ...prev, bestseller: null }))}
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

                {/* ===== TABS & VIEW TOGGLE ===== */}
                <div className="mb-4 sm:mb-6 -mx-3 sm:mx-0">
                    <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#222]">
                        <div className="w-full overflow-x-auto scrollbar-hide px-3 sm:px-0">
                            <div className="flex gap-1 sm:gap-2 min-w-max sm:min-w-0">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition-all border-b-2 ${
                                            activeTab === tab.id
                                                ? 'border-black dark:border-white text-black dark:text-white'
                                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                        }`}
                                    >
                                        <span>{tab.label}</span>
                                        <span className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                                            activeTab === tab.id
                                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                                : 'bg-gray-200 dark:bg-[#222] text-gray-600 dark:text-gray-400'
                                        }`}>
                                            {tab.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="hidden lg:flex gap-1 bg-gray-100 dark:bg-[#111] rounded-lg p-1 ml-4">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'grid' 
                                        ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <Grid3x3 className="w-3.5 h-3.5" />
                                Grid
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`h-8 px-3 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    viewMode === 'list' 
                                        ? 'bg-white dark:bg-[#222] text-black dark:text-white shadow-sm' 
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                                }`}
                            >
                                <List className="w-3.5 h-3.5" />
                                List
                            </button>
                        </div>
                    </div>
                </div>

                {/* ===== CONTENT ===== */}
                {isLoading ? (
                    <LoadingState viewMode={viewMode} />
                ) : filteredMenus.length === 0 ? (
                    <EmptyState
                        hasSearch={!!searchQuery}
                        hasFilters={getActiveFilterCount() > 0}
                        onReset={() => { 
                            setSearchQuery(''); 
                            setActiveTab('all'); 
                            clearFilters();
                        }}
                        onAdd={() => openModal('add')}
                    />
                ) : (
                    <div className={
                        viewMode === 'grid' 
                            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4' 
                            : 'space-y-2 sm:space-y-3'
                    }>
                        {filteredMenus.map(menu => (
                            <MenuCard
                                key={menu._id}
                                menu={menu}
                                viewMode={viewMode}
                                onEdit={() => openModal('edit', menu)}
                                onDelete={() => openModal('delete', menu)}
                                onApprove={() => handleApprove(menu._id)}
                                onReject={() => openModal('reject', menu)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== MODALS ===== */}
            {modals.add && (
                <MenuFormModal 
                    onClose={() => closeModal('add')} 
                    onSubmit={async (data) => { 
                        await addMenu(data); 
                        showToast('Item added successfully'); 
                        closeModal('add'); 
                    }} 
                />
            )}
            
            {modals.edit && (
                <MenuFormModal 
                    menu={selectedMenu} 
                    onClose={() => closeModal('edit')} 
                    onSubmit={async (data) => { 
                        await updateMenu(selectedMenu._id, data); 
                        showToast('Item updated successfully'); 
                        closeModal('edit'); 
                    }} 
                />
            )}
            
            {modals.delete && (
                <ConfirmModal 
                    title="Delete Menu Item?" 
                    message={`Are you sure you want to delete "${selectedMenu?.name}"? This action cannot be undone.`}
                    confirmText="Delete" 
                    onClose={() => closeModal('delete')} 
                    onConfirm={handleDelete}
                />
            )}
            
            {modals.reject && (
                <RejectModal 
                    menu={selectedMenu} 
                    onClose={() => closeModal('reject')} 
                    onConfirm={async (reason) => { 
                        await rejectMenu(selectedMenu._id, reason); 
                        showToast('Item rejected', 'error'); 
                        closeModal('reject'); 
                    }} 
                />
            )}

            {/* ===== TOAST ===== */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}

// ============================================================================
// 🔥 COMPONENTS
// ============================================================================

function FilterPanel({ filters, setFilters, categories, onClose, onClear }) {
    const [localFilters, setLocalFilters] = useState(filters);

    const handleApply = () => {
        setFilters(localFilters);
        onClose();
    };

    const toggleCategory = (category) => {
        setLocalFilters(prev => ({
            ...prev,
            category: prev.category.includes(category)
                ? prev.category.filter(c => c !== category)
                : [...prev.category, category]
        }));
    };

    return (
        <div className="mb-4 bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-4 sm:p-5 space-y-4 sm:space-y-5">
            <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-black dark:text-white">Filters</h3>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-[#111] transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
                <div>
                    <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black dark:text-white mb-3">
                        <Tag className="w-4 h-4" />
                        Categories
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => toggleCategory(category)}
                                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                                    localFilters.category.includes(category)
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

            {/* Price Range */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black dark:text-white mb-3">
                    <DollarSign className="w-4 h-4" />
                    Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="number"
                        placeholder="Min"
                        value={localFilters.priceRange.min}
                        onChange={(e) => setLocalFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: e.target.value }
                        }))}
                        className="h-10 sm:h-11 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg text-sm text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={localFilters.priceRange.max}
                        onChange={(e) => setLocalFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: e.target.value }
                        }))}
                        className="h-10 sm:h-11 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg text-sm text-black dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Bestseller */}
            <div>
                <label className="flex items-center gap-2 text-xs sm:text-sm font-bold text-black dark:text-white mb-3">
                    <Star className="w-4 h-4" />
                    Bestseller Status
                </label>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLocalFilters(prev => ({ ...prev, bestseller: null }))}
                        className={`flex-1 h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            localFilters.bestseller === null
                                ? 'bg-black dark:bg-white text-white dark:text-black'
                                : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222]'
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setLocalFilters(prev => ({ ...prev, bestseller: true }))}
                        className={`flex-1 h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            localFilters.bestseller === true
                                ? 'bg-yellow-600 dark:bg-yellow-500 text-white'
                                : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222]'
                        }`}
                    >
                        Bestsellers
                    </button>
                    <button
                        onClick={() => setLocalFilters(prev => ({ ...prev, bestseller: false }))}
                        className={`flex-1 h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                            localFilters.bestseller === false
                                ? 'bg-gray-600 dark:bg-gray-500 text-white'
                                : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222]'
                        }`}
                    >
                        Regular
                    </button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={() => {
                        setLocalFilters({
                            category: [],
                            priceRange: { min: '', max: '' },
                            bestseller: null,
                        });
                        onClear();
                    }}
                    className="flex-1 h-10 sm:h-11 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222]"
                >
                    Clear
                </button>
                <button
                    onClick={handleApply}
                    className="flex-1 h-10 sm:h-11 bg-black dark:bg-white text-white dark:text-black rounded-lg font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-98 transition-all shadow-lg"
                >
                    Apply
                </button>
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

function MobileStatCard({ icon: Icon, label, value, color }) {
    const colors = {
        green: 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500',
        yellow: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
        red: 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500',
        purple: 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-500',
    };

    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-3 sm:p-5 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center mb-2 sm:mb-3 ${
                color ? colors[color] : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300'
            }`}>
                <Icon className="w-4.5 h-4.5 sm:w-5.5 sm:h-5.5" />
            </div>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1">{value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{label}</p>
        </div>
    );
}

function MenuCard({ menu, viewMode, onEdit, onDelete, onApprove, onReject }) {
    const [imageIndex, setImageIndex] = useState(0);
    const images = Array.isArray(menu.image) ? menu.image.filter(Boolean) : [menu.image].filter(Boolean);

    if (viewMode === 'list') {
        return (
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-100 dark:bg-[#111] overflow-hidden flex-shrink-0">
                    {images.length > 0 ? (
                        <img src={images[0]} alt={menu.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300 dark:text-gray-600" />
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-sm sm:text-base text-black dark:text-white truncate">{menu.name}</h3>
                        <StatusBadge status={menu.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">{menu.description}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-black dark:text-white">${menu.price}</span>
                        {menu.bestseller && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 px-2 py-0.5 rounded font-semibold">
                                ⭐ Bestseller
                            </span>
                        )}
                    </div>
                </div>
                
                <ActionMenu 
                    menu={menu} 
                    onEdit={onEdit} 
                    onDelete={onDelete} 
                    onApprove={onApprove} 
                    onReject={onReject} 
                />
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all group">
            <div className="relative h-48 sm:h-56 bg-gray-100 dark:bg-[#111]">
                {images.length > 0 ? (
                    <>
                        <img src={images[imageIndex]} alt={menu.name} className="w-full h-full object-cover" />
                        {images.length > 1 && (
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                                {images.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setImageIndex(i)}
                                        className={`h-1.5 rounded-full transition-all ${
                                            i === imageIndex ? 'bg-white w-4' : 'bg-white/60 w-1.5'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <ImageIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mb-2" />
                        <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 font-medium">No image</p>
                    </div>
                )}
                
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-2">
                    <StatusBadge status={menu.status} />
                    <ActionMenu 
                        menu={menu} 
                        onEdit={onEdit} 
                        onDelete={onDelete} 
                        onApprove={onApprove} 
                        onReject={onReject} 
                    />
                </div>
                
                <div className="absolute bottom-2 sm:bottom-3 left-2 sm:left-3 px-3 py-1.5 bg-black/90 backdrop-blur-sm text-white rounded-lg font-bold text-sm sm:text-base shadow-lg">
                    ${menu.price}
                </div>
            </div>
            
            <div className="p-3 sm:p-4">
                <h3 className="font-bold text-sm sm:text-base text-black dark:text-white mb-1 sm:mb-1.5 line-clamp-1">
                    {menu.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {menu.description}
                </p>
                {menu.bestseller && (
                    <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 px-2 sm:px-2.5 py-1 rounded-lg font-semibold">
                        <Star className="w-3 h-3" />
                        Bestseller
                    </span>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }) {
    const styles = {
        approved: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border-green-200 dark:border-green-500/20',
        pending: 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-200 dark:border-yellow-500/20',
        rejected: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-500 border-red-200 dark:border-red-500/20',
    };

    return (
        <span className={`inline-flex items-center gap-1 h-7 sm:h-8 px-2 sm:px-2.5 rounded-lg text-[10px] sm:text-xs font-bold border ${
            styles[status] || styles.pending
        }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function ActionMenu({ menu, onEdit, onDelete, onApprove, onReject }) {
    const [show, setShow] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => { 
            if (ref.current && !ref.current.contains(e.target)) setShow(false); 
        };
        if (show) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [show]);

    return (
        <div ref={ref} className="relative">
            <button 
                onClick={() => setShow(!show)} 
                className="w-8 h-8 flex items-center justify-center bg-white/95 dark:bg-[#0a0a0a]/95 hover:bg-white dark:hover:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-lg backdrop-blur-sm transition-all shadow-sm"
            >
                <MoreVertical className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            </button>
            
            {show && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#222] py-1 z-50 overflow-hidden">
                    <button 
                        onClick={() => { onEdit(); setShow(false); }} 
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#111] flex items-center gap-3 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit Item
                    </button>
                    
                    {menu.status === 'pending' && (
                        <>
                            <button 
                                onClick={() => { onApprove(); setShow(false); }} 
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-green-600 dark:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-3 transition-colors"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Approve
                            </button>
                            <button 
                                onClick={() => { onReject(); setShow(false); }} 
                                className="w-full px-4 py-2.5 text-left text-sm font-semibold text-yellow-600 dark:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10 flex items-center gap-3 transition-colors"
                            >
                                <XCircle className="w-4 h-4" />
                                Reject
                            </button>
                        </>
                    )}
                    
                    <div className="h-px bg-gray-200 dark:bg-[#222] my-1" />
                    
                    <button 
                        onClick={() => { onDelete(); setShow(false); }} 
                        className="w-full px-4 py-2.5 text-left text-sm font-semibold text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 transition-colors"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
}

function MenuFormModal({ menu, onClose, onSubmit }) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ 
        name: menu?.name || '', 
        description: menu?.description || '', 
        price: menu?.price || '', 
        category: menu?.category || '',
        bestseller: menu?.bestseller || false 
    });
    const [images, setImages] = useState([null, null, null, null]);
    const [previews, setPreviews] = useState(
        menu?.image 
            ? [...(Array.isArray(menu.image) ? menu.image : [menu.image]), '', '', ''].slice(0, 4) 
            : ['', '', '', '']
    );

    const handleImage = (i, file) => {
        if (!file) return;
        const newImages = [...images];
        newImages[i] = file;
        setImages(newImages);
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const newPreviews = [...previews];
            newPreviews[i] = reader.result;
            setPreviews(newPreviews);
        };
        reader.readAsDataURL(file);
    };

    const removeImage = (i) => {
        const newImages = [...images];
        newImages[i] = null;
        setImages(newImages);
        
        const newPreviews = [...previews];
        newPreviews[i] = '';
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('price', form.price);
        formData.append('category', form.category);
        formData.append('bestseller', form.bestseller);
        
        images.forEach((img, i) => { 
            if (img) formData.append(`image${i + 1}`, img); 
        });

        await onSubmit(formData);
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 dark:border-[#222] max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#222] p-4 sm:p-5 flex items-center justify-between">
                    <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white">
                        {menu ? 'Edit Menu Item' : 'Add Menu Item'}
                    </h2>
                    <button 
                        onClick={onClose} 
                        className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-[#111] text-gray-500 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4 sm:space-y-5">
                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm sm:text-base font-bold text-black dark:text-white mb-3">
                            Images (Up to 4)
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className="relative h-32 sm:h-36 bg-gray-100 dark:bg-[#111] border-2 border-dashed border-gray-300 dark:border-[#333] rounded-xl overflow-hidden">
                                    {previews[i] ? (
                                        <>
                                            <img src={previews[i]} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeImage(i)}
                                                className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </>
                                    ) : (
                                        <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors">
                                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                                            <span className="text-xs text-gray-500 font-medium">Upload Image {i + 1}</span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={(e) => handleImage(i, e.target.files[0])} 
                                                className="hidden" 
                                            />
                                        </label>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            placeholder="e.g., Margherita Pizza"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Description *
                        </label>
                        <textarea
                            placeholder="Describe the item..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            className="w-full px-3 sm:px-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            rows={4}
                            required
                        />
                    </div>

                    {/* Price & Category */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Price *
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: e.target.value })}
                                className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                step="0.01"
                                min="0"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Category
                            </label>
                            <input
                                type="text"
                                placeholder="e.g., Pizza"
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full h-11 sm:h-12 px-3 sm:px-4 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm sm:text-base text-black dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    {/* Bestseller */}
                    <label className="flex items-center gap-3 h-12 px-4 bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-[#1a1a1a] transition-colors">
                        <input
                            type="checkbox"
                            checked={form.bestseller}
                            onChange={(e) => setForm({ ...form, bestseller: e.target.checked })}
                            className="w-4 h-4 rounded border-gray-300 text-yellow-600 focus:ring-yellow-500"
                        />
                        <div className="flex items-center gap-2 flex-1">
                            <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-500" />
                            <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                                Mark as Bestseller
                            </span>
                        </div>
                    </label>
                </form>

                {/* Footer Actions */}
                <div className="flex-shrink-0 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-[#222] p-4 sm:p-5 flex gap-3 sm:gap-4">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="flex-1 h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222]"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        onClick={handleSubmit}
                        className="flex-1 h-11 sm:h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-98 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {menu ? 'Updating...' : 'Adding...'}
                            </>
                        ) : (
                            menu ? 'Update Item' : 'Add Item'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function ConfirmModal({ title, message, confirmText, onClose, onConfirm }) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] max-w-md w-full rounded-2xl border border-gray-200 dark:border-[#222] p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-12 bg-red-100 dark:bg-red-500/10 rounded-xl flex items-center justify-center mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">{title}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 h-11 sm:h-12 border border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#111] transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 h-11 sm:h-12 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all shadow-lg"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

function RejectModal({ menu, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] max-w-md w-full rounded-2xl border border-gray-200 dark:border-[#222] p-5 sm:p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-500/10 rounded-xl flex items-center justify-center mb-4">
                    <XCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">
                    Reject "{menu.name}"?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please provide a reason for rejection
                </p>
                <textarea
                    placeholder="Enter rejection reason..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm text-black dark:text-white placeholder:text-gray-400 resize-none mb-4 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                    rows={4}
                />
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 h-11 sm:h-12 border border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#111] transition-all"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onConfirm(reason)} 
                        disabled={!reason.trim()}
                        className="flex-1 h-11 sm:h-12 bg-yellow-600 hover:bg-yellow-700 text-white rounded-xl font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Reject Item
                    </button>
                </div>
            </div>
        </div>
    );
}

function EmptyState({ hasSearch, hasFilters, onReset, onAdd }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">
                {hasSearch || hasFilters ? 'No items found' : 'No menu items yet'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {hasSearch || hasFilters 
                    ? 'Try adjusting your search or filters' 
                    : 'Get started by adding your first menu item'}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
                {(hasSearch || hasFilters) && (
                    <button 
                        onClick={onReset} 
                        className="h-11 sm:h-12 px-5 sm:px-6 border border-gray-300 dark:border-[#333] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-[#111] transition-all"
                    >
                        Clear Filters
                    </button>
                )}
                <button 
                    onClick={onAdd} 
                    className="h-11 sm:h-12 px-5 sm:px-6 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Menu Item
                </button>
            </div>
        </div>
    );
}

function LoadingState({ viewMode }) {
    return (
        <div className={
            viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4' 
                : 'space-y-2 sm:space-y-3'
        }>
            {[...Array(6)].map((_, i) => (
                <div 
                    key={i} 
                    className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden animate-pulse"
                >
                    <div className="h-48 sm:h-56 bg-gray-200 dark:bg-[#111]" />
                    <div className="p-3 sm:p-4 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-[#111] rounded w-3/4" />
                        <div className="h-3 bg-gray-200 dark:bg-[#111] rounded w-full" />
                        <div className="h-3 bg-gray-200 dark:bg-[#111] rounded w-2/3" />
                    </div>
                </div>
            ))}
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

    return (
        <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[60] animate-slide-up">
            <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl px-4 py-3.5 sm:py-4 shadow-2xl">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-1 h-10 sm:h-12 rounded-full flex-shrink-0 ${typeStyles[type] || typeStyles.success}`} />
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