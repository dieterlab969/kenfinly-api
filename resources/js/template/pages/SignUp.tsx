import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRecaptchaConfig } from '../../components/App';
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import personIcon from '../assets/svg/person-icon.svg';

// ── Google "G" logo SVG ───────────────────────────────────────────────────
const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ── Facebook "f" logo SVG (official brand colour #1877F2) ──────────────────
const FacebookLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/** Per-field errors — string array so the first item is shown inline.
 *  `general` holds API-level or network errors not tied to a specific field. */
interface FormErrors {
  name?: string[];
  email?: string[];
  password?: string[];
  general?: string[];
}

interface RegisterSuccessResult {
  success: true;
  user: unknown;
  verification_sent: boolean;
  message: string;
}

interface RegisterFailureResult {
  success: false;
  errors?: FormErrors;
  message?: string;
}

type RegisterResult = RegisterSuccessResult | RegisterFailureResult;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [loading, setLoading]             = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [fbLoading, setFbLoading]         = useState<boolean>(false);

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { register, user } = useAuth();
  const { t } = useTranslation();
  const { enabled: recaptchaEnabled } = useRecaptchaConfig();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect_to') ?? '';
  const isCartRedirect = redirectTo === '/cart';

  /** Redirect away if already authenticated. */
  useEffect(() => {
    if (user) {
      const target = searchParams.get('redirect_to');
      if (target) {
        window.location.href = `${target}?laravel_user_id=${user.id}`;
      } else {
        navigate('/');
      }
    }
  }, [user, navigate]);

  /** Update a single field and clear its inline error. */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  /** reCAPTCHA → AuthContext.register() → navigate or show errors. */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    try {
      let recaptchaToken: string | null = null;

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
        recaptchaToken,
      ) as RegisterResult;

      if (result.success) {
        setSuccessMessage(result.message || t('auth.register_success'));
        // Token already stored in AuthContext — go straight to the app.
        setTimeout(() => {
          if (redirectTo) {
            window.location.href = `${redirectTo}?laravel_user_id=${(result.user as any)?.id ?? ''}`;
          } else {
            navigate('/Home');
          }
        }, 800);
      } else {
        const failure = result as RegisterFailureResult;
        if (failure.errors) {
          setErrors(failure.errors);
        } else {
          setErrors({ general: [failure.message || t('auth.register_error')] });
        }
      }
    } catch {
      setErrors({ general: [t('auth.register_error')] });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div>
      <div className="site-content">
        <div className="let-you-page-main">

          {/* ── Top bar: back button + logo ── */}
          <div className="let-you-top">
            <div className="container">
              <div className="let-you-top-wrap">
                <header className="back-btn">
                  <BackBtn />
                </header>
                <div className="payfast-img_main">
                  <img src={Logo} alt="Kenfinly" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Main form area ── */}
          <div className="let-you-social-sec" id="sign-up-main">
            <div className="lets_you_in_box">
              <h1 className="d-none">hidden</h1>
              <h2 className="lets_you_in_text">{t('auth.register')}</h2>

              {/* Cart-checkout context notice */}
              {isCartRedirect && (
                <div className="auth-alert-info">
                  <span className="auth-alert-info-icon">🛒</span>
                  <span>
                    Tạo tài khoản để hoàn tất đơn hàng của bạn. Sau khi xác thực email, bạn sẽ có thể thanh toán ngay.
                  </span>
                </div>
              )}

              {/* Success alert */}
              {successMessage && (
                <div className="auth-alert-success">
                  {successMessage}
                </div>
              )}

              {/* General / server error alert */}
              {errors.general && (
                <div className="auth-alert-danger">
                  {errors.general[0]}
                </div>
              )}

              {/* ── Google One-Click Registration ── */}
              <button
                type="button"
                onClick={() => { setGoogleLoading(true); window.location.href = '/api/v1/auth/google/redirect'; }}
                disabled={googleLoading || fbLoading || loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', width: '100%', padding: '11px 16px', marginTop: '8px',
                  background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: (googleLoading || fbLoading || loading) ? 'not-allowed' : 'pointer',
                  opacity: (googleLoading || fbLoading || loading) ? 0.7 : 1,
                  transition: 'border-color 0.15s',
                }}
              >
                {googleLoading ? (
                  <span style={{ fontSize: '13px' }}>Redirecting to Google…</span>
                ) : (
                  <><GoogleLogo />Continue with Google</>
                )}
              </button>

              {/* ── Facebook One-Click Registration ── */}
              <button
                type="button"
                onClick={() => { setFbLoading(true); window.location.href = '/api/v1/auth/facebook/redirect'; }}
                disabled={googleLoading || fbLoading || loading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', width: '100%', padding: '11px 16px', marginTop: '10px',
                  background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: (googleLoading || fbLoading || loading) ? 'not-allowed' : 'pointer',
                  opacity: (googleLoading || fbLoading || loading) ? 0.7 : 1,
                  transition: 'border-color 0.15s',
                }}
              >
                {fbLoading ? (
                  <span style={{ fontSize: '13px' }}>Redirecting to Facebook…</span>
                ) : (
                  <><FacebookLogo />Continue with Facebook</>
                )}
              </button>

              <div className="or-section mt-24">
                <p>or sign up with email</p>
              </div>

              <form className="mt-8" onSubmit={handleSubmit} noValidate>

                {/* ── Name ── */}
                <div className="form-details-sign-in">
                  <span>
                    <img src={personIcon} alt="" aria-hidden="true" />
                  </span>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder={t('auth.name')}
                    className="sign-in-custom-input"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="auth-field-error">{errors.name[0]}</p>
                )}

                {/* ── Email ── */}
                <div className="mobile-form mobile-form-col mt-16">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder={t('auth.email')}
                    className="sign-in-custom-input"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="auth-field-error">{errors.email[0]}</p>
                )}

                {/* ── Password ── */}
                <div className="mobile-form mobile-form-col mt-16">
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder={t('auth.password')}
                    className="sign-in-custom-input"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="auth-field-error">{errors.password[0]}</p>
                )}

                {/* ── Confirm Password ── */}
                <div className="mobile-form mobile-form-col mt-16">
                  <input
                    type="password"
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    placeholder={t('auth.confirm_password')}
                    className="sign-in-custom-input"
                    value={formData.passwordConfirmation}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {/* ── Submit ── */}
                <div className="form-sign-in-password-btn mt-24">
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? `${t('auth.sign_up')}…` : t('auth.sign_up')}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* ── Footer: sign-in link (forwards redirect_to so the flow is preserved) ── */}
          <footer id="let-you-footer">
            <div className="block-footer">
              <p>
                {t('auth.have_account')}{' '}
                <Link
                  to={
                    redirectTo
                      ? `/SignIn?redirect_to=${encodeURIComponent(redirectTo)}`
                      : '/SignIn'
                  }
                >
                  {t('auth.login_here')}
                </Link>
              </p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default SignUp;
