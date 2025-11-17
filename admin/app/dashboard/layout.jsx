'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  User,
  CreditCard,
  Users,
  BarChart3,
  Search,
  ChevronRight,
  Home,
  Menu,
  X,
  Circle,
  Sparkles,
  Zap,
  TrendingUp,
  Bell,
  Command,
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Sales', href: '/dashboard/sales', icon: TrendingUp },
  { name: 'Menu', href: '/dashboard/menu', icon: FileText },
  { name: 'Employees', href: '/dashboard/employees', icon: Users },
];

export default function DashboardLayout({ children }) {
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout, isLoading } = useAuth();
  
  const userDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuOpen && userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setUserMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Auth redirect
  useEffect(() => {
    if (!isLoading && !admin && mounted) {
      router.push('/auth');
    }
  }, [admin, isLoading, router, mounted]);

  // Get page title
  const getPageTitle = () => {
    const segment = pathname.split('/').filter(Boolean).pop();
    if (!segment || segment === 'dashboard') return 'Overview';
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  // Filter navigation for search
  const filteredNavigation = navigation.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa] dark:bg-black">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-gray-200 dark:border-[#333] border-t-black dark:border-t-white rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black">
      {/* 📱 MOBILE BOTTOM NAV */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-t border-gray-200 dark:border-[#222] z-50 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center gap-1 transition-all active:scale-95 ${
                  isActive
                    ? 'text-black dark:text-white'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-black dark:bg-white rounded-t-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-[#222] flex-col z-40">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-[#222] shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 shadow-lg">
              <svg width="16" height="16" viewBox="0 0 76 65" fill="none">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" className="dark:fill-black"/>
              </svg>
            </div>
            <span className="font-bold text-black dark:text-white">Acme Inc</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111] hover:text-black dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Help Card */}
        <div className="p-4 border-t border-gray-200 dark:border-[#222] shrink-0">
          <div className="bg-gray-100 dark:bg-[#111] rounded-xl p-4 border border-gray-200 dark:border-[#222] hover:border-gray-300 dark:hover:border-[#333] transition-all cursor-pointer group">
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5 text-white dark:text-black" />
            </div>
            <h4 className="text-sm font-bold text-black dark:text-white mb-1">Need help?</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              Check our docs and tutorials
            </p>
            <Link
              href="/dashboard/help"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-black dark:text-white hover:gap-2 transition-all"
            >
              Get Support
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-200 dark:border-[#222]">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
            {/* Left Section */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Logo - Mobile */}
              <Link href="/dashboard" className="lg:hidden flex items-center gap-2 shrink-0">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <svg width="14" height="14" viewBox="0 0 76 65" fill="none">
                    <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="white" className="dark:fill-black"/>
                  </svg>
                </div>
                <span className="font-bold text-black dark:text-white text-sm">Acme Inc</span>
              </Link>

              {/* Page Title - Desktop */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-black dark:text-white">
                  {getPageTitle()}
                </h1>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 px-3 h-9 bg-gray-100 dark:bg-[#111] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] border border-gray-200 dark:border-[#222] rounded-lg transition-all"
              >
                <Search className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="hidden sm:inline text-xs text-gray-600 dark:text-gray-400 font-medium">
                  Search...
                </span>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-black border border-gray-200 dark:border-[#333] rounded">
                  <Command className="w-2.5 h-2.5" />K
                </kbd>
              </button>

              {/* User Menu */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 h-9 bg-gray-100 dark:bg-[#111] hover:bg-gray-200 dark:hover:bg-[#1a1a1a] rounded-lg transition-all"
                >
                  <div className="w-6 h-6 bg-black dark:bg-white rounded-full flex items-center justify-center ring-2 ring-gray-200 dark:ring-[#222]">
                    <span className="text-white dark:text-black text-xs font-bold">
                      {admin?.name?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                  <ChevronDown className={`hidden sm:block w-3.5 h-3.5 text-gray-600 dark:text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black border border-gray-200 dark:border-[#222] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-2">
                    {/* User Info */}
                    <div className="px-4 py-4 border-b border-gray-200 dark:border-[#222] bg-gray-50 dark:bg-[#111]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-black dark:bg-white rounded-full flex items-center justify-center">
                          <span className="text-white dark:text-black text-lg font-bold">
                            {admin?.name?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-black dark:text-white truncate">
                            {admin?.name || 'Admin User'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {admin?.email || 'admin@example.com'}
                          </p>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black dark:bg-white rounded-lg">
                        <Zap className="w-3 h-3 text-white dark:text-black" />
                        <span className="text-xs font-semibold text-white dark:text-black">
                          Admin
                        </span>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <Link
                        href="/dashboard/help"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111] transition-colors font-medium"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span>Help & Support</span>
                      </Link>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-200 dark:border-[#222] p-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="pb-20 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Search Modal */}
      {searchOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 animate-in fade-in">
          <div
            className="absolute inset-0 bg-black/60 dark:bg-black/90 backdrop-blur-md"
            onClick={() => setSearchOpen(false)}
          />
          
          <div className="relative w-full max-w-2xl bg-white dark:bg-black border-2 border-gray-200 dark:border-[#222] rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-top-4">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b-2 border-gray-200 dark:border-[#222]">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search pages, commands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm bg-transparent border-none outline-none text-black dark:text-white placeholder-gray-400"
              />
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-gray-500 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded">
                ESC
              </kbd>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchQuery === '' ? (
                <div className="p-4">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Quick Actions
                  </div>
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111] rounded-xl transition-all group"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="w-9 h-9 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : filteredNavigation.length > 0 ? (
                <div className="p-4">
                  <div className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Results
                  </div>
                  <div className="space-y-1">
                    {filteredNavigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center gap-3 px-3 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#111] rounded-xl transition-all group"
                          onClick={() => setSearchOpen(false)}
                        >
                          <div className="w-9 h-9 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-semibold text-black dark:text-white mb-1">No results found</p>
                  <p className="text-xs text-gray-500">Try a different search term</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}