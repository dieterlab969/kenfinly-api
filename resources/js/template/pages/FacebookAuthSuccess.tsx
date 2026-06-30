import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * FacebookAuthSuccess — token capture page for the Facebook OAuth flow.
 *
 * After a successful Facebook consent, Laravel's FacebookAuthController
 * issues a 302 redirect to:
 *
 *   /auth/facebook/success?token=<JWT>
 *
 * This component:
 *  1. Reads ?token= from the URL.
 *  2. Stores the JWT in localStorage under the same keys used by the regular
 *     login flow (AuthContext reads both `token` and `auth_token`).
 *  3. Sets the default Authorization header on axios.
 *  4. Strips the token from the browser URL via replaceState (security).
 *  5. Navigates to /Home.
 *
 * On failure (?error or ?reason present, or token absent) it falls back to
 * /SignIn with a query param so the page can show a user-friendly message.
 */
const FacebookAuthSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const error  = params.get('error') || params.get('reason');

    if (error || !token) {
      navigate('/SignIn?error=facebook_failed', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    window.history.replaceState({}, document.title, window.location.pathname);

    navigate('/Home', { replace: true });
  }, [navigate]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        fontFamily: 'sans-serif',
        color: '#374151',
      }}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        style={{ animation: 'spin 1s linear infinite' }}
      >
        <circle cx="20" cy="20" r="16" stroke="#e5e7eb" strokeWidth="4" fill="none" />
        <path
          d="M20 4a16 16 0 0 1 16 16"
          stroke="#1877f2"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ margin: 0, fontSize: '15px' }}>Signing you in with Facebook…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default FacebookAuthSuccess;
