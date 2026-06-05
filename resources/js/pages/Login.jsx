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
        <div className="auth-page bg-light min-vh-100 py-5">
            <div className="container">
                <div className="row gx-5 align-items-center justify-content-center">
                    <div className="col-lg-6 mb-4">
                        <div className="card shadow-sm h-100 border-0">
                            <div className="card-body py-5 px-4">
                                <span className="badge bg-primary bg-opacity-10 text-primary mb-3">Secure Kenfinly access</span>
                                <h1 className="display-6 fw-semibold">Welcome back to your finance dashboard</h1>
                                <p className="text-muted mb-4">
                                    This sign-in experience preserves Kenfinly authentication flows, email verification, and JWT-secured API access while using a refreshed visual layout.
                                </p>

                                <div className="row g-3 text-muted">
                                    <div className="col-12 col-sm-6">
                                        <div className="card border-light shadow-sm h-100">
                                            <div className="card-body">
                                                <h2 className="h6 fw-semibold">Protected access</h2>
                                                <p className="mb-0">Authenticated routes remain guarded by Kenfinly’s backend.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-sm-6">
                                        <div className="card border-light shadow-sm h-100">
                                            <div className="card-body">
                                                <h2 className="h6 fw-semibold">Trusted sign in</h2>
                                                <p className="mb-0">ReCAPTCHA and verification checks are preserved from the existing backend flow.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-4">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <DynamicLogo className="mb-3" iconClassName="me-2" textClassName="h4 fw-bold text-dark" />
                                    <h2 className="h3 fw-semibold">{t('auth.login')}</h2>
                                    <p className="text-muted mb-0">{t('auth.login_subtitle') || 'Enter your credentials to continue to your Kenfinly account.'}</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {successMessage && (
                                        <div className="alert alert-success" role="alert">
                                            {successMessage}
                                        </div>
                                    )}

                                    {error && (
                                        <div className="alert alert-danger" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="password" className="form-label">{t('auth.password')}</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="current-password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="form-control"
                                        />
                                    </div>

                                    <button type="submit" disabled={loading} className="btn btn-primary w-100">
                                        {loading ? `${t('auth.sign_in')}...` : t('auth.sign_in')}
                                    </button>
                                </form>

                                <p className="text-center text-muted mt-4 mb-0">
                                    {t('auth.no_account')}{' '}
                                    <Link to="/register" className="fw-semibold text-decoration-none">{t('auth.register_here')}</Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
