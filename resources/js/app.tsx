import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { RecaptchaConfigContext } from './components/App';
import TemplateApp from './template/App';
import PWAInstallBanner from './components/PWAInstallBanner';

interface AppConfig {
  recaptcha_enabled: boolean;
  recaptcha_site_key?: string;
}

function AppWrapper() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/config', { headers: { Accept: 'application/json' } })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setConfig(data.config as AppConfig);
        } else {
          setConfig({ recaptcha_enabled: false });
        }
      })
      .catch(() => {
        setConfig({ recaptcha_enabled: false });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #ddd6fe', borderTopColor: '#7B51F1', borderRadius: '50%', animation: 'spin 0.9s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const recaptchaEnabled = config?.recaptcha_enabled ?? false;
  const recaptchaSiteKey = config?.recaptcha_site_key ?? '';

  const content = (
    <RecaptchaConfigContext.Provider value={{ enabled: recaptchaEnabled }}>
      <TemplateApp />
      <PWAInstallBanner />
    </RecaptchaConfigContext.Provider>
  );

  if (recaptchaEnabled && recaptchaSiteKey) {
    return (
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
        {content}
      </GoogleReCaptchaProvider>
    );
  }

  return content;
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        setInterval(() => reg.update(), 60_000);
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
);
