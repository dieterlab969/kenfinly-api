import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
      checkConsentStatus();
  }, []);

   const checkConsentStatus = async () => {
     try {
       const response = await axios.get('/api/consent');
       if (!response.data.data.has_consent) {
           setShowBanner(true);
       }
     } catch (error) {
       console.error('Error checking consent:', error);
     }
   }

  const handleAcceptAll = async () => {
      await saveConsent(true, true);
  };

  const handleRejectAll = async () => {
      await saveConsent(false, false);
  };

  const handleSavePreferences = async (analytics, marketing) => {
      await saveConsent(analytics, marketing);
  };

  const saveConsent = async (analyticsConsent, marketingConsent) => {
    try {
      await axios.post('/api/consent', {
          analytics_consent: analyticsConsent,
          marketing_consent: marketingConsent
      });
      setShowBanner(false);

      if (analyticsConsent) {
          initializeAnalytics();
      }
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  }

  const initializeAnalytics = () => {
    // Load Google Analytics script only after consent
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${import.meta.env.VITE_GA_MEASUREMENT_ID}`;
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', import.meta.env.VITE_GA_MEASUREMENT_ID);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-gray-200 p-6 z-50">
        <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Your Privacy Matters</h3>
                    <p className="text-sm text-gray-600">
                        We use cookies and analytics to improve your experience on our site. 
                        You can choose which types of data collection you're comfortable with.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Customize
                    </button>
                    <button
                        onClick={handleRejectAll}
                        className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Reject All
                    </button>
                    <button
                        onClick={handleAcceptAll}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Accept All
                    </button>
                </div>
            </div>

            {showDetails && (
                <ConsentDetails onSave={handleSavePreferences} />
            )}
        </div>
    </div>
  );
  };

  const ConsentDetails = ({ onSave }) => {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="space-y-4">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-medium mb-1">Analytics Cookies</h4>
                    <p className="text-sm text-gray-600">
                        Help us understand how you use our site so we can improve your experience.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                        type="checkbox"
                        checked={analytics}
                        onChange={(e) => setAnalytics(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <h4 className="font-medium mb-1">Marketing Cookies</h4>
                    <p className="text-sm text-gray-600">
                        Allow us to show you relevant content and personalized experiences.
                    </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                        type="checkbox"
                        checked={marketing}
                        onChange={(e) => setMarketing(e.target.checked)}
                        className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
            </div>
        </div>

        <button
            onClick={() => onSave(analytics, marketing)}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
            Save My Preferences
        </button>
    </div>
  );
  };

  export default CookieConsent;
}