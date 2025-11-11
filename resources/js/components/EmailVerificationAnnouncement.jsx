import React from 'react';
import { Shield, Mail, Lock, CheckCircle, X } from 'lucide-react';

const EmailVerificationAnnouncement = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center text-white">
            <Shield className="w-12 h-12 mr-4" />
            <div>
              <h2 className="text-2xl font-bold">Enhanced Account Security</h2>
              <p className="text-indigo-100 mt-1">Email Verification Now Required</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              What's Changing?
            </h3>
            <p className="text-gray-700 leading-relaxed">
              To better protect your account and financial data, we've implemented email verification
              for all users. This is a one-time security enhancement that ensures only you can access
              your account.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              How It Works
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-indigo-600 font-semibold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Login Attempt</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    When you try to log in, we'll automatically send a verification email to your registered address.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-indigo-600 font-semibold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Check Your Email</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Look for an email from us with the subject "Verify Your Email Address." Check your spam folder if you don't see it.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-indigo-600 font-semibold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Click the Link</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Click the verification button in the email. The link is valid for 24 hours.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">You're All Set!</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Once verified, you can log in normally. You'll only need to do this once.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              Why We're Doing This
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <Lock className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Enhanced Security</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Protect your account from unauthorized access
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Shield className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Data Protection</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Keep your financial information safe
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <Mail className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Verified Contact</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Ensure we can reach you with important updates
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-gray-900">Industry Standard</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Following best practices in account security
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-yellow-900 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Verification links expire after 24 hours</li>
              <li>• You can request up to 3 verification emails per hour</li>
              <li>• Check your spam folder if you don't receive the email</li>
              <li>• Your account data remains safe during this process</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors font-medium"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationAnnouncement;
