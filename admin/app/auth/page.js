'use client';

import { useState, Suspense, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthContent() {
  const { register, verifyOTP, login, forgotPassword, resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // ✅ Only read searchParams once on mount
  const [view, setView] = useState('login');
  const [email, setEmail] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    otp: '',
    newPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ✅ Sync with URL params only once
  useEffect(() => {
    const urlView = searchParams.get('view');
    const urlEmail = searchParams.get('email');
    
    if (urlView) setView(urlView);
    if (urlEmail) {
      setEmail(urlEmail);
      setFormData(prev => ({ ...prev, email: urlEmail }));
    }
  }, []); // Empty dependency array - run once

  const changeView = (newView) => {
    setView(newView);
    setError('');
    setSuccess('');
  };

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login({
        email: formData.email,
        password: formData.password,
      });

      if (!response.success) {
        setError(response.message);
      }
      // ✅ Don't redirect here - let AuthContext handle it
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await register({
        email: formData.email,
        password: formData.password,
      });

      if (response.success) {
        setSuccess(response.message);
        setEmail(formData.email);
        setTimeout(() => changeView('verify'), 1500);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await verifyOTP({ 
        email: email || formData.email, 
        otp: formData.otp 
      });

      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => changeView('login'), 1500);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forgot Password
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const response = await forgotPassword({ email: formData.email });

      if (response.success) {
        setSuccess(response.message);
        setEmail(formData.email);
        setTimeout(() => changeView('reset'), 2000);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.otp.length !== 6) {
      setError('OTP must be 6 digits');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await resetPassword({
        email: email || formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        setSuccess(response.message);
        setTimeout(() => changeView('login'), 2000);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background Effects - Perfect Grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-500/5"></div>
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Professional Branding */}
        <div className="hidden lg:flex lg:w-1/2 p-12 flex-col justify-between">
          <div>
            {/* Logo */}
            <div className="flex items-center space-x-3 mb-20">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-black font-bold text-lg">PO</span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">Project Origin</h1>
                <p className="text-xs text-gray-500">Restaurant Management System</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="max-w-lg">
              <h2 className="text-4xl font-semibold text-white mb-5 tracking-tight leading-tight">
                Professional<br />
                Restaurant<br />
                Management
              </h2>
              <p className="text-gray-400 text-base leading-relaxed mb-10">
                Streamline operations, manage orders, and optimize your restaurant's performance with our comprehensive management platform.
              </p>

              {/* Features List */}
              <div className="space-y-3">
                {[
                  'Real-time Order Management',
                  'Staff & Table Session Control',
                  'Advanced Analytics & Reporting',
                  'Secure & Reliable Infrastructure'
                ].map((feature, i) => (
                  <div key={i} className="flex items-center space-x-3 group">
                    <div className="w-5 h-5 rounded-full border border-gray-800 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div>
            <p className="text-gray-600 text-xs">© 2024 Project Origin. All rights reserved.</p>
          </div>
        </div>

        {/* Right Side - Auth Forms */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-12">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center mr-3">
                <span className="text-black font-bold text-lg">PO</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-base">Project Origin</h1>
                <p className="text-gray-500 text-xs">Restaurant Management</p>
              </div>
            </div>

            {/* Auth Card */}
            <div className="bg-black/50 backdrop-blur-xl border border-gray-800 rounded-xl p-8 shadow-2xl">
              
              {/* LOGIN */}
              {view === 'login' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-1">Welcome Back</h2>
                    <p className="text-gray-400 text-sm">Sign in to your account</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="admin@example.com"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="Enter your password"
                        disabled={isSubmitting}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 space-y-3 text-center">
                    <button onClick={() => changeView('forgot')} className="text-sm text-gray-400 hover:text-white transition">
                      Forgot password?
                    </button>
                    <div className="text-sm text-gray-400">
                      Don't have an account?{' '}
                      <button onClick={() => changeView('register')} className="text-blue-500 hover:text-blue-400 font-medium">
                        Sign up
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* REGISTER */}
              {view === 'register' && (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white mb-1">Create Account</h2>
                    <p className="text-gray-400 text-sm">Get started with Project Origin</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="admin@example.com"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Password</label>
                      <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="Minimum 6 characters"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="Confirm password"
                        disabled={isSubmitting}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? 'Creating account...' : 'Create Account'}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 text-center text-sm text-gray-400">
                    Already have an account?{' '}
                    <button onClick={() => changeView('login')} className="text-blue-500 hover:text-blue-400 font-medium">
                      Sign in
                    </button>
                  </div>
                </>
              )}

              {/* VERIFY OTP */}
              {view === 'verify' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-1">Verify Email</h2>
                    <p className="text-gray-400 text-sm">
                      Code sent to <span className="text-white">{email || formData.email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2 text-center">Verification Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-center text-xl tracking-[0.5em] font-mono"
                        placeholder="000000"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || formData.otp.length !== 6}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? 'Verifying...' : 'Verify Email'}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                    <button onClick={() => changeView('login')} className="text-sm text-gray-400 hover:text-white transition">
                      ← Back to sign in
                    </button>
                  </div>
                </>
              )}

              {/* FORGOT PASSWORD */}
              {view === 'forgot' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-1">Reset Password</h2>
                    <p className="text-gray-400 text-sm">Enter your email to receive a reset code</p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Email</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="admin@example.com"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                    <button onClick={() => changeView('login')} className="text-sm text-gray-400 hover:text-white transition">
                      ← Back to sign in
                    </button>
                  </div>
                </>
              )}

              {/* RESET PASSWORD */}
              {view === 'reset' && (
                <>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-white mb-1">New Password</h2>
                    <p className="text-gray-400 text-sm">
                      Code sent to <span className="text-white">{email || formData.email}</span>
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2 text-center">Verification Code</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-center text-lg tracking-widest font-mono"
                        placeholder="000000"
                        disabled={isSubmitting}
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">New Password</label>
                      <input
                        type="password"
                        required
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="Minimum 6 characters"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Confirm Password</label>
                      <input
                        type="password"
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 bg-black border border-gray-800 text-white text-sm rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition placeholder-gray-600"
                        placeholder="Confirm password"
                        disabled={isSubmitting}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                      {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-800 text-center">
                    <button onClick={() => changeView('login')} className="text-sm text-gray-400 hover:text-white transition">
                      ← Back to sign in
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer - Mobile */}
            <div className="lg:hidden mt-8 text-center text-xs text-gray-600">
              © 2024 Project Origin. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}