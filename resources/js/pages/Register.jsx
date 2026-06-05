import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
                        state: { user: result.user } 
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
        <div className="auth-page bg-light min-vh-100 py-5">
            <div className="container">
                <div className="row gx-5 align-items-center justify-content-center">
                    <aside className="col-lg-6 order-2 order-lg-1 mb-4">
                        <div className="card shadow-sm border-0 h-100">
                            <div className="card-body py-5 px-4">
                                <span className="badge bg-secondary bg-opacity-10 text-secondary mb-3">PayFast-inspired registration</span>
                                <h1 className="display-6 fw-semibold text-dark">Create your Kenfinly account</h1>
                                <p className="text-muted mb-4">
                                    Register now to keep your existing Kenfinly data and complete email verification with the same secure backend flows.
                                </p>
                                <div className="row g-3 text-muted">
                                    <div className="col-12 col-md-6">
                                        <div className="card border-light shadow-sm h-100">
                                            <div className="card-body">
                                                <h2 className="h6 fw-semibold">Secure signup</h2>
                                                <p className="mb-0">Your password and verification flow remain handled by Kenfinly’s backend.</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <div className="card border-light shadow-sm h-100">
                                            <div className="card-body">
                                                <h2 className="h6 fw-semibold">Identity protection</h2>
                                                <p className="mb-0">The same API endpoints and email verification step are preserved.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>

                    <main className="col-lg-4 order-1 order-lg-2">
                        <div className="card shadow-sm border-0">
                            <div className="card-body p-4">
                                <div className="text-center mb-4">
                                    <DynamicLogo className="mb-3" iconClassName="me-2" textClassName="h4 fw-bold text-dark" />
                                    <h2 className="h3 fw-semibold">{t('auth.register')}</h2>
                                    <p className="text-muted mb-0">{t('auth.register_subtitle') || 'Complete your account setup and verify your email to unlock Kenfinly features.'}</p>
                                </div>

                                <form onSubmit={handleSubmit}>
                                    {successMessage && (
                                        <div className="alert alert-success" role="alert">
                                            {successMessage}
                                        </div>
                                    )}

                                    {errors.general && (
                                        <div className="alert alert-danger" role="alert">
                                            {errors.general[0]}
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <label htmlFor="name" className="form-label">{t('auth.name')}</label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                        {errors.name && <div className="form-text text-danger">{errors.name[0]}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">{t('auth.email')}</label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            required
                                            value={formData.email}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                        {errors.email && <div className="form-text text-danger">{errors.email[0]}</div>}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="password" className="form-label">{t('auth.password')}</label>
                                        <input
                                            id="password"
                                            name="password"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={formData.password}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                        {errors.password && <div className="form-text text-danger">{errors.password[0]}</div>}
                                    </div>

                                    <div className="mb-4">
                                        <label htmlFor="passwordConfirmation" className="form-label">{t('auth.confirm_password')}</label>
                                        <input
                                            id="passwordConfirmation"
                                            name="passwordConfirmation"
                                            type="password"
                                            autoComplete="new-password"
                                            required
                                            value={formData.passwordConfirmation}
                                            onChange={handleChange}
                                            className="form-control"
                                        />
                                    </div>

                                    <button type="submit" disabled={loading} className="btn btn-primary w-100">
                                        {loading ? `${t('auth.sign_up')}...` : t('auth.sign_up')}
                                    </button>
                                </form>

                                <p className="text-center text-muted mt-4 mb-0">
                                    {t('auth.have_account')}{' '}
                                    <Link to="/login" className="fw-semibold text-decoration-none">{t('auth.login_here')}</Link>
                                </p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default Register;
