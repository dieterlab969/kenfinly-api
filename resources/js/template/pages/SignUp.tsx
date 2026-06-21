import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { useRecaptchaConfig } from '../../components/App';
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import personIcon from '../assets/svg/person-icon.svg';

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
  const [loading, setLoading] = useState<boolean>(false);

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

              <form className="mt-32" onSubmit={handleSubmit} noValidate>

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
