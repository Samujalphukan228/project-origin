'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const router = useRouter();
  const { admin, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (admin) {
        router.push('/dashboard');
      } else {
        router.push('/auth');
      }
    }
  }, [admin, isLoading, router]);

  // Loading state
  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="relative">
        <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-spin"></div>
      </div>
    </div>
  );
}