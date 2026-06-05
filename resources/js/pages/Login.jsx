import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useRecaptchaConfig } from '../components/App';
import DynamicLogo from '../components/DynamicLogo';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { login, user } = useAuth();
    const { t } = useTranslation();
    const { enabled: recaptchaEnabled } = useRecaptchaConfig();
    const navigate = useNavigate();
    const location = useLocation();
    const successMessage = location.state?.message || '';

    useEffect(() => {
        if (user) {
            navigate('/halo');
        }
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
                navigate('/halo');
            } else if (result.action === 'verify_email') {
                navigate('/verification-pending', {
                    state: {
                        user: result.user,
                        source: 'login',
                        verificationSent: result.verification_sent,
                        message: result.message
                    }
                });
            } else {
                setError(result.message || t('auth.login_failed'));
            }
        } catch (err) {
            setError(t('auth.login_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    {/* Left Panel - Features */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col">
                            <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                                Secure Kenfinly access
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Welcome back to your finance dashboard
                            </h1>
                            <p className="text-gray-600 mb-8">
                                This sign-in experience preserves Kenfinly authentication flows, email verification, and JWT-secured API access while using a refreshed visual layout.
                            </p>

                            <div className="space-y-4 flex-1">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Protected access</h3>
                                    <p className="text-sm text-gray-600">Authenticated routes remain guarded by Kenfinly's backend.</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Trusted sign in</h3>
                                    <p className="text-sm text-gray-600">ReCAPTCHA and verification checks are preserved from the existing backend flow.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Login Form */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <DynamicLogo className="w-12 h-12" iconClassName="w-8 h-8" textClassName="text-2xl font-bold" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('auth.login')}</h2>
                                <p className="text-gray-600 text-sm mt-2">{t('auth.login_subtitle') || 'Enter your credentials to continue to your Kenfinly account.'}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {successMessage && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                        {successMessage}
                                    </div>
                                )}

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('auth.email')}
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.email')}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('auth.password')}
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.password')}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {loading ? `${t('auth.sign_in')}...` : t('auth.sign_in')}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 text-sm mt-6">
                                {t('auth.no_account')}{' '}
                                <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    {t('auth.register_here')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
