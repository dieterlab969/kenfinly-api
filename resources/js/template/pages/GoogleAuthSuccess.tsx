import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * GoogleAuthSuccess — token capture page for Google OAuth popup flow.
 *
 * Google redirects the browser here after a successful OAuth exchange.
 * The Laravel callback appends the JWT as ?token=<jwt> so this page can:
 *  1. Extract the token from the URL.
 *  2. Store it in localStorage (same keys used by the regular login flow).
 *  3. Set the Authorization header on axios for subsequent API calls.
 *  4. Navigate to /Home.
 *
 * On error (no token, or ?error param present) it redirects to /SignIn
 * with a brief error message in query params.
 */
const GoogleAuthSuccess: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');
    const error  = params.get('error') || params.get('reason');

    if (error || !token) {
      navigate('/SignIn?error=google_failed', { replace: true });
      return;
    }

    // Store using the same keys as the regular login flow (AuthContext)
    localStorage.setItem('token', token);
    localStorage.setItem('auth_token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Clean the token out of the URL before navigating
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
          stroke="#4f46e5"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <p style={{ margin: 0, fontSize: '15px' }}>Signing you in with Google…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default GoogleAuthSuccess;
