import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useRecaptchaConfig } from '../components/App';
import {
    Eye, EyeOff, Wallet, CheckCircle2, AlertCircle,
    Shield, TrendingUp, Target, ChevronRight,
} from 'lucide-react';

const steps = [
    { icon: Target,     title: 'Set your goals',     desc: 'Define savings targets and budgets that matter to you' },
    { icon: TrendingUp, title: 'Track everything',   desc: 'Connect accounts and watch your progress in real time' },
    { icon: Shield,     title: 'Stay in control',    desc: 'Get smart alerts before you overspend' },
];

const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8)             score++;
    if (/[A-Z]/.test(pw))           score++;
    if (/[0-9]/.test(pw))           score++;
    if (/[^A-Za-z0-9]/.test(pw))   score++;
    return score;
};

const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const strengthColor = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];

const FloatingField = ({ id, name, label, type = 'text', autoComplete, value, onChange, error, children }) => {
    const [focused, setFocused] = useState(false);
    const lifted = focused || !!value;
    return (
        <div>
            <div className="relative">
                <label
                    htmlFor={id}
                    className={`absolute left-4 transition-all duration-200 pointer-events-none z-10 ${
                        lifted ? 'top-2 text-xs font-medium text-indigo-600' : 'top-1/2 -translate-y-1/2 text-sm text-gray-400'
                    }`}
                >
                    {label}
                </label>
                <input
                    id={id}
                    name={name}
                    type={type}
                    autoComplete={autoComplete}
                    required
                    value={value}
                    onChange={onChange}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    className={`w-full pt-6 pb-2 pl-4 pr-10 bg-gray-50 border rounded-xl text-gray-900 text-sm outline-none transition-all duration-200 focus:bg-white focus:ring-3 ${
                        error
                            ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                            : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-100'
                    }`}
                />
                {children}
            </div>
            {error && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {error}
                </p>
            )}
        </div>
    );
};

const Register = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', passwordConfirmation: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm]   = useState(false);
    const [errors, setErrors]             = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading]           = useState(false);

    const { executeRecaptcha }        = useGoogleReCaptcha();
    const { register, user }          = useAuth();
    const { t }                       = useTranslation();
    const { enabled: recaptchaEnabled } = useRecaptchaConfig();
    const navigate                    = useNavigate();

    useEffect(() => { if (user) navigate('/dashboard'); }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');
        setLoading(true);
        try {
            let recaptchaToken = null;
            if (recaptchaEnabled) {
                if (!executeRecaptcha) {
                    setErrors({ general: ['reCAPTCHA not loaded. Please refresh the page.'] });
                    setLoading(false);
                    return;
                }
                recaptchaToken = await executeRecaptcha('register');
            }
            const result = await register(formData.name, formData.email, formData.password, formData.passwordConfirmation, recaptchaToken);
            if (result.success) {
                setSuccessMessage(result.message || t('auth.register_success'));
                setTimeout(() => navigate('/verification-pending', { state: { user: result.user } }), 1500);
            } else {
                setErrors(result.errors || { general: [t('auth.register_error')] });
            }
        } catch {
            setErrors({ general: [t('auth.register_error')] });
        } finally {
            setLoading(false);
        }
    };

    const strength = getStrength(formData.password);

    return (
        <div className="min-h-screen flex">
            {/* ── Left branding panel ── */}
            <div
                className="hidden lg:flex lg:w-[55%] relative overflow-hidden flex-col justify-between p-12"
                style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3730a3 40%, #4f46e5 70%, #6d28d9 100%)' }}
            >
                {/* Background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
                    <div className="absolute top-1/3 -left-24 w-80 h-80 rounded-full bg-indigo-400/10 blur-3xl" />
                    <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-500/10 blur-3xl" />
                    <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="dots2" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1.5" fill="white" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#dots2)" />
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
                    <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 w-fit">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                        <span className="text-white/80 text-sm font-medium">Free forever — no credit card needed</span>
                    </div>

                    <h1 className="text-white text-4xl font-bold leading-tight mb-4">
                        Start your journey to<br />
                        <span className="text-indigo-200">financial freedom</span>
                    </h1>
                    <p className="text-indigo-200/80 text-lg mb-12 leading-relaxed">
                        Join thousands of people who use Kenfinly to save more, spend smarter, and stress less about money.
                    </p>

                    {/* Steps */}
                    <div className="space-y-6">
                        {steps.map(({ icon: Icon, title, desc }, i) => (
                            <div key={title} className="flex items-start gap-4">
                                <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center">
                                        <Icon className="w-5 h-5 text-indigo-200" />
                                    </div>
                                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-indigo-500 border-2 border-indigo-900 flex items-center justify-center">
                                        <span className="text-white text-[10px] font-bold">{i + 1}</span>
                                    </div>
                                </div>
                                <div className="pt-1">
                                    <p className="text-white font-semibold text-sm">{title}</p>
                                    <p className="text-indigo-300/70 text-sm mt-0.5">{desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="mt-12 flex items-center gap-4">
                        <div className="flex -space-x-2.5">
                            {['bg-blue-400', 'bg-purple-400', 'bg-green-400', 'bg-orange-400', 'bg-rose-400'].map((c, i) => (
                                <div key={i} className={`w-9 h-9 rounded-full ${c} border-2 border-indigo-900 flex items-center justify-center text-white text-xs font-bold`}>
                                    {['J','M','A','R','S'][i]}
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-white font-semibold text-sm">10,000+ users</p>
                            <p className="text-indigo-300/70 text-xs">already managing their finances</p>
                        </div>
                    </div>
                </div>

                {/* Bottom note */}
                <div className="relative z-10">
                    <p className="text-indigo-300/60 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-300 underline underline-offset-2 hover:text-white transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>

            {/* ── Right form panel ── */}
            <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white min-h-screen overflow-y-auto">
                {/* Mobile logo */}
                <div className="lg:hidden flex items-center gap-2.5 mb-10">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-gray-900 text-xl font-bold">Kenfinly</span>
                </div>

                <div className="w-full max-w-sm">
                    {/* Header */}
                    <div className="mb-7">
                        <h2 className="text-gray-900 text-3xl font-bold mb-2">Create your account</h2>
                        <p className="text-gray-500 text-sm">Get started for free — no credit card required</p>
                    </div>

                    {/* Success banner */}
                    {successMessage && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-emerald-700">{successMessage}</p>
                        </div>
                    )}

                    {/* Error banner */}
                    {errors.general && (
                        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{errors.general[0]}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Full name */}
                        <FloatingField
                            id="name" name="name" label="Full name"
                            autoComplete="name" value={formData.name}
                            onChange={handleChange} error={errors.name?.[0]}
                        />

                        {/* Email */}
                        <FloatingField
                            id="email" name="email" label="Email address"
                            type="email" autoComplete="email" value={formData.email}
                            onChange={handleChange} error={errors.email?.[0]}
                        />

                        {/* Password */}
                        <div className="space-y-2">
                            <FloatingField
                                id="password" name="password" label="Password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password" value={formData.password}
                                onChange={handleChange} error={errors.password?.[0]}
                            >
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </FloatingField>

                            {/* Password strength bar */}
                            {formData.password && (
                                <div className="space-y-1.5">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                    i <= strength ? strengthColor[strength] : 'bg-gray-100'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className={`text-xs font-medium ${
                                        strength <= 1 ? 'text-red-500' :
                                        strength === 2 ? 'text-orange-500' :
                                        strength === 3 ? 'text-yellow-600' :
                                        'text-emerald-600'
                                    }`}>
                                        {strengthLabel[strength]} password
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Confirm password */}
                        <FloatingField
                            id="passwordConfirmation" name="passwordConfirmation"
                            label="Confirm password"
                            type={showConfirm ? 'text' : 'password'}
                            autoComplete="new-password" value={formData.passwordConfirmation}
                            onChange={handleChange}
                            error={
                                errors.password_confirmation?.[0] ||
                                (formData.passwordConfirmation && formData.password !== formData.passwordConfirmation
                                    ? 'Passwords do not match'
                                    : null)
                            }
                        >
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </FloatingField>

                        {/* Terms note */}
                        <p className="text-xs text-gray-400 leading-relaxed pt-1">
                            By creating an account you agree to our{' '}
                            <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a>
                            {' '}and{' '}
                            <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
                        </p>

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
                                    <span>Creating account…</span>
                                </>
                            ) : (
                                <>
                                    <span>Create account</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign in link */}
                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                            Sign in
                        </Link>
                    </p>

                    {/* Security note */}
                    <div className="mt-8 flex items-center justify-center gap-2 text-gray-400">
                        <Shield className="w-3.5 h-3.5" />
                        <p className="text-xs">256-bit SSL encryption · Your data stays private</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
