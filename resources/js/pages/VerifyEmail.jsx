import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
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
          navigate('/SignIn', {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-stretch">
          {/* Left Panel - Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 h-full flex flex-col">
              <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium mb-4 w-fit">
                Email verification
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Confirm your Kenfinly account
              </h1>
              <p className="text-gray-600 mb-8">
                A verification code is being checked by the backend. Once confirmed, you will be redirected to sign in.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 flex-1">
                <p className="font-semibold text-gray-900 mb-2">Why this step matters</p>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li>✓ Confirms your email address and protects your account.</li>
                  <li>✓ Ensures secure JWT session access to protected Kenfinly routes.</li>
                  <li>✓ Preserves existing API-based verification behavior.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Panel - Verification Status */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col justify-center">
              {status === 'verifying' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Loader className="text-blue-600 animate-spin" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t('verifyEmail.verifying_email')}</h2>
                  <p className="text-gray-600">{t('verifyEmail.please_wait')}</p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t('verifyEmail.email_verified')}</h2>
                  <p className="text-gray-600 mb-2">{message}</p>
                  <p className="text-gray-500 text-sm">{t('verifyEmail.redirecting_login')}</p>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center">
                  <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="text-red-600" size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{t('verifyEmail.verification_failed')}</h2>
                  <p className="text-gray-600 mb-6">{message}</p>
                  <div className="space-y-3">
                    <button 
                      onClick={() => navigate('/SignIn')}
                      className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                    >
                      {t('verifyEmail.go_to_login')}
                    </button>
                    <button 
                      onClick={() => navigate('/SignUp')}
                      className="w-full py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200"
                    >
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
  );
}
