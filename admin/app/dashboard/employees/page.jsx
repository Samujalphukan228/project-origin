'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useEmployee } from '../../../context/employeeContext';
import { useSocket } from '../../../context/socketContext';
import {
    Search,
    MoreVertical,
    Trash2,
    CheckCircle,
    XCircle,
    Grid3x3,
    List,
    User as UserIcon,
    X,
    Mail,
    Phone,
    Clock,
    AlertCircle,
    Loader2,
    Users,
    Check,
    Shield,
    Calendar,
    Briefcase,
    Filter,
    RefreshCw,
} from 'lucide-react';

export default function EmployeesPage() {
    const {
        employees,
        isLoading,
        error,
        getAllEmployees,
        approveEmployee,
        rejectEmployee,
        deleteEmployee,
        updateEmployeeRole,
        clearError,
        pendingEmployees,
        approvedEmployees,
        totalEmployees,
    } = useEmployee();

    const { socket } = useSocket();

    // State
    const [viewMode, setViewMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('employeesViewMode') || 'grid';
        }
        return 'grid';
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showFilterModal, setShowFilterModal] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Save view mode preference
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('employeesViewMode', viewMode);
        }
    }, [viewMode]);

    // Real-time socket events
    useEffect(() => {
        if (!socket) return;

        const handleDataUpdate = () => {
            getAllEmployees();
        };

        const handleEmployeeRegistered = (data) => {
            showToast(`New employee registered: ${data.name || 'Unknown'}`, 'success');
            handleDataUpdate();
        };

        const handleEmployeeApproved = (data) => {
            showToast(`${data.name || 'Employee'} approved`, 'success');
            handleDataUpdate();
        };

        const handleEmployeeRejected = (data) => {
            showToast(`${data.name || 'Employee'} was rejected`, 'error');
            handleDataUpdate();
        };

        const handleEmployeeDeleted = (data) => {
            showToast(`${data.name || 'Employee'} was deleted`, 'error');
            handleDataUpdate();
        };

        const handleEmployeeRoleUpdated = (data) => {
            showToast(`${data.name || 'Employee'} role updated to ${data.role}`, 'success');
            handleDataUpdate();
        };

        socket.on('employee:registered', handleEmployeeRegistered);
        socket.on('employee:approved', handleEmployeeApproved);
        socket.on('employee:rejected', handleEmployeeRejected);
        socket.on('employee:deleted', handleEmployeeDeleted);
        socket.on('employee:roleUpdated', handleEmployeeRoleUpdated);

        return () => {
            socket.off('employee:registered', handleEmployeeRegistered);
            socket.off('employee:approved', handleEmployeeApproved);
            socket.off('employee:rejected', handleEmployeeRejected);
            socket.off('employee:deleted', handleEmployeeDeleted);
            socket.off('employee:roleUpdated', handleEmployeeRoleUpdated);
        };
    }, [socket, getAllEmployees]);

    // Initial data load
    useEffect(() => {
        getAllEmployees();
    }, [getAllEmployees]);

    // Auto dismiss error
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                clearError();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, clearError]);

    // Filtered employees
    const filteredEmployees = useMemo(() => {
        return employees.filter((employee) => {
            const matchesSearch =
                employee.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                employee.phone?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesStatus = true;
            if (statusFilter === 'approved') {
                matchesStatus = employee.isAproved === true;
            } else if (statusFilter === 'pending') {
                matchesStatus = !employee.isAproved;
            }

            const matchesRole = roleFilter === 'all' || employee.role === roleFilter;

            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [employees, searchQuery, statusFilter, roleFilter]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: totalEmployees || employees.length,
            approved: approvedEmployees?.length || employees.filter((e) => e.isAproved).length,
            pending: pendingEmployees?.length || employees.filter((e) => !e.isAproved).length,
        };
    }, [employees, totalEmployees, approvedEmployees, pendingEmployees]);

    const getActiveFilterCount = () => {
        let count = 0;
        if (statusFilter !== 'all') count++;
        if (roleFilter !== 'all') count++;
        if (searchQuery) count++;
        return count;
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setRoleFilter('all');
        showToast('Filters cleared');
    };

    const hasActiveFilters = getActiveFilterCount() > 0;

    const handleRefresh = async () => {
        await getAllEmployees();
        showToast('Data refreshed');
    };

    return (
        <div className="min-h-screen bg-[#fafafa] dark:bg-black pb-20 sm:pb-6">
            <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
                
                {/* ===== HEADER ===== */}
                <div className="pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black dark:text-white mb-1.5 truncate">
                                Employees
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                                {filteredEmployees.length} of {employees.length} members
                            </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3">
                            <button
                                onClick={() => setShowFilterModal(!showFilterModal)}
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
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 h-10 sm:h-11 px-3 sm:px-4 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-all shadow-sm"
                            >
                                <RefreshCw className={`w-4 h-4 sm:w-4.5 sm:h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden xs:inline">Refresh</span>
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <MobileStatCard icon={Users} label="Total" value={stats.total} />
                    <MobileStatCard icon={CheckCircle} label="Approved" value={stats.approved} color="green" />
                    <MobileStatCard icon={Clock} label="Pending" value={stats.pending} color="yellow" />
                </div>

                {/* ===== SEARCH BAR ===== */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
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
                {showFilterModal && (
                    <FilterPanel
                        statusFilter={statusFilter}
                        roleFilter={roleFilter}
                        onStatusChange={setStatusFilter}
                        onRoleChange={setRoleFilter}
                        onClose={() => setShowFilterModal(false)}
                        onClear={clearFilters}
                    />
                )}

                {/* ===== ACTIVE FILTERS ===== */}
                {hasActiveFilters && (
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                        {statusFilter !== 'all' && (
                            <FilterBadge
                                label={`Status: ${statusFilter}`}
                                onRemove={() => setStatusFilter('all')}
                            />
                        )}
                        {roleFilter !== 'all' && (
                            <FilterBadge
                                label={`Role: ${roleFilter}`}
                                onRemove={() => setRoleFilter('all')}
                            />
                        )}
                        {searchQuery && (
                            <FilterBadge
                                label={`Search: "${searchQuery}"`}
                                onRemove={() => setSearchQuery('')}
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

                {/* ===== VIEW TOGGLE ===== */}
                <div className="mb-4 sm:mb-6 flex justify-end">
                    <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#111] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`h-8 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
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
                            className={`h-8 px-3 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
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

                {/* ===== CONTENT ===== */}
                {isLoading ? (
                    <LoadingState viewMode={viewMode} />
                ) : filteredEmployees.length === 0 ? (
                    <EmptyState
                        hasActiveFilters={hasActiveFilters}
                        onReset={clearFilters}
                    />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {filteredEmployees.map((employee) => (
                            <EmployeeCard
                                key={employee._id}
                                employee={employee}
                                onApprove={async () => {
                                    const result = await approveEmployee(employee._id);
                                    if (result.success) showToast('Employee approved successfully');
                                }}
                                onReject={() => {
                                    setSelectedEmployee(employee);
                                    setIsRejectModalOpen(true);
                                }}
                                onDelete={() => {
                                    setSelectedEmployee(employee);
                                    setIsDeleteModalOpen(true);
                                }}
                                onUpdateRole={() => {
                                    setSelectedEmployee(employee);
                                    setIsRoleModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2 sm:space-y-3">
                        {filteredEmployees.map((employee) => (
                            <EmployeeListItem
                                key={employee._id}
                                employee={employee}
                                onApprove={async () => {
                                    const result = await approveEmployee(employee._id);
                                    if (result.success) showToast('Employee approved successfully');
                                }}
                                onReject={() => {
                                    setSelectedEmployee(employee);
                                    setIsRejectModalOpen(true);
                                }}
                                onDelete={() => {
                                    setSelectedEmployee(employee);
                                    setIsDeleteModalOpen(true);
                                }}
                                onUpdateRole={() => {
                                    setSelectedEmployee(employee);
                                    setIsRoleModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ===== MODALS ===== */}
            {isRejectModalOpen && selectedEmployee && (
                <RejectModal
                    employee={selectedEmployee}
                    onClose={() => {
                        setIsRejectModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    onConfirm={async (reason) => {
                        const result = await rejectEmployee(selectedEmployee._id, reason);
                        if (result.success) {
                            showToast('Employee rejected', 'error');
                            setIsRejectModalOpen(false);
                            setSelectedEmployee(null);
                        }
                    }}
                />
            )}

            {isDeleteModalOpen && selectedEmployee && (
                <DeleteModal
                    employee={selectedEmployee}
                    onClose={() => {
                        setIsDeleteModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    onConfirm={async () => {
                        const result = await deleteEmployee(selectedEmployee._id);
                        if (result.success) {
                            showToast('Employee deleted', 'error');
                            setIsDeleteModalOpen(false);
                            setSelectedEmployee(null);
                        }
                    }}
                />
            )}

            {isRoleModalOpen && selectedEmployee && (
                <RoleModal
                    employee={selectedEmployee}
                    onClose={() => {
                        setIsRoleModalOpen(false);
                        setSelectedEmployee(null);
                    }}
                    onConfirm={async (role) => {
                        const result = await updateEmployeeRole(selectedEmployee._id, role);
                        if (result.success) {
                            showToast('Role updated successfully');
                            setIsRoleModalOpen(false);
                            setSelectedEmployee(null);
                        }
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

function FilterPanel({ statusFilter, roleFilter, onStatusChange, onRoleChange, onClose, onClear }) {
    const [localStatusFilter, setLocalStatusFilter] = useState(statusFilter);
    const [localRoleFilter, setLocalRoleFilter] = useState(roleFilter);

    const handleApply = () => {
        onStatusChange(localStatusFilter);
        onRoleChange(localRoleFilter);
        onClose();
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

            {/* Status Filter */}
            <div>
                <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-3">
                    Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'all', label: 'All Status' },
                        { value: 'approved', label: 'Approved' },
                        { value: 'pending', label: 'Pending' },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setLocalStatusFilter(option.value)}
                            className={`h-10 sm:h-11 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                                localStatusFilter === option.value
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                    : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333]'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Role Filter */}
            <div>
                <label className="block text-xs sm:text-sm font-bold text-black dark:text-white mb-3">
                    Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { value: 'all', label: 'All Roles' },
                        { value: 'waiter', label: 'Waiter' },
                        { value: 'kitchen', label: 'Kitchen' },
                    ].map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setLocalRoleFilter(option.value)}
                            className={`h-10 sm:h-11 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                                localRoleFilter === option.value
                                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                    : 'bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333]'
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
                <button
                    onClick={() => {
                        setLocalStatusFilter('all');
                        setLocalRoleFilter('all');
                        onClear();
                        onClose();
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
            <span className="truncate max-w-[150px] sm:max-w-none capitalize">{label}</span>
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

function EmployeeCard({ employee, onApprove, onReject, onDelete, onUpdateRole }) {
    const [showActions, setShowActions] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowActions(false);
            }
        }
        if (showActions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showActions]);

    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <div className="p-4 sm:p-5 bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-200 dark:border-[#222]">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200 dark:border-gray-200">
                            <span className="text-black text-lg sm:text-xl font-bold">
                                {employee.name?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-bold text-black dark:text-white mb-1 line-clamp-1" title={employee.name}>
                                {employee.name}
                            </h3>
                            <RoleBadge role={employee.role} />
                        </div>
                    </div>
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#111] rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {showActions && (
                            <ActionDropdown
                                employee={employee}
                                onApprove={onApprove}
                                onReject={onReject}
                                onDelete={onDelete}
                                onUpdateRole={onUpdateRole}
                                onClose={() => setShowActions(false)}
                            />
                        )}
                    </div>
                </div>
                <StatusBadge employee={employee} />
            </div>
            <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate" title={employee.email}>{employee.email}</span>
                </div>
                {employee.phone && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{employee.phone}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function EmployeeListItem({ employee, onApprove, onReject, onDelete, onUpdateRole }) {
    const [showActions, setShowActions] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowActions(false);
            }
        }
        if (showActions) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showActions]);

    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl p-3 sm:p-4 hover:shadow-lg dark:hover:shadow-2xl dark:hover:shadow-white/5 transition-all">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white dark:bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-gray-200 dark:border-gray-200">
                    <span className="text-black text-base sm:text-lg font-bold">
                        {employee.name?.charAt(0).toUpperCase()}
                    </span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-black dark:text-white truncate" title={employee.name}>
                            {employee.name}
                        </h3>
                        <RoleBadge role={employee.role} />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span className="truncate" title={employee.email}>{employee.email}</span>
                        {employee.phone && (
                            <>
                                <span className="hidden sm:inline">•</span>
                                <span>{employee.phone}</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge employee={employee} />
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowActions(!showActions);
                            }}
                            className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-[#111] rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        {showActions && (
                            <ActionDropdown
                                employee={employee}
                                onApprove={onApprove}
                                onReject={onReject}
                                onDelete={onDelete}
                                onUpdateRole={onUpdateRole}
                                onClose={() => setShowActions(false)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ employee }) {
    if (employee.isAproved) {
        return (
            <span className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2 sm:px-2.5 bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500 border border-green-200 dark:border-green-500/20 rounded-lg text-[10px] sm:text-xs font-bold">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Approved</span>
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 h-7 sm:h-8 px-2 sm:px-2.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-500/20 rounded-lg text-[10px] sm:text-xs font-bold">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Pending</span>
        </span>
    );
}

function RoleBadge({ role }) {
    const styles = {
        waiter: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-200 dark:border-blue-500/20',
        kitchen: 'bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-200 dark:border-orange-500/20',
        pending: 'bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-200 dark:border-gray-500/20',
    };

    return (
        <span className={`inline-flex items-center h-6 px-2 rounded-md text-[10px] sm:text-xs font-bold border capitalize ${styles[role] || styles.pending}`}>
            {role}
        </span>
    );
}

function ActionDropdown({ employee, onApprove, onReject, onDelete, onUpdateRole, onClose }) {
    return (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl border border-gray-200 dark:border-[#222] py-1.5 z-50 overflow-hidden">
            {!employee.isAproved && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onApprove();
                        onClose();
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-green-50 dark:hover:bg-green-500/10 flex items-center gap-3 text-green-700 dark:text-green-500 text-sm font-semibold transition-colors"
                >
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    Approve Employee
                </button>
            )}

            {!employee.isAproved && (
                <div className="h-px bg-gray-200 dark:bg-[#222] my-1.5" />
            )}

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdateRole();
                    onClose();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-[#111] flex items-center gap-3 text-gray-700 dark:text-gray-300 text-sm font-semibold transition-colors"
            >
                <Shield className="w-4 h-4 flex-shrink-0" />
                Change Role
            </button>

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onReject();
                    onClose();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-yellow-50 dark:hover:bg-yellow-500/10 flex items-center gap-3 text-yellow-700 dark:text-yellow-500 text-sm font-semibold transition-colors"
            >
                <XCircle className="w-4 h-4 flex-shrink-0" />
                Reject
            </button>

            <div className="h-px bg-gray-200 dark:bg-[#222] my-1.5" />

            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                    onClose();
                }}
                className="w-full px-4 py-2.5 text-left hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-3 text-red-600 dark:text-red-500 text-sm font-semibold transition-colors"
            >
                <Trash2 className="w-4 h-4 flex-shrink-0" />
                Delete
            </button>
        </div>
    );
}

function RejectModal({ employee, onClose, onConfirm }) {
    const [reason, setReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason.trim()) return;
        setIsRejecting(true);
        await onConfirm(reason);
        setIsRejecting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 dark:border-[#222] max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex-shrink-0 p-5 sm:p-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-yellow-100 dark:bg-yellow-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600 dark:text-yellow-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white text-center mb-2">
                        Reject Employee?
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-5">
                        Provide a reason for rejecting <strong className="text-black dark:text-white">{employee.name}</strong>
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Reason <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                required
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl text-sm text-black dark:text-white placeholder:text-gray-400 resize-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
                                placeholder="e.g., Insufficient qualifications, missing documents..."
                            />
                        </div>
                        <div className="flex gap-3">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isRejecting} 
                                className="flex-1 h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isRejecting || !reason.trim()} 
                                className="flex-1 h-11 sm:h-12 bg-yellow-600 dark:bg-yellow-500 hover:bg-yellow-700 dark:hover:bg-yellow-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg active:scale-98"
                            >
                                {isRejecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Reject
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function DeleteModal({ employee, onClose, onConfirm }) {
    const [isDeleting, setIsDeleting] = useState(false);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 dark:border-[#222] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 sm:p-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 text-red-600 dark:text-red-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white text-center mb-2">
                        Delete Employee?
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                        Are you sure you want to permanently delete <strong className="text-black dark:text-white">{employee.name}</strong>? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button 
                            onClick={onClose} 
                            disabled={isDeleting} 
                            className="flex-1 h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222] disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={async () => {
                                setIsDeleting(true);
                                await onConfirm();
                            }}
                            disabled={isDeleting}
                            className="flex-1 h-11 sm:h-12 bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg active:scale-98"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RoleModal({ employee, onClose, onConfirm }) {
    const [selectedRole, setSelectedRole] = useState(employee.role);
    const [isUpdating, setIsUpdating] = useState(false);

    const roles = [
        { value: 'waiter', label: 'Waiter', icon: UserIcon },
        { value: 'kitchen', label: 'Kitchen Staff', icon: Briefcase },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        await onConfirm(selectedRole);
        setIsUpdating(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <div 
                className="bg-white dark:bg-[#0a0a0a] w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border-t sm:border border-gray-200 dark:border-[#222] shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 sm:p-6">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 dark:bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-500" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-black dark:text-white text-center mb-2">
                        Change Role
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center mb-5">
                        Select a new role for <strong className="text-black dark:text-white">{employee.name}</strong>
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="space-y-2">
                            {roles.map((role) => {
                                const Icon = role.icon;
                                const isSelected = selectedRole === role.value;
                                return (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setSelectedRole(role.value)}
                                        className={`w-full h-12 sm:h-14 px-4 rounded-xl text-left flex items-center gap-3 transition-all active:scale-98 ${
                                            isSelected
                                                ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                                                : 'bg-gray-50 dark:bg-[#111] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#222]'
                                        }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            isSelected ? 'bg-white/20 dark:bg-black/20' : 'bg-gray-200 dark:bg-[#222]'
                                        }`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-semibold flex-1">{role.label}</span>
                                        {isSelected && <Check className="w-5 h-5 flex-shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                disabled={isUpdating} 
                                className="flex-1 h-11 sm:h-12 bg-gray-100 dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-[#1a1a1a] active:scale-98 transition-all border border-gray-200 dark:border-[#222] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isUpdating || selectedRole === employee.role} 
                                className="flex-1 h-11 sm:h-12 bg-black dark:bg-white text-white dark:text-black rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg active:scale-98 hover:bg-gray-800 dark:hover:bg-gray-100"
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Shield className="w-4 h-4" />
                                        Update Role
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Toast({ message, type, onClose }) {
    const typeStyles = {
        success: 'bg-green-500',
        error: 'bg-red-500',
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

function LoadingState({ viewMode }) {
    if (viewMode === 'list') {
        return (
            <div className="space-y-2 sm:space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl p-3 sm:p-4 animate-pulse">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 dark:bg-[#111] rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-[#111] rounded w-1/3" />
                                <div className="h-3 bg-gray-200 dark:bg-[#111] rounded w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl overflow-hidden animate-pulse">
                    <div className="p-4 sm:p-5 bg-gray-50/50 dark:bg-[#111]/50 border-b border-gray-200 dark:border-[#222]">
                        <div className="flex items-start gap-3 mb-3 sm:mb-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-200 dark:bg-[#111] rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-[#111] rounded w-3/4" />
                                <div className="h-3 bg-gray-200 dark:bg-[#111] rounded w-1/2" />
                            </div>
                        </div>
                        <div className="h-6 bg-gray-200 dark:bg-[#111] rounded w-24" />
                    </div>
                    <div className="p-4 sm:p-5 space-y-3">
                        <div className="h-3 bg-gray-200 dark:bg-[#111] rounded" />
                        <div className="h-3 bg-gray-200 dark:bg-[#111] rounded w-5/6" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ hasActiveFilters, onReset }) {
    return (
        <div className="bg-white dark:bg-[#0a0a0a] border border-gray-200 dark:border-[#222] rounded-xl sm:rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-[#111] rounded-2xl flex items-center justify-center mx-auto mb-4">
                {hasActiveFilters ? (
                    <Search className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
                ) : (
                    <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 dark:text-gray-600" />
                )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-black dark:text-white mb-2">
                {hasActiveFilters ? 'No employees found' : 'No employees yet'}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                {hasActiveFilters
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'Team members will appear here once they register and get approved'}
            </p>
            {hasActiveFilters && (
                <button 
                    onClick={onReset} 
                    className="h-11 sm:h-12 px-5 sm:px-6 bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-100 rounded-xl font-semibold transition-all inline-flex items-center justify-center gap-2 shadow-lg active:scale-98"
                >
                    <X className="w-4 h-4" />
                    Clear all filters
                </button>
            )}
        </div>
    );
}