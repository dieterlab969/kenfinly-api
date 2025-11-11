import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const EmailVerificationFAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "Why do I need to verify my email?",
      answer: "Email verification is a security measure to protect your account and financial data. It ensures that you have access to the email address associated with your account and helps prevent unauthorized access."
    },
    {
      question: "I'm an existing user. Why am I being asked to verify now?",
      answer: "We've implemented email verification for all users to enhance security across the platform. This is a one-time process that all existing users need to complete to continue accessing their accounts."
    },
    {
      question: "How long is the verification link valid?",
      answer: "Verification links are valid for 24 hours from the time they are sent. If your link expires, you can request a new one from the login page."
    },
    {
      question: "I didn't receive the verification email. What should I do?",
      answer: "First, check your spam or junk folder. If you still can't find it, you can request a new verification email from the login page or the verification pending page. Please note that you can only request 3 verification emails per hour for security reasons."
    },
    {
      question: "Can I change my email address?",
      answer: "Yes, once you've verified your current email and logged in, you can update your email address in the account settings. You'll need to verify any new email address you add."
    },
    {
      question: "What happens if I don't verify my email?",
      answer: "You won't be able to access your account until your email is verified. Your account and data remain safe, but you'll need to complete the verification process to log in."
    },
    {
      question: "I'm having trouble with verification. Who can I contact?",
      answer: "If you're experiencing issues with email verification, please contact our support team. We're here to help you get access to your account as quickly as possible."
    },
    {
      question: "Is my data safe during this process?",
      answer: "Absolutely! Your account and all your financial data remain completely secure. Email verification is an additional security layer to better protect your information."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-3xl mx-auto my-8">
      <div className="flex items-center mb-6">
        <HelpCircle className="w-8 h-8 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">
          Email Verification FAQ
        </h2>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium text-gray-900 pr-4">
                {faq.question}
              </span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-indigo-600 flex-shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
              )}
            </button>

            {openIndex === index && (
              <div className="px-4 pb-4 text-gray-600 border-t border-gray-100 pt-3">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Still need help?</h3>
        <p className="text-sm text-blue-700">
          If you can't find the answer you're looking for or need additional assistance,
          please contact our support team. We're here to help you every step of the way.
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationFAQ;
