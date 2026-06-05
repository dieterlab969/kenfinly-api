import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../contexts/TranslationContext';

export default function VerificationPending() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(location.state?.user?.email || '');
  const [source, setSource] = useState(location.state?.source || 'register');
  const [customMessage, setCustomMessage] = useState(location.state?.message || '');

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!userEmail) {
      navigate(source === 'login' ? '/login' : '/register');
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
    navigate('/login');
  };

  return (
    <div className="auth-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row gx-5 align-items-center justify-content-center">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body py-5 px-4">
                <span className="badge bg-warning bg-opacity-10 text-warning mb-3">Email verification required</span>
                <h1 className="h2 fw-semibold">Verify your email</h1>
                <p className="text-muted mb-4">
                  Kenfinly is sending a one-time verification link so you can continue using your account securely.
                </p>
                <div className="card border-light bg-white shadow-sm">
                  <div className="card-body">
                    <p className="fw-semibold mb-2">Why verification matters</p>
                    <ul className="mb-0 ps-3 text-muted">
                      <li>Confirm your email to complete registration.</li>
                      <li>Protect access to transaction and account data.</li>
                      <li>Enable secure JWT session access in Kenfinly.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10" style={{ width: '64px', height: '64px' }}>
                    <Mail className="text-primary" size={28} />
                  </div>
                  <h2 className="h4 fw-semibold mt-3">{t('verification.verify_your_email')}</h2>
                  {customMessage && <p className="text-muted mb-0">{customMessage}</p>}
                </div>

                <div className="card border-light bg-white mb-4">
                  <div className="card-body">
                    <p className="fw-semibold mb-2">{t('verification.email_sent_to')}</p>
                    <p className="mb-2"><span className="fw-medium">{userEmail}</span></p>
                    <p className="text-muted mb-0">
                      {source === 'login'
                        ? t('verification.login_prompt') + ' ' + t('verification.login_continue')
                        : t('verification.activate_account')}
                    </p>
                  </div>
                </div>

                <div className="card border-light bg-info bg-opacity-10 mb-4">
                  <div className="card-body">
                    <p className="fw-semibold mb-2">{t('verification.did_not_receive')}</p>
                    <ul className="mb-0 ps-3 text-info">
                      <li>{t('verification.check_spam')}</li>
                      <li>{t('verification.check_email_correct')}</li>
                      <li>{t('verification.wait_and_resend')}</li>
                    </ul>
                  </div>
                </div>

                {resendStatus === 'success' && (
                  <div className="alert alert-success" role="alert">
                    {resendMessage}
                  </div>
                )}

                {resendStatus === 'error' && (
                  <div className="alert alert-danger" role="alert">
                    {resendMessage}
                  </div>
                )}

                <button
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="btn btn-primary w-100 mb-3"
                >
                  {isResending ? (
                    <>
                      <Loader className="me-2" size={18} />
                      {t('verification.sending')}
                    </>
                  ) : (
                    t('verification.resend_email')
                  )}
                </button>

                <button
                  onClick={handleBackToLogin}
                  className="btn btn-outline-secondary w-100"
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
