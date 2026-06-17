import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../contexts/TranslationContext';

export default function VerificationPending() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(location.state?.user?.email || '');
  const [source, setSource] = useState(location.state?.source || 'register');
  const [customMessage, setCustomMessage] = useState(location.state?.message || '');
  const redirectTo = location.state?.redirectTo || '';

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!userEmail) {
      navigate(source === 'login' ? '/SignIn' : '/SignUp');
    }
  }, [userEmail, navigate, source]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendStatus(null);
    setResendMessage('');

    try {
      const response = await axios.post('/api/email/resend', { email: userEmail });

      if (response.data.success) {
        setResendStatus('success');
        setResendMessage(response.data.message || t('verification.email_sent_success'));
      } else {
        setResendStatus('error');
        setResendMessage(response.data.message || t('verification.email_resend_failed'));
      }
    } catch (error) {
      setResendStatus('error');

      if (error.response?.status === 429) {
        setResendMessage(error.response.data.message || t('verification.too_many_requests'));
      } else if (error.response?.data?.message) {
        setResendMessage(error.response.data.message);
      } else {
        setResendMessage(t('verification.generic_error'));
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    const loginPath = redirectTo
      ? `/SignIn?redirect_to=${encodeURIComponent(redirectTo)}`
      : '/SignIn';
    navigate(loginPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Left Panel - Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col">
              <div className="inline-block bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                Email verification required
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Verify your email
              </h1>
              <p className="text-gray-600 mb-8">
                Kenfinly is sending a one-time verification link so you can continue using your account securely.
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

          {/* Right Panel - Verification */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="text-blue-600" size={28} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('verification.verify_your_email')}</h2>
                {customMessage && <p className="text-gray-600 text-sm mt-2">{customMessage}</p>}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                <p className="font-semibold text-gray-900 mb-1">{t('verification.email_sent_to')}</p>
                <p className="text-gray-900 font-medium">{userEmail}</p>
                <p className="text-gray-600 text-sm mt-2">
                  {source === 'login'
                    ? t('verification.login_prompt') + ' ' + t('verification.login_continue')
                    : t('verification.activate_account')}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="font-semibold text-blue-900 mb-2">{t('verification.did_not_receive')}</p>
                <ul className="space-y-1 text-blue-900 text-sm">
                  <li>• {t('verification.check_spam')}</li>
                  <li>• {t('verification.check_email_correct')}</li>
                  <li>• {t('verification.wait_and_resend')}</li>
                </ul>
              </div>

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

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {isResending && <Loader size={18} className="animate-spin" />}
                  {isResending ? t('verification.sending') : t('verification.resend_email')}
                </button>

                <button
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
