import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader } from 'lucide-react';
import axios, { AxiosError } from 'axios';
import { useTranslation } from '../contexts/TranslationContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape of the user object passed through React Router location state. */
interface LocationStateUser {
  email: string;
}

/**
 * State that can be passed to this route via navigate('/verification-pending', { state }).
 *
 * user       — the newly registered / blocked user; email is used for display + resend.
 * redirectTo — forwarded to the Sign In link so the user lands in the right place
 *              after verifying (e.g. '/cart' for the WooCommerce checkout redirect flow).
 * source     — 'register' (default) or 'login'; controls copy and fallback nav target.
 * message    — optional custom subtitle shown below the heading.
 */
interface VerificationPendingLocationState {
  user?: LocationStateUser;
  redirectTo?: string;
  source?: 'register' | 'login';
  message?: string;
}

/** Status of the most recent resend-email API call. */
type ResendStatus = 'success' | 'error' | null;

/** Minimal shape of the resend-email API success response. */
interface ResendApiResponse {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function VerificationPending(): React.ReactElement | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Safely cast — location.state is `unknown` in React Router v6
  const state = (location.state ?? {}) as VerificationPendingLocationState;

  const [userEmail]     = useState<string>(state.user?.email ?? '');
  const [source]        = useState<'register' | 'login'>(state.source ?? 'register');
  const [customMessage] = useState<string>(state.message ?? '');
  const redirectTo       = state.redirectTo ?? '';

  const [isResending,   setIsResending]   = useState<boolean>(false);
  const [resendStatus,  setResendStatus]  = useState<ResendStatus>(null);
  const [resendMessage, setResendMessage] = useState<string>('');

  /**
   * Guard: if we arrive here without an email address in state (e.g. direct
   * navigation or a page refresh that clears state), send the user back to
   * the appropriate auth page rather than showing a broken screen.
   */
  useEffect(() => {
    if (!userEmail) {
      navigate(source === 'login' ? '/SignIn' : '/SignUp', { replace: true });
    }
  }, [userEmail, navigate, source]);

  // Don't render anything while redirecting
  if (!userEmail) return null;

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleResendEmail = async (): Promise<void> => {
    setIsResending(true);
    setResendStatus(null);
    setResendMessage('');

    try {
      const response = await axios.post<ResendApiResponse>('/api/email/resend', {
        email: userEmail,
      });

      if (response.data.success) {
        setResendStatus('success');
        setResendMessage(response.data.message ?? t('verification.email_sent_success'));
      } else {
        setResendStatus('error');
        setResendMessage(response.data.message ?? t('verification.email_resend_failed'));
      }
    } catch (err) {
      setResendStatus('error');

      const axiosErr = err as AxiosError<{ message?: string }>;

      if (axiosErr.response?.status === 429) {
        setResendMessage(
          axiosErr.response.data?.message ?? t('verification.too_many_requests'),
        );
      } else if (axiosErr.response?.data?.message) {
        setResendMessage(axiosErr.response.data.message);
      } else {
        setResendMessage(t('verification.generic_error'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = (): void => {
    const loginPath = redirectTo
      ? `/SignIn?redirect_to=${encodeURIComponent(redirectTo)}`
      : '/SignIn';
    navigate(loginPath);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">

          {/* ── Left panel: why verification matters ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col">
              <div className="inline-block bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                Email verification required
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verify your email
              </h1>
              <p className="text-gray-600 mb-8">
                Kenfinly is sending a one-time verification link so you can continue
                using your account securely.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex-1">
                <p className="font-semibold text-gray-900 mb-2">Why verification matters</p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>✓ Confirm your email to complete registration.</li>
                  <li>✓ Protect access to transaction and account data.</li>
                  <li>✓ Enable secure JWT session access in Kenfinly.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* ── Right panel: action area ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8">

              {/* Header */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-blue-600" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {t('verification.verify_your_email')}
                </h2>
                {customMessage && (
                  <p className="text-gray-600 text-sm mt-2">{customMessage}</p>
                )}
              </div>

              {/* Email address confirmation */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                <p className="font-semibold text-gray-900 mb-1">
                  {t('verification.email_sent_to')}
                </p>
                <p className="text-gray-900 font-medium">{userEmail}</p>
                <p className="text-gray-600 text-sm mt-2">
                  {source === 'login'
                    ? `${t('verification.login_prompt')} ${t('verification.login_continue')}`
                    : t('verification.activate_account')}
                </p>
              </div>

              {/* Troubleshooting tips */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-blue-900 mb-2">
                  {t('verification.did_not_receive')}
                </p>
                <ul className="space-y-1 text-blue-900 text-sm">
                  <li>• {t('verification.check_spam')}</li>
                  <li>• {t('verification.check_email_correct')}</li>
                  <li>• {t('verification.wait_and_resend')}</li>
                </ul>
              </div>

              {/* Resend feedback */}
              {resendStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {resendMessage}
                </div>
              )}
              {resendStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                  {resendMessage}
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isResending && <Loader size={18} className="animate-spin" />}
                  {isResending ? t('verification.sending') : t('verification.resend_email')}
                </button>

                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="w-full py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  {t('verification.back_to_login')}
                </button>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
