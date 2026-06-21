import React, { useState } from "react";
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import { Link, useNavigate } from 'react-router-dom';

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

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data: LoginSuccessResponse | LoginErrorResponse = await response.json();
      if (!response.ok) {
        const errData = data as LoginErrorResponse;
        setError(errData.message || 'Login failed. Please check your credentials.');
        return;
      }
      const { access_token, user } = data as LoginSuccessResponse;
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('token', access_token);
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      navigate('/Home');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="site-content">
        <div className="let-you-page-main">
          <div className="let-you-top">
            <div className="container">
              <div className="let-you-top-wrap">
                <header className="back-btn">
                  <BackBtn />
                </header>
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

              {error && (
                <div className="auth-alert-danger">
                  {error}
                </div>
              )}

              <form onSubmit={handleSignIn}>
                <div className="mobile-form mobile-form-col mt-32">
                  <input
                    type="email"
                    className="sign-in-custom-input"
                    placeholder="Enter Email Address"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className="form-sign-in-password-btn mt-24">
                  <button
                    type="submit"
                    className="auth-submit-btn"
                    disabled={loading}
                  >
                    {loading ? 'Signing In…' : 'Sign In'}
                  </button>
                </div>
              </form>

              <div className="or-section mt-32">
                <p>or</p>
              </div>
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
