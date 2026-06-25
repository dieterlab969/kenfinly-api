import React, { useState } from "react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRecaptchaConfig } from '../../components/App';
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import { Link, useNavigate, useLocation } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginSuccessResponse {
  access_token: string;
  token_type: string;
  user?: {
    id?: number;
    name?: string;
    email?: string;
  };
}

interface LoginErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const FacebookLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path fill="#1877F2" d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

interface EyeIconProps { open: boolean; }

const EyeIcon: React.FC<EyeIconProps> = ({ open }) =>
  open ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );

// ─── Scoped styles ────────────────────────────────────────────────────────────
// This <style> tag lives inside the component tree and is removed from the DOM
// automatically when the component unmounts — no other route is affected.

const STYLES = `
  /* ── Social sign-in buttons ───────────────────────────────────────────────
     Extends the project's .mobile-form visual language: white/var surface,
     1.5px border, 12px radius, Satoshi font. Replaces the previous approach
     of raw inline style objects (which violated design DNA). */
  .si-social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    width: 100%;
    padding: 13px 16px;
    background: var(--primary-color, #fff);
    border: 1.5px solid var(--border-color, #E8E8E8);
    border-radius: 12px;
    font-family: Satoshi, sans-serif;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color, #111);
    cursor: pointer;
    transition: border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
    line-height: 1;
  }
  .si-social-btn + .si-social-btn {
    margin-top: 10px;
  }
  .si-social-btn:hover:not(:disabled) {
    border-color: #7B51F1;
    box-shadow: 0 0 0 3px rgba(123, 81, 241, 0.10);
  }
  .si-social-btn:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  /* ── Password field with show/hide toggle ─────────────────────────────── */
  .si-pw-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background: var(--input-bg);
    padding: 11px;
    margin-top: 16px;
  }
  .si-pw-input {
    border: none;
    background: transparent;
    width: 100%;
    padding-left: 12px;
    padding-right: 44px;
    color: var(--sub-text-color);
    font-family: Satoshi, sans-serif;
    font-size: 18px;
    font-weight: 500;
    line-height: 24px;
    outline: none;
  }
  .si-pw-input::placeholder {
    color: var(--sub-text-color);
    opacity: 0.6;
  }
  .si-eye-btn {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    color: var(--sub-text-color);
    display: flex;
    align-items: center;
    opacity: 0.55;
    transition: opacity 0.15s ease;
    border-radius: 4px;
  }
  .si-eye-btn:hover {
    opacity: 1;
  }

  /* ── Forgot password link ─────────────────────────────────────────────── */
  .si-forgot-link {
    display: inline-block;
    color: #7B51F1;
    font-family: Satoshi, sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 4px 0;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }
  .si-forgot-link:hover {
    opacity: 0.75;
    text-decoration: underline;
  }
  .si-forgot-row {
    text-align: right;
    margin-top: 10px;
  }
`;

// ─── Main component ───────────────────────────────────────────────────────────

const SignIn: React.FC = () => {
  const [email, setEmail]                   = useState<string>('');
  const [password, setPassword]             = useState<string>('');
  const [showPw, setShowPw]                 = useState<boolean>(false);
  const [loading, setLoading]               = useState<boolean>(false);
  const [googleLoading, setGoogleLoading]   = useState<boolean>(false);
  const [fbLoading, setFbLoading]           = useState<boolean>(false);
  const [error, setError]                   = useState<string>('');

  const navigate = useNavigate();
  const location = useLocation();

  const { executeRecaptcha }          = useGoogleReCaptcha();
  const { enabled: recaptchaEnabled } = useRecaptchaConfig();

  const anyLoading = loading || googleLoading || fbLoading;

  const searchParams = new URLSearchParams(location.search);
  const urlError     = searchParams.get('error');

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let recaptchaToken: string | null = null;

      if (recaptchaEnabled) {
        if (!executeRecaptcha) {
          setError('Security check not loaded. Please refresh the page.');
          setLoading(false);
          return;
        }
        recaptchaToken = await executeRecaptcha('login');
      }

      const body: Record<string, string> = { email, password };
      if (recaptchaToken) body['g-recaptcha-response'] = recaptchaToken;

      const response = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body:    JSON.stringify(body),
      });

      const data: LoginSuccessResponse | LoginErrorResponse = await response.json();

      if (!response.ok) {
        const errData          = data as LoginErrorResponse;
        const firstFieldError  = errData.errors
          ? Object.values(errData.errors)[0]?.[0]
          : null;
        setError(firstFieldError || errData.message || 'Login failed. Please check your credentials.');
        return;
      }

      const { access_token, user } = data as LoginSuccessResponse;
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('token', access_token);
      if (user) localStorage.setItem('user', JSON.stringify(user));
      navigate('/Home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = (): void => {
    setGoogleLoading(true);
    window.location.href = '/api/v1/auth/google/redirect';
  };

  const handleFacebookSignIn = (): void => {
    setFbLoading(true);
    window.location.href = '/api/v1/auth/facebook/redirect';
  };

  const displayError =
    error ||
    (urlError === 'google_failed'   ? 'Google sign-in failed. Please try again or use email.'   :
     urlError === 'facebook_failed' ? 'Facebook sign-in failed. Please try again or use email.' :
     urlError                       ? 'Sign-in failed. Please try again.'                        :
     '');

  return (
    <div>
      <style>{STYLES}</style>

      <div className="site-content">
        <div className="let-you-page-main">

          {/* ── Top bar: logo + back ── */}
          <div className="let-you-top">
            <div className="container">
              <div className="let-you-top-wrap">
                <header className="back-btn"><BackBtn /></header>
                <div className="payfast-img_main">
                  <img src={Logo} alt="Kenfinly logo" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Card (scroll region) ── */}
          <div className="let-you-social-sec" id="sign-in-main">
            <div className="lets_you_in_box">
              <h1 className="d-none">Sign In</h1>
              <h2 className="lets_you_in_text">Sign In</h2>

              {/* ── Error banner ── */}
              {displayError && (
                <div className="auth-alert-danger mt-16">{displayError}</div>
              )}

              {/* ── Social sign-in ── */}
              <div className="mt-24">
                <button
                  type="button"
                  className="si-social-btn"
                  onClick={handleGoogleSignIn}
                  disabled={anyLoading}
                >
                  {googleLoading
                    ? 'Redirecting to Google…'
                    : <><GoogleLogo />Continue with Google</>}
                </button>

                <button
                  type="button"
                  className="si-social-btn"
                  onClick={handleFacebookSignIn}
                  disabled={anyLoading}
                >
                  {fbLoading
                    ? 'Redirecting to Facebook…'
                    : <><FacebookLogo />Continue with Facebook</>}
                </button>
              </div>

              {/* ── Divider ── */}
              <div className="or-section mt-24">
                <p>or sign in with email</p>
              </div>

              {/* ── Form ── */}
              <form onSubmit={handleSignIn}>

                {/* Email */}
                <div className="mobile-form mobile-form-col mt-16">
                  <input
                    type="email"
                    className="sign-in-custom-input"
                    placeholder="Enter Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>

                {/* Password with show/hide toggle */}
                <div className="si-pw-wrapper">
                  <input
                    type={showPw ? 'text' : 'password'}
                    className="si-pw-input"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="si-eye-btn"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPw} />
                  </button>
                </div>

                {/* Forgot password — right-aligned, above submit */}
                <div className="si-forgot-row">
                  <Link to="/ForgetPassword" className="si-forgot-link">
                    Forgot Password?
                  </Link>
                </div>

                {/* Submit */}
                <div className="form-sign-in-password-btn mt-16">
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={anyLoading}
                  >
                    {loading ? 'Signing In…' : 'Sign In'}
                  </button>
                </div>

              </form>
            </div>
          </div>

          {/* ── Footer: sign up link ── */}
          <footer id="let-you-footer">
            <div className="block-footer">
              <p>Don't have an account? <Link to="/SignUp">Sign up</Link></p>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default SignIn;
