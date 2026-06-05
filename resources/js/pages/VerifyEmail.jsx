import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../contexts/TranslationContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verifyEmail.invalid_link_no_token'));
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await axios.post('/api/email/verify', { token });

      if (response.data.success) {
        setStatus('success');
        setMessage(response.data.message || t('verifyEmail.email_verified_success'));

        setTimeout(() => {
          navigate('/login', {
            state: { message: t('verifyEmail.email_verified_redirect_message') },
          });
        }, 2500);
      } else {
        setStatus('error');
        setMessage(response.data.message || t('verifyEmail.verification_failed'));
      }
    } catch (error) {
      setStatus('error');
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage(t('verifyEmail.generic_error'));
      }
    }
  };

  return (
    <div className="auth-page bg-light min-vh-100 py-5">
      <div className="container">
        <div className="row gx-5 align-items-center justify-content-center">
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-body py-5 px-4">
                <span className="badge bg-primary bg-opacity-10 text-primary mb-3">Email verification</span>
                <h1 className="h2 fw-semibold">Confirm your Kenfinly account</h1>
                <p className="text-muted mb-4">
                  A verification code is being checked by the backend. Once confirmed, you will be redirected to sign in.
                </p>
                <div className="card border-light bg-white shadow-sm">
                  <div className="card-body text-muted">
                    <p className="fw-semibold text-dark mb-2">Why this step matters</p>
                    <ul className="mb-0 ps-3">
                      <li>Confirms your email address and protects your account.</li>
                      <li>Ensures secure JWT session access to protected Kenfinly routes.</li>
                      <li>Preserves existing API-based verification behavior.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card shadow-sm border-0">
              <div className="card-body p-4">
                {status === 'verifying' && (
                  <div className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-4" style={{ width: '80px', height: '80px' }}>
                      <Loader className="text-primary" size={32} />
                    </div>
                    <h2 className="h5 fw-semibold">{t('verifyEmail.verifying_email')}</h2>
                    <p className="text-muted mb-0">{t('verifyEmail.please_wait')}</p>
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10 mb-4" style={{ width: '80px', height: '80px' }}>
                      <CheckCircle className="text-success" size={32} />
                    </div>
                    <h2 className="h5 fw-semibold">{t('verifyEmail.email_verified')}</h2>
                    <p className="text-muted mb-2">{message}</p>
                    <p className="text-muted small">{t('verifyEmail.redirecting_login')}</p>
                  </div>
                )}

                {status === 'error' && (
                  <div className="text-center">
                    <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-danger bg-opacity-10 mb-4" style={{ width: '80px', height: '80px' }}>
                      <XCircle className="text-danger" size={32} />
                    </div>
                    <h2 className="h5 fw-semibold">{t('verifyEmail.verification_failed')}</h2>
                    <p className="text-muted mb-4">{message}</p>
                    <div className="d-grid gap-2">
                      <button onClick={() => navigate('/login')} className="btn btn-primary">
                        {t('verifyEmail.go_to_login')}
                      </button>
                      <button onClick={() => navigate('/register')} className="btn btn-outline-secondary">
                        {t('verifyEmail.register_again')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
