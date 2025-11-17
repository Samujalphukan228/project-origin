'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import SocketStatus from '@/components/SocketStatus';
import { useAuth } from '@/context/AuthContext';
import { useSocket, useSocketEvent } from '@/context/SocketContext';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PendingApprovalPage() {
    const { user, logout, refreshUser } = useAuth();
    const { connected } = useSocket();
    const router = useRouter();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastChecked, setLastChecked] = useState(new Date());
    const [notification, setNotification] = useState(null);

    // ✅ AUTO-REDIRECT when user gets approved (polls + socket events)
    useEffect(() => {
        if (user?.isAproved) {
            const roleRoutes = {
                admin: '/admin',
                manager: '/manager',
                waiter: '/waiter',
                kitchen: '/kitchen',
            };
            
            console.log('✅ User approved! Redirecting to dashboard...');
            
            // Small delay to show notification if present
            const redirectDelay = notification?.type === 'success' ? 2000 : 500;
            
            setTimeout(() => {
                router.push(roleRoutes[user.role] || '/');
            }, redirectDelay);
        }
    }, [user, router, notification]);

    // ✅ Listen for account approval
    useSocketEvent('account:approved', async (data) => {
        console.log('🎉 Account approved:', data);
        
        setNotification({
            type: 'success',
            title: 'Account Approved!',
            message: data.message || 'Your account has been approved!',
        });
        
        if ('Audio' in window) {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {});
        }
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Account Approved!', {
                body: 'Your account has been approved. Redirecting...',
                icon: '/favicon.ico',
            });
        }
        
        // Refresh user data - the useEffect above will handle redirect
        await refreshUser();
    });

    // ✅ Listen for account rejection
    useSocketEvent('account:rejected', (data) => {
        console.log('❌ Account rejected:', data);
        
        setNotification({
            type: 'error',
            title: 'Account Rejected',
            message: data.message || 'Your account has been rejected',
            reason: data.reason,
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Account Rejected', {
                body: data.reason || 'Your account application was rejected',
                icon: '/favicon.ico',
            });
        }
        
        setTimeout(() => {
            logout();
        }, 5000);
    });

    // ✅ Listen for account deletion
    useSocketEvent('account:deleted', (data) => {
        console.log('🗑️ Account deleted:', data);
        
        setNotification({
            type: 'error',
            title: 'Account Deleted',
            message: data.message || 'Your account has been deleted',
        });
        
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Account Deleted', {
                body: 'Your account has been removed by an administrator',
                icon: '/favicon.ico',
            });
        }
        
        setTimeout(() => {
            logout();
        }, 3000);
    });

    // ✅ Listen for role changes
    useSocketEvent('role:changed', async (data) => {
        console.log('🔄 Role changed:', data);
        
        setNotification({
            type: 'info',
            title: 'Role Updated',
            message: data.message || `Your role has been changed to ${data.newRole}`,
        });
        
        // Refresh user data - the useEffect above will handle redirect if approved
        await refreshUser();
    });

    // Auto-refresh to check approval status
    useEffect(() => {
        const interval = setInterval(async () => {
            await refreshUser();
            setLastChecked(new Date());
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [refreshUser]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refreshUser();
        setLastChecked(new Date());
        setTimeout(() => setIsRefreshing(false), 800);
    };

    const getTimeAgo = () => {
        const seconds = Math.floor((new Date() - lastChecked) / 1000);
        if (seconds < 10) return 'Just now';
        if (seconds < 60) return `${seconds}s ago`;
        const minutes = Math.floor(seconds / 60);
        return `${minutes}m ago`;
    };

    const [timeAgo, setTimeAgo] = useState('Just now');

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeAgo(getTimeAgo());
        }, 1000);
        return () => clearInterval(interval);
    }, [lastChecked]);

    // Request notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-white flex flex-col pb-safe">
                {/* Socket Status */}
                <SocketStatus />

                {/* Notification Modal */}
                {notification && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-sm">
                        <div 
                            className={`w-full sm:max-w-sm mx-0 sm:mx-4 rounded-t-2xl sm:rounded-2xl border-t sm:border overflow-hidden ${
                                notification.type === 'success' ? 'bg-white border-green-200' :
                                notification.type === 'error' ? 'bg-white border-red-200' :
                                'bg-white border-blue-200'
                            }`}
                        >
                            <div className="p-6 sm:p-8 text-center">
                                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                                    notification.type === 'success' ? 'bg-green-50 border border-green-200' :
                                    notification.type === 'error' ? 'bg-red-50 border border-red-200' :
                                    'bg-blue-50 border border-blue-200'
                                }`}>
                                    {notification.type === 'success' && (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {notification.type === 'error' && (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                    {notification.type === 'info' && (
                                        <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                    )}
                                </div>
                                <h2 className="text-lg sm:text-xl font-semibold text-black mb-2">{notification.title}</h2>
                                <p className="text-sm text-gray-600 mb-3">{notification.message}</p>
                                {notification.reason && (
                                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                        <p className="text-xs text-gray-500 font-medium">Reason:</p>
                                        <p className="text-sm text-black mt-1">{notification.reason}</p>
                                    </div>
                                )}
                                {notification.type === 'success' && (
                                    <p className="text-xs text-gray-500 mt-4">Redirecting to dashboard...</p>
                                )}
                                {notification.type === 'error' && (
                                    <p className="text-xs text-gray-500 mt-4">You will be logged out shortly...</p>
                                )}
                            </div>
                            <div className="h-safe-bottom sm:hidden" />
                        </div>
                    </div>
                )}

                {/* Header */}
                <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur-xl">
                    <div className="mx-auto max-w-screen-sm px-4 sm:px-6">
                        <div className="flex h-14 sm:h-16 items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-black">
                                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                    </svg>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-black">Restaurant</span>
                                {/* Connection Status */}
                                <div className="ml-1 sm:ml-3 flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                        {connected ? 'Live' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                className="text-xs sm:text-sm text-gray-600 hover:text-black transition-colors active:scale-95"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
                    <div className="w-full max-w-md space-y-6 sm:space-y-8">
                        {/* Status Icon */}
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center">
                                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                {/* Pulse indicator */}
                                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-amber-400 rounded-full border-2 border-white shadow-sm">
                                    <div className="absolute inset-0 bg-amber-400 rounded-full animate-ping opacity-75" />
                                </div>
                            </div>
                        </div>

                        {/* Title & Description */}
                        <div className="text-center space-y-2">
                            <h1 className="text-xl sm:text-2xl font-bold text-black">
                                Pending Approval
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto leading-relaxed">
                                Your account is being reviewed by our team. You'll be notified automatically once approved.
                            </p>
                        </div>

                        {/* Live Status Badge */}
                        {connected && (
                            <div className="flex items-center justify-center">
                                <div className="flex items-center gap-2 px-3 py-1.5 sm:py-2 bg-green-50 border border-green-200 rounded-full">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-xs sm:text-sm text-green-700 font-medium">Monitoring for updates</span>
                                </div>
                            </div>
                        )}

                        {/* Account Info Card */}
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                            {/* Header */}
                            <div className="px-4 sm:px-5 py-3 border-b border-gray-200 bg-gray-50">
                                <div className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Account Details
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                                {/* User Info */}
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm sm:text-base font-semibold text-gray-700">
                                            {user?.name?.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm sm:text-base font-semibold text-black truncate">
                                            {user?.name}
                                        </div>
                                        <div className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
                                            {user?.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200" />

                                {/* Role */}
                                <div className="flex items-center justify-between">
                                    <span className="text-xs sm:text-sm text-gray-600">Role</span>
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 border border-gray-200 rounded-md text-xs sm:text-sm text-black font-medium capitalize">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        {user?.role}
                                    </span>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-200" />

                                {/* Status Timeline */}
                                <div className="space-y-3">
                                    <div className="text-xs sm:text-sm text-gray-600 font-semibold">Approval Status</div>
                                    
                                    <div className="space-y-2.5 sm:space-y-3">
                                        {/* Email Verified */}
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-xs sm:text-sm text-gray-700">
                                                    Email Verified
                                                </span>
                                            </div>
                                            <span className="text-xs sm:text-sm text-green-600 font-medium">Complete</span>
                                        </div>

                                        {/* Manager Review */}
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                                                    user?.managerApproved 
                                                        ? 'bg-green-50 border border-green-200' 
                                                        : 'bg-amber-50 border border-amber-200'
                                                }`}>
                                                    {user?.managerApproved ? (
                                                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    )}
                                                </div>
                                                <span className="text-xs sm:text-sm text-gray-700">
                                                    Manager Review
                                                </span>
                                            </div>
                                            <span className={`text-xs sm:text-sm font-medium ${user?.managerApproved ? 'text-green-600' : 'text-amber-600'}`}>
                                                {user?.managerApproved ? 'Complete' : 'Pending'}
                                            </span>
                                        </div>

                                        {/* Admin Approval */}
                                        <div className="flex items-center justify-between group">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                </div>
                                                <span className="text-xs sm:text-sm text-gray-700">
                                                    Admin Approval
                                                </span>
                                            </div>
                                            <span className="text-xs sm:text-sm text-amber-600 font-medium">Pending</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                            <div className="flex gap-3">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-xs sm:text-sm text-blue-900 leading-relaxed">
                                        {connected 
                                            ? "You'll be redirected automatically once approved. No need to refresh."
                                            : "Approval typically takes 24-48 hours. You'll receive an email notification once your account is activated."
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 sm:space-y-3">
                            {/* Refresh Button */}
                            <button
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="w-full h-11 sm:h-12 bg-white border border-gray-200 text-black text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group active:scale-95"
                            >
                                <svg 
                                    className={`w-4 h-4 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>{isRefreshing ? 'Checking...' : 'Check Status'}</span>
                                <span className="text-xs text-gray-400">· {timeAgo}</span>
                            </button>

                            {/* Sign Out Button */}
                            <button
                                onClick={logout}
                                className="w-full h-11 sm:h-12 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all duration-200 active:scale-95"
                            >
                                Sign Out
                            </button>
                        </div>

                        {/* Footer Help */}
                        <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                            <button className="text-gray-500 hover:text-black transition-colors">
                                Help Center
                            </button>
                            <span className="text-gray-300">·</span>
                            <button className="text-gray-500 hover:text-black transition-colors">
                                Contact Support
                            </button>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="border-t border-gray-200 mt-auto">
                    <div className="mx-auto max-w-screen-sm px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-center">
                        <p className="text-[10px] sm:text-xs text-gray-500">
                            © {new Date().getFullYear()} Restaurant Management. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </ProtectedRoute>
    );
}