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
        setTimeout(() => {
          navigate('/verification-pending', {
            state: {
              user: result.user,
              redirectTo,
            },
          });
        }, 1200);
      } else {
        if (result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: [result.message || t('auth.register_error')] });
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
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    background: '#eef2ff',
                    border: '1px solid #c7d2fe',
                    color: '#3730a3',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    marginBottom: '12px',
                  }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1, marginTop: '2px' }}>🛒</span>
                  <span>
                    Tạo tài khoản để hoàn tất đơn hàng của bạn. Sau khi xác thực email, bạn sẽ có thể thanh toán ngay.
                  </span>
                </div>
              )}

              {/* Success alert */}
              {successMessage && (
                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                >
                  {successMessage}
                </div>
              )}

              {/* General / server error alert */}
              {errors.general && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '12px',
                  }}
                >
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
                  <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 8px' }}>
                    {errors.name[0]}
                  </p>
                )}

                {/* ── Email ── */}
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
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
                    style={{ width: '100%' }}
                  />
                </div>
                {errors.email && (
                  <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 8px' }}>
                    {errors.email[0]}
                  </p>
                )}

                {/* ── Password ── */}
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
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
                    style={{ width: '100%' }}
                  />
                </div>
                {errors.password && (
                  <p style={{ color: '#ef4444', fontSize: '13px', margin: '4px 0 8px' }}>
                    {errors.password[0]}
                  </p>
                )}

                {/* ── Confirm Password ── */}
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
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
                    style={{ width: '100%' }}
                  />
                </div>

                {/* ── Submit ── */}
                <div className="form-sign-in-password-btn mt-24">
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      width: '100%',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1,
                    }}
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
