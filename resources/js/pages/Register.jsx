import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { useRecaptchaConfig } from '../components/App';
import DynamicLogo from '../components/DynamicLogo';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        passwordConfirmation: '',
    });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { register, user } = useAuth();
    const { t } = useTranslation();
    const { enabled: recaptchaEnabled } = useRecaptchaConfig();
    const navigate = useNavigate();
    const location = useLocation();

    const searchParams   = new URLSearchParams(location.search);
    const redirectParam  = searchParams.get('redirect');
    const isCartRedirect = redirectParam === 'cart';

    useEffect(() => {
        if (user) {
            navigate('/halo');
        }
    }, [user, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: null
            }));
        }
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

            const result = await register(
                formData.name,
                formData.email,
                formData.password,
                formData.passwordConfirmation,
                recaptchaToken
            );

            if (result.success) {
                setSuccessMessage(result.message || t('auth.register_success'));
                setTimeout(() => {
                    navigate('/verification-pending', {
                        state: {
                            user: result.user,
                            redirect: redirectParam,
                        }
                    });
                }, 1200);
            } else {
                if (result.errors) {
                    setErrors(result.errors);
                } else {
                    setErrors({ general: [t('auth.register_error')] });
                }
            }
        } catch (err) {
            setErrors({ general: [t('auth.register_error')] });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
                    {/* Left Panel - Features */}
                    <div className="lg:col-span-2 order-2 lg:order-1">
                        <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col">
                            <div className="inline-block bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                                PayFast-inspired registration
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-4">
                                Create your Kenfinly account
                            </h1>
                            <p className="text-gray-600 mb-8">
                                Register now to keep your existing Kenfinly data and complete email verification with the same secure backend flows.
                            </p>

                            <div className="space-y-4 flex-1">
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Secure signup</h3>
                                    <p className="text-sm text-gray-600">Your password and verification flow remain handled by Kenfinly's backend.</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">Identity protection</h3>
                                    <p className="text-sm text-gray-600">The same API endpoints and email verification step are preserved.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Register Form */}
                    <div className="lg:col-span-3 order-1 lg:order-2">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="flex justify-center mb-4">
                                    <DynamicLogo className="w-12 h-12" iconClassName="w-8 h-8" textClassName="text-2xl font-bold" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">{t('auth.register')}</h2>
                                <p className="text-gray-600 text-sm mt-2">{t('auth.register_subtitle') || 'Complete your account setup and verify your email to unlock Kenfinly features.'}</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {isCartRedirect && (
                                    <div className="flex items-start gap-3 bg-indigo-50 border border-indigo-200 text-indigo-800 px-4 py-3 rounded-xl text-sm">
                                        <span className="text-lg leading-none mt-0.5">🛒</span>
                                        <span>Tạo tài khoản để hoàn tất đơn hàng của bạn. Sau khi xác thực email, bạn sẽ có thể thanh toán ngay.</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                                        {successMessage}
                                    </div>
                                )}

                                {errors.general && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                        {errors.general[0]}
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('auth.name')}
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.name')}
                                    />
                                    {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name[0]}</p>}
                                </div>

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
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.email')}
                                    />
                                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email[0]}</p>}
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('auth.password')}
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.password')}
                                    />
                                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password[0]}</p>}
                                </div>

                                <div>
                                    <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('auth.confirm_password')}
                                    </label>
                                    <input
                                        id="passwordConfirmation"
                                        name="passwordConfirmation"
                                        type="password"
                                        autoComplete="new-password"
                                        required
                                        value={formData.passwordConfirmation}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder={t('auth.confirm_password')}
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {loading ? `${t('auth.sign_up')}...` : t('auth.sign_up')}
                                </button>
                            </form>

                            <p className="text-center text-gray-600 text-sm mt-6">
                                {t('auth.have_account')}{' '}
                                <Link
                                    to={isCartRedirect ? '/login?redirect=cart' : '/login'}
                                    className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                                >
                                    {t('auth.login_here')}
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
