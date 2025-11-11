import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Loader, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function VerificationPending() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userEmail, setUserEmail] = useState(location.state?.user?.email || '');

  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState(null);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!userEmail) {
      navigate('/register');
    }
  }, [userEmail, navigate]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendStatus(null);
    setResendMessage('');

    try {
      const response = await axios.post('/api/email/resend', { email: userEmail });
      
      if (response.data.success) {
        setResendStatus('success');
        setResendMessage(response.data.message || 'Verification email sent successfully!');
      } else {
        setResendStatus('error');
        setResendMessage(response.data.message || 'Failed to resend email.');
      }
    } catch (error) {
      setResendStatus('error');
      
      if (error.response?.status === 429) {
        setResendMessage(error.response.data.message || 'Too many requests. Please wait before trying again.');
      } else if (error.response?.data?.message) {
        setResendMessage(error.response.data.message);
      } else {
        setResendMessage('An error occurred. Please try again later.');
      }
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
            <Mail className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Verify Your Email
          </h2>
          
          <p className="text-gray-600 mb-6">
            We've sent a verification email to{' '}
            <span className="font-medium text-gray-900">{userEmail}</span>.
            Please check your inbox and click the verification link to activate your account.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              Didn't receive the email?
            </h3>
            <ul className="text-sm text-blue-700 text-left space-y-1">
              <li>• Check your spam or junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes and try resending</li>
            </ul>
          </div>

          {resendStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 text-left">{resendMessage}</p>
            </div>
          )}

          {resendStatus === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">{resendMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Resend Verification Email'
              )}
            </button>

            <button
              onClick={handleBackToLogin}
              className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
