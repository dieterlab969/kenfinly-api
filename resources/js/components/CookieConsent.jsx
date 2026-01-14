import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from '@assets/js/contexts/TranslationContext.jsx';

const CookieConsent = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentConsent, setCurrentConsent] = useState({
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
      checkConsentStatus();
  }, []);


   const checkConsentStatus = async () => {
     try {
       const response = await axios.get('/api/consent');
       if (response.data.data && response.data.data.disabled) {
           setShowBanner(false);
           return;
       }
       if (!response.data.data || !response.data.data.has_consent) {
           setShowBanner(true);
       } else {
            // Initialize currentConsent with saved values
            setCurrentConsent({
                analytics: !!response.data.data.analytics_consent,
                marketing: !!response.data.data.marketing_consent,
            });
       }
     } catch (error) {
       console.error('Error checking consent:', error);
       setShowBanner(true); // Show banner on error to be safe
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
      setCurrentConsent({
        analytics: analyticsConsent,
        marketing: marketingConsent,
      });

      if (analyticsConsent) {
          initializeAnalytics();
      }
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  }

  const initializeAnalytics = (analyticsConsent, marketingConsent) => {
    window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
          event: 'consent_update',
          analytics_consent: analyticsConsent,
          marketing_consent: marketingConsent,
      });
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t-2 border-gray-200 p-6 z-50">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">{t('cookieConsent.privacyTitle')}</h3>
            <p className="text-sm text-gray-600">
              {t('cookieConsent.bannerDescription')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {t('cookieConsent.customize')}
            </button>
            <button
              onClick={handleRejectAll}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              {t('cookieConsent.rejectAll')}
            </button>
            <button
              onClick={handleAcceptAll}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {t('cookieConsent.acceptAll')}
            </button>
          </div>
        </div>
        {showDetails && (
          <ConsentDetails
            analyticsInitial={currentConsent.analytics}
            marketingInitial={currentConsent.marketing}
            onSave={handleSavePreferences}
            t={t}
          />
        )}
      </div>
    </div>
  );
  };

  const ConsentDetails = ({ analyticsInitial, marketingInitial, onSave, t }) => {
  const [analytics, setAnalytics] = useState(analyticsInitial);
  const [marketing, setMarketing] = useState(marketingInitial);

  React.useEffect(() => {
    setAnalytics(analyticsInitial);
    setMarketing(marketingInitial);
  }, [analyticsInitial, marketingInitial]);

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium mb-1">{t('cookieConsent.analyticsTitle')}</h4>
            <p className="text-sm text-gray-600">
              {t('cookieConsent.analyticsDescription')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={analytics}
              onChange={(e) => setAnalytics(e.target.checked)}
              className="sr-only peer"
              aria-checked={analytics}
              role="switch"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium mb-1">{t('cookieConsent.marketingTitle')}</h4>
            <p className="text-sm text-gray-600">
              {t('cookieConsent.marketingDescription')}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
              className="sr-only peer"
              aria-checked={marketing}
              role="switch"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>
      <button
        onClick={() => onSave(analytics, marketing)}
        className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {t('cookieConsent.savePreferences')}
      </button>
    </div>
  );
};

export default CookieConsent;
