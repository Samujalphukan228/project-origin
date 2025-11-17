'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        // Not authenticated
        if (!user) {
            if (pathname !== '/auth') {
                router.push('/auth');
            }
            return;
        }

        // Not approved - send to pending-approval
        if (!user.isAproved) {
            if (pathname !== '/pending-approval') {
                router.push('/pending-approval');
            }
            return;
        }

        // ✅ User is approved - redirect from pending-approval to dashboard
        if (user.isAproved && pathname === '/pending-approval') {
            const roleRoutes = {
                admin: '/admin',
                manager: '/manager',
                waiter: '/waiter',
                kitchen: '/kitchen',
            };
            router.push(roleRoutes[user.role] || '/');
            return;
        }

        // Check role permissions
        if (allowedRoles && !allowedRoles.includes(user.role)) {
            const roleRoutes = {
                admin: '/admin',
                manager: '/manager',
                waiter: '/waiter',
                kitchen: '/kitchen',
            };
            router.push(roleRoutes[user.role] || '/auth');
        }
    }, [user, loading, allowedRoles, router, pathname]);

    // ✅ WHITE LOADING SCREEN
    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Loading...</p>
                </div>
            </div>
        );
    }

    // Show loading while redirecting
    if (!user) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (!user.isAproved && pathname !== '/pending-approval') {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
            </div>
        );
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Redirecting...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default ProtectedRoute;