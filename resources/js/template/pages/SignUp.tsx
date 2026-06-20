import React, { useState } from "react";
import BackBtn from '../components/BackBtn';
import Logo from '../assets/images/let-you-screen/logo.svg';
import personIcon from '../assets/svg/person-icon.svg';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

interface RegisteredUser {
  email: string;
  name?: string;
  id?: number | string;
}

interface RegisterSuccessResponse {
  access_token?: string;
  message?: string;
  user?: RegisteredUser;
}

interface RegisterErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

const SignUp: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') ?? '';

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      const data: RegisterSuccessResponse | RegisterErrorResponse = await response.json();
      if (!response.ok) {
        const errData = data as RegisterErrorResponse;
        const firstError = errData.errors
          ? Object.values(errData.errors)[0]?.[0]
          : errData.message;
        setError(firstError || 'Registration failed. Please try again.');
        return;
      }
      const successData = data as RegisterSuccessResponse;
      navigate('/verification-pending', {
        state: {
          user: successData.user ?? { email },
          redirectTo,
        },
      });
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
          <div className="let-you-social-sec" id="sign-up-main">
            <div className="lets_you_in_box">
              <h1 className="d-none">hidden</h1>
              <h2 className="lets_you_in_text">Sign Up</h2>
              {error && (
                <p style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', marginBottom: '12px' }}>
                  {error}
                </p>
              )}
              <form className="mt-32" onSubmit={handleSignUp}>
                <div className="form-details-sign-in">
                  <span>
                    <img src={personIcon} alt="personicon" />
                  </span>
                  <input
                    type="text"
                    id="name"
                    placeholder="Your Name"
                    className="sign-in-custom-input"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
                  <input
                    type="email"
                    id="email"
                    placeholder="Email Address"
                    className="sign-in-custom-input"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
                  <input
                    type="password"
                    id="password"
                    placeholder="Password"
                    className="sign-in-custom-input"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="mobile-form mt-16" style={{ flexDirection: 'column', gap: '0' }}>
                  <input
                    type="password"
                    id="password_confirmation"
                    placeholder="Confirm Password"
                    className="sign-in-custom-input"
                    value={passwordConfirmation}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPasswordConfirmation(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{ width: '100%' }}
                  />
                </div>
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
                    {loading ? 'Creating Account…' : 'Sign Up'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <footer id="let-you-footer">
            <div className="block-footer">
              <p>Already have an account? <Link to="/SignIn">Sign in</Link></p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
