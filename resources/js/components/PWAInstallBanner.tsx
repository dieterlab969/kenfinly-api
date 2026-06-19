import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';

/**
 * PWA Install Banner
 * - Android/Chrome: shows native install prompt when triggered
 * - iOS Safari: shows "Share → Add to Home Screen" guide
 * - Hidden when already installed or dismissed for 7 days
 */
export default function PWAInstallBanner() {
  const { installState, installApp, dismissPrompt, isDismissed } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Don't render if installed, unsupported, or dismissed
  if (installState === 'installed' || installState === 'unsupported' || isDismissed) {
    return null;
  }

  if (showIOSGuide) {
    return (
      <div style={styles.overlay} role="dialog" aria-modal="true" aria-label="Install instructions">
        <div style={styles.modal}>
          <button style={styles.closeBtn} onClick={() => { setShowIOSGuide(false); dismissPrompt(); }} aria-label="Close">
            ✕
          </button>

          <div style={styles.modalIcon}>
            <img src="/icons/icon-192.png" alt="Kenfinly" style={styles.appIcon} />
          </div>
          <h2 style={styles.modalTitle}>Install Kenfinly</h2>
          <p style={styles.modalSubtitle}>Add to your Home Screen for the best experience</p>

          <ol style={styles.steps}>
            <li style={styles.step}>
              <span style={styles.stepNum}>1</span>
              <span>Tap the <strong>Share</strong> button
                <svg style={styles.shareIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>
                in Safari
              </span>
            </li>
            <li style={styles.step}>
              <span style={styles.stepNum}>2</span>
              <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
            </li>
            <li style={styles.step}>
              <span style={styles.stepNum}>3</span>
              <span>Tap <strong>"Add"</strong> to confirm</span>
            </li>
          </ol>

          <button style={styles.doneBtn} onClick={() => { setShowIOSGuide(false); dismissPrompt(); }}>
            Got it!
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.banner} role="complementary" aria-label="Install app banner">
      <img src="/icons/icon-192.png" alt="" style={styles.bannerIcon} />
      <div style={styles.bannerText}>
        <strong style={styles.bannerTitle}>Install Kenfinly</strong>
        <span style={styles.bannerSub}>Add to Home Screen for quick access</span>
      </div>
      <div style={styles.bannerActions}>
        {installState === 'installable' ? (
          <button style={styles.installBtn} onClick={installApp}>
            Install
          </button>
        ) : (
          <button style={styles.installBtn} onClick={() => setShowIOSGuide(true)}>
            How to
          </button>
        )}
        <button style={styles.dismissBtn} onClick={dismissPrompt} aria-label="Dismiss">
          ✕
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  banner: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    background: '#ffffff',
    borderTop: '1px solid #e2e8f0',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.10)',
    paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: '0.9rem',
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bannerSub: {
    fontSize: '0.75rem',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  bannerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  installBtn: {
    background: '#3B5BDB',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '1rem',
    cursor: 'pointer',
    padding: '4px 8px',
    lineHeight: 1,
  },
  // Modal (iOS guide)
  overlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    padding: '0 0 env(safe-area-inset-bottom)',
  },
  modal: {
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '32px 24px 40px',
    width: '100%',
    maxWidth: 480,
    position: 'relative',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    background: '#f1f5f9',
    border: 'none',
    borderRadius: '50%',
    width: 32,
    height: 32,
    fontSize: '0.875rem',
    color: '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalIcon: {
    marginBottom: 12,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 4px',
  },
  modalSubtitle: {
    color: '#64748b',
    fontSize: '0.9rem',
    margin: '0 0 24px',
  },
  steps: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 24px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: '0.9rem',
    color: '#334155',
  },
  stepNum: {
    background: '#3B5BDB',
    color: '#fff',
    borderRadius: '50%',
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: '0.8rem',
    flexShrink: 0,
  },
  shareIcon: {
    width: 18,
    height: 18,
    display: 'inline',
    verticalAlign: 'middle',
    margin: '0 2px',
    color: '#3B5BDB',
  },
  doneBtn: {
    background: '#3B5BDB',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    padding: '14px 0',
    width: '100%',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
