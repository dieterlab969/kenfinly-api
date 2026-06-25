import React, { useState } from "react";
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { useRecaptchaConfig } from '../../components/App';
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import { Link, useNavigate, useLocation } from 'react-router-dom';

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

const GoogleLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const FacebookLogo: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.883v2.27h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
    />
  </svg>
);

const SignIn: React.FC = () => {
  const [email, setEmail]       = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading]         = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [fbLoading, setFbLoading]     = useState<boolean>(false);
  const [error, setError]             = useState<string>('');
  const navigate  = useNavigate();
  const location  = useLocation();

  const { executeRecaptcha } = useGoogleReCaptcha();
  const { enabled: recaptchaEnabled } = useRecaptchaConfig();

  const searchParams = new URLSearchParams(location.search);
  const urlError = searchParams.get('error');

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
      if (recaptchaToken) {
        body['g-recaptcha-response'] = recaptchaToken;
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: LoginSuccessResponse | LoginErrorResponse = await response.json();
      if (!response.ok) {
        const errData = data as LoginErrorResponse;
        const firstFieldError = errData.errors
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

  const displayError = error || (urlError === 'google_failed'
    ? 'Google sign-in failed. Please try again or use email.'
    : urlError === 'facebook_failed'
      ? 'Facebook sign-in failed. Please try again or use email.'
      : urlError
        ? 'Sign-in failed. Please try again.'
        : '');

  return (
    <div>
      <div className="site-content">
        <div className="let-you-page-main">
          <div className="let-you-top">
            <div className="container">
              <div className="let-you-top-wrap">
                <header className="back-btn"><BackBtn /></header>
                <div className="payfast-img_main">
                  <img src={Logo} alt="logo" />
                </div>
              </div>
            </div>
          </div>

          <div className="let-you-social-sec" id="sign-in-main">
            <div className="lets_you_in_box">
              <h1 className="d-none">hidden</h1>
              <h2 className="lets_you_in_text">Sign In</h2>

              {displayError && (
                <div className="auth-alert-danger">{displayError}</div>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading || fbLoading || loading}
                className="auth-social-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', width: '100%', padding: '11px 16px', marginTop: '8px',
                  background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: (googleLoading || fbLoading || loading) ? 'not-allowed' : 'pointer',
                  opacity: (googleLoading || fbLoading || loading) ? 0.7 : 1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {googleLoading ? (
                  <span style={{ fontSize: '13px' }}>Redirecting to Google…</span>
                ) : (
                  <><GoogleLogo />Continue with Google</>
                )}
              </button>

              <button
                type="button"
                onClick={handleFacebookSignIn}
                disabled={googleLoading || fbLoading || loading}
                className="auth-social-btn"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', width: '100%', padding: '11px 16px', marginTop: '10px',
                  background: '#fff', border: '1.5px solid #d1d5db', borderRadius: '10px',
                  fontSize: '14px', fontWeight: 600, color: '#374151',
                  cursor: (googleLoading || fbLoading || loading) ? 'not-allowed' : 'pointer',
                  opacity: (googleLoading || fbLoading || loading) ? 0.7 : 1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
              >
                {fbLoading ? (
                  <span style={{ fontSize: '13px' }}>Redirecting to Facebook…</span>
                ) : (
                  <><FacebookLogo />Continue with Facebook</>
                )}
              </button>

              <div className="or-section mt-24">
                <p>or sign in with email</p>
              </div>

              <form onSubmit={handleSignIn} style={{ marginTop: '8px' }}>
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
                <div className="mobile-form mobile-form-col mt-16">
                  <input
                    type="password"
                    className="sign-in-custom-input"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="form-sign-in-password-btn mt-24">
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading || googleLoading}
                  >
                    {loading ? 'Signing In…' : 'Sign In'}
                  </button>
                </div>
              </form>

              <div className="mt-16 text-center">
                <Link to="/ForgetPassword" className="auth-forgot-link">
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>

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
