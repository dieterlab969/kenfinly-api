import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useRecaptchaConfig } from '../components/App';
import { Eye, EyeOff, Wallet, TrendingUp, Shield, Zap, ChevronRight, AlertCircle } from 'lucide-react';

const features = [
    { icon: TrendingUp, title: 'Smart Analytics', desc: 'Visualize spending patterns across all accounts' },
    { icon: Shield, title: 'Bank-level Security', desc: 'Your data is encrypted and always private' },
    { icon: Zap, title: 'Real-time Sync', desc: 'Track transactions the moment they happen' },
];

const FloatingCard = ({ className, children }) => (
    <div className={`absolute rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 shadow-xl ${className}`}>
        {children}
    </div>
);

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const { executeRecaptcha } = useGoogleReCaptcha();
    const { login, user } = useAuth();
    const { t } = useTranslation();
    const { enabled: recaptchaEnabled } = useRecaptchaConfig();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/dashboard');
    }, [user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let recaptchaToken = null;
            if (recaptchaEnabled) {
                if (!executeRecaptcha) {
                    setError('reCAPTCHA not loaded. Please refresh the page.');
                    setLoading(false);
                    return;
                }
                recaptchaToken = await executeRecaptcha('login');
            }
            const result = await login(email, password, recaptchaToken);
            if (result.success) {
                navigate('/dashboard');
            } else if (result.action === 'verify_email') {
                navigate('/verification-pending', {
                    state: {
                        user: result.user,
                        source: 'login',
                        verificationSent: result.verification_sent,
                        message: result.message,
                    },
                });
            } else {
                setError(result.message || t('auth.login_failed'));
            }
        } catch {
            setError(t('auth.login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left branding panel ── */}
            <div
                className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 40%, #4f46e5 70%, #6d28d9 100%)' }}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute top-1/2 -right-24 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />
                    <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
                    {/* Grid dots */}
                    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.5" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots)" />
                    </svg>
                </div>

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center border border-white/25">
                        <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white text-xl font-bold tracking-wide">Kenfinly</span>
                </div>

                {/* Center content */}
                <div className="relative z-10 flex-1 flex flex-col justify-center max-w-lg mx-auto w-full py-16">
                    <h1 className="text-white text-4xl font-bold leading-tight mb-4">
                        Take control of<br />
                        <span className="text-indigo-200">your financial future</span>
                    </h1>
                    <p className="text-indigo-200/80 text-lg mb-12 leading-relaxed">
                        One dashboard to track every account, every currency, and every goal — all in real time.
                    </p>

                    {/* Feature list */}
                    <div className="space-y-5">
                        {features.map(({ icon: Icon, title, desc }) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Icon className="w-5 h-5 text-indigo-200" />
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">{title}</p>
                                    <p className="text-indigo-300/70 text-sm mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Floating stat cards */}
                    <div className="relative h-36 mt-14">
                        <FloatingCard className="left-0 top-0">
                            <p className="text-white/60 text-xs mb-1">Monthly savings</p>
                            <p className="text-white font-bold text-lg">$2,840</p>
                            <span className="text-emerald-400 text-xs font-medium">↑ 12.4% this month</span>
                        </FloatingCard>
                        <FloatingCard className="right-4 top-6">
                            <p className="text-white/60 text-xs mb-1">Accounts synced</p>
                            <div className="flex items-center gap-1.5">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className={`w-6 h-6 rounded-full border-2 border-white/30 ${['bg-blue-400','bg-purple-400','bg-green-400','bg-orange-400'][i]}`} />
                                ))}
                                <span className="text-white text-sm font-bold ml-1">4</span>
                            </div>
                        </FloatingCard>
                    </div>
                </div>

                {/* Bottom tagline */}
                <div className="relative z-10">
                    <p className="text-indigo-300/60 text-sm">
                        Trusted by thousands of users to manage their finances daily.
                    </p>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white min-h-screen">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2.5 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 text-xl font-bold">Kenfinly</span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-8">
                        <h2 className="text-gray-900 text-3xl font-bold mb-2">Welcome back</h2>
                        <p className="text-gray-500 text-sm">Sign in to continue to your dashboard</p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email field */}
                        <div className="relative">
                            <label
                                htmlFor="email"
                                className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                                    emailFocused || email
                                        ? 'top-2 text-xs font-medium text-indigo-600'
                                        : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                                }`}
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setEmailFocused(true)}
                                onBlur={() => setEmailFocused(false)}
                                className="w-full pt-6 pb-2 px-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-100"
                            />
                        </div>

                        {/* Password field */}
                        <div className="relative">
                            <label
                                htmlFor="password"
                                className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                                    passwordFocused || password
                                        ? 'top-2 text-xs font-medium text-indigo-600'
                                        : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                                }`}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setPasswordFocused(true)}
                                onBlur={() => setPasswordFocused(false)}
                                className="w-full pt-6 pb-2 pl-4 pr-12 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 text-sm outline-none transition-all duration-200 focus:border-indigo-500 focus:bg-white focus:ring-3 focus:ring-indigo-100"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>

                        {/* Forgot password */}
                        <div className="flex justify-end">
                            <Link
                                to="/forgot-password"
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                            >
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="relative w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
                            style={{ background: loading ? '#6366f1' : 'linear-gradient(135deg, #4f46e5 0%, #6d28d9 100%)' }}
                        >
                            <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200" />
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    <span>Signing in…</span>
                                </>
                            ) : (
                                <>
                                    <span>Sign in</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Register link */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link
                            to="/register"
                            className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors"
                        >
                            Create one free
                        </Link>
                    </p>

                    {/* Security note */}
                    <div className="mt-10 flex items-center justify-center gap-2 text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                        <p className="text-xs">256-bit SSL encryption · Your data stays private</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
