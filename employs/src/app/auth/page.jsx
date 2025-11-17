'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

function AuthContent() {
    const [mode, setMode] = useState('login');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        otp: '',
        newPassword: '',
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [rateLimitInfo, setRateLimitInfo] = useState(null);
    const [countdown, setCountdown] = useState(0);

    const { login, register, verifyOTP, forgotPassword, resetPassword } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const otpInputRef = useRef(null);

    useEffect(() => {
        const modeParam = searchParams.get('mode');
        const emailParam = searchParams.get('email');
        
        if (modeParam) setMode(modeParam);
        if (emailParam) setFormData(prev => ({ ...prev, email: emailParam }));
    }, [searchParams]);

    useEffect(() => {
        if (mode === 'verify-otp' && otpInputRef.current) {
            setTimeout(() => otpInputRef.current?.focus(), 100);
        }
    }, [mode]);

    // Countdown timer for rate limiting
    useEffect(() => {
        if (countdown > 0) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        setRateLimitInfo(null);
                        setError('');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [countdown]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'otp') {
            const formatted = value.replace(/\D/g, '').slice(0, 6);
            setFormData({ ...formData, [name]: formatted });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        setError('');
        setSuccess('');
    };

    const parseRateLimitError = (errorMessage) => {
        // Parse error message for rate limit info
        const minutesMatch = errorMessage.match(/(\d+)\s*minute/i);
        const attemptsMatch = errorMessage.match(/(\d+)\s*attempt/i);
        
        if (minutesMatch) {
            const minutes = parseInt(minutesMatch[1]);
            setCountdown(minutes * 60);
            setRateLimitInfo({
                type: 'rate_limit',
                minutes,
                remainingAttempts: attemptsMatch ? parseInt(attemptsMatch[1]) : 0
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);
        setRateLimitInfo(null);

        try {
            switch (mode) {
                case 'login':
                    await handleLogin();
                    break;
                case 'register':
                    await handleRegister();
                    break;
                case 'verify-otp':
                    await handleVerifyOTP();
                    break;
                case 'forgot-password':
                    await handleForgotPassword();
                    break;
                case 'reset-password':
                    await handleResetPassword();
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async () => {
        const result = await login(formData.email, formData.password);

        if (result.success) {
            const { user } = result;

            if (!user.isAproved) {
                router.push('/pending-approval');
                return;
            }

            const roleRoutes = {
                admin: '/admin',
                waiter: '/waiter',
                kitchen: '/kitchen',
            };

            router.push(roleRoutes[user.role] || '/');
        } else {
            setError(result.message);
            
            // Check if it's a rate limit error
            if (result.message?.toLowerCase().includes('too many') || 
                result.message?.toLowerCase().includes('rate limit')) {
                parseRateLimitError(result.message);
            }
        }
    };

    const handleRegister = async () => {
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await register(
            formData.name,
            formData.email,
            formData.password,
            'waiter'
        );

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => setMode('verify-otp'), 1500);
        } else {
            setError(result.message);
            if (result.message?.toLowerCase().includes('too many') || 
                result.message?.toLowerCase().includes('rate limit')) {
                parseRateLimitError(result.message);
            }
        }
    };

    const handleVerifyOTP = async () => {
        const result = await verifyOTP(formData.email, formData.otp);

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                setMode('login');
                setFormData({ ...formData, otp: '' });
            }, 1500);
        } else {
            setError(result.message);
        }
    };

    const handleForgotPassword = async () => {
        const result = await forgotPassword(formData.email);

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => setMode('reset-password'), 1500);
        } else {
            setError(result.message);
        }
    };

    const handleResetPassword = async () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await resetPassword(
            formData.email,
            formData.otp,
            formData.newPassword
        );

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                setMode('login');
                setFormData({ 
                    name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    otp: '',
                    newPassword: '',
                });
            }, 1500);
        } else {
            setError(result.message);
        }
    };

    const switchMode = (newMode) => {
        setMode(newMode);
        setError('');
        setSuccess('');
        setRateLimitInfo(null);
    };

    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-black to-gray-800 shadow-lg shadow-black/20">
                        <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-black bg-gradient-to-r from-black to-gray-700 bg-clip-text">
                        Restaurant Management
                    </h1>
                    <p className="mt-2 text-sm text-gray-600 font-medium">Staff Portal</p>
                </div>

                {/* Auth Card */}
                <div className="rounded-2xl border border-gray-200 bg-white shadow-xl shadow-gray-100/50">
                    {/* Tabs */}
                    {(mode === 'login' || mode === 'register') && (
                        <div className="border-b border-gray-200 p-2">
                            <div className="flex gap-2 bg-gray-100 rounded-xl p-1">
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                        mode === 'login'
                                            ? 'bg-white text-black shadow-md shadow-gray-200/50'
                                            : 'text-gray-600 hover:text-black'
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    type="button"
                                    onClick={() => switchMode('register')}
                                    className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 ${
                                        mode === 'register'
                                            ? 'bg-white text-black shadow-md shadow-gray-200/50'
                                            : 'text-gray-600 hover:text-black'
                                    }`}
                                >
                                    Register
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                        {/* Header */}
                        <div className="mb-6">
                            {mode === 'login' && (
                                <div>
                                    <h2 className="text-xl font-bold text-black">Welcome back</h2>
                                    <p className="mt-1 text-sm text-gray-600">Sign in to your account to continue</p>
                                </div>
                            )}
                            {mode === 'register' && (
                                <div>
                                    <h2 className="text-xl font-bold text-black">Create account</h2>
                                    <p className="mt-1 text-sm text-gray-600">Join our team today</p>
                                </div>
                            )}
                            {mode === 'verify-otp' && (
                                <div className="text-center">
                                    <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
                                        <svg className="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-black">Verify your email</h2>
                                    <p className="mt-2 text-sm text-gray-600">
                                        We sent a code to<br />
                                        <span className="font-semibold text-black">{formData.email}</span>
                                    </p>
                                </div>
                            )}
                            {mode === 'forgot-password' && (
                                <div>
                                    <h2 className="text-xl font-bold text-black">Reset password</h2>
                                    <p className="mt-1 text-sm text-gray-600">We'll send you a verification code</p>
                                </div>
                            )}
                            {mode === 'reset-password' && (
                                <div>
                                    <h2 className="text-xl font-bold text-black">Create new password</h2>
                                    <p className="mt-1 text-sm text-gray-600">Enter the code and your new password</p>
                                </div>
                            )}
                        </div>

                        {/* Rate Limit Warning */}
                        {rateLimitInfo && countdown > 0 && (
                            <div className="mb-6 rounded-xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <svg className="h-5 w-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-bold text-orange-900 mb-1">Too Many Attempts</h3>
                                        <p className="text-sm text-orange-800 mb-3">
                                            For security, please wait before trying again.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2 bg-orange-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-1000 ease-linear"
                                                    style={{ width: `${(countdown / (rateLimitInfo.minutes * 60)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-mono font-bold text-orange-700 min-w-[3rem] text-right">
                                                {formatCountdown(countdown)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* LOGIN */}
                            {mode === 'login' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Email Address
                                        </label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            disabled={countdown > 0}
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="block text-sm font-semibold text-gray-900">
                                                Password
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => switchMode('forgot-password')}
                                                className="text-sm font-medium text-gray-600 hover:text-black transition-colors"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                disabled={countdown > 0}
                                                className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                placeholder="Enter your password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                disabled={countdown > 0}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors rounded-lg hover:bg-gray-100 disabled:opacity-50"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {showPassword ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* REGISTER */}
                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Full Name
                                        </label>
                                        <input
                                            name="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            placeholder="John Doe"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Email Address
                                        </label>
                                        <input
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            placeholder="you@example.com"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="password"
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={handleChange}
                                                required
                                                className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                                placeholder="Minimum 6 characters"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors rounded-lg hover:bg-gray-100"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {showPassword ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                name="confirmPassword"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={handleChange}
                                                required
                                                className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                                placeholder="Re-enter password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-black transition-colors rounded-lg hover:bg-gray-100"
                                            >
                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    {showConfirmPassword ? (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                                    ) : (
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                    )}
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* VERIFY OTP */}
                            {mode === 'verify-otp' && (
                                <div>
                                    <label className="mb-2 block text-center text-sm font-semibold text-gray-900">
                                        6-Digit Code
                                    </label>
                                    <input
                                        ref={otpInputRef}
                                        name="otp"
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.otp}
                                        onChange={handleChange}
                                        required
                                        maxLength={6}
                                        className="flex h-16 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-center font-mono text-2xl font-bold tracking-[0.5em] text-gray-900 placeholder:tracking-[0.5em] placeholder:text-gray-300 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                        placeholder="000000"
                                    />
                                </div>
                            )}

                            {/* FORGOT PASSWORD */}
                            {mode === 'forgot-password' && (
                                <div>
                                    <label className="mb-2 block text-sm font-semibold text-gray-900">
                                        Email Address
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            )}

                            {/* RESET PASSWORD */}
                            {mode === 'reset-password' && (
                                <>
                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Verification Code
                                        </label>
                                        <input
                                            name="otp"
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.otp}
                                            onChange={handleChange}
                                            required
                                            maxLength={6}
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-center font-mono text-lg font-bold tracking-[0.3em] text-gray-900 placeholder:tracking-[0.3em] placeholder:text-gray-300 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            placeholder="000000"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            New Password
                                        </label>
                                        <input
                                            name="newPassword"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={handleChange}
                                            required
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            placeholder="Minimum 6 characters"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-gray-900">
                                            Confirm Password
                                        </label>
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            required
                                            className="flex h-12 w-full rounded-xl border-2 border-gray-200 bg-white px-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black focus:ring-4 focus:ring-black/5 transition-all"
                                            placeholder="Re-enter new password"
                                        />
                                    </div>
                                </>
                            )}

                            {/* Error Message */}
                            {error && !rateLimitInfo && (
                                <div className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 p-4">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-red-800">{error}</p>
                                    </div>
                                </div>
                            )}

                            {/* Success Message */}
                            {success && (
                                <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                                    <div className="flex gap-3">
                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                                            <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-medium text-green-800">{success}</p>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading || countdown > 0}
                                className="flex h-12 w-full items-center justify-center rounded-xl bg-gradient-to-r from-black to-gray-800 text-sm font-bold text-white shadow-lg shadow-black/10 hover:shadow-xl hover:shadow-black/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]"
                            >
                                {loading ? (
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                                ) : countdown > 0 ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                        Locked for {formatCountdown(countdown)}
                                    </span>
                                ) : (
                                    <>
                                        {mode === 'login' && 'Sign In'}
                                        {mode === 'register' && 'Create Account'}
                                        {mode === 'verify-otp' && 'Verify Email'}
                                        {mode === 'forgot-password' && 'Send Verification Code'}
                                        {mode === 'reset-password' && 'Reset Password'}
                                    </>
                                )}
                            </button>

                            {/* Back Button */}
                            {(mode === 'verify-otp' || mode === 'forgot-password' || mode === 'reset-password') && (
                                <button
                                    type="button"
                                    onClick={() => switchMode('login')}
                                    className="w-full flex items-center justify-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors pt-2"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Back to sign in
                                </button>
                            )}
                        </form>
                    </div>
                </div>

                {/* Footer */}
                <p className="mt-8 text-center text-xs text-gray-500">
                    © {new Date().getFullYear()} Restaurant Management. All rights reserved.
                </p>
            </div>
        </div>
    );
}

function AuthLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-gray-200 border-t-black" />
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<AuthLoading />}>
            <AuthContent />
        </Suspense>
    );
}