import React from 'react';
import ReactDOM from 'react-dom/client';
import TemplateApp from './template/App';
import PWAInstallBanner from './components/PWAInstallBanner';

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Check for updates every 60 seconds while app is open
        setInterval(() => reg.update(), 60_000);
      })
      .catch((err) => console.warn('[SW] Registration failed:', err));
  });
}

ReactDOM.createRoot(document.getElementById('app') as HTMLElement).render(
  <React.StrictMode>
    <TemplateApp />
    <PWAInstallBanner />
  </React.StrictMode>
);
