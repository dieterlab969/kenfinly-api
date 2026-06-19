import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type InstallState = 'unsupported' | 'installable' | 'ios' | 'installed';

export interface UsePWAInstall {
  installState: InstallState;
  installApp: () => Promise<void>;
  dismissPrompt: () => void;
  isDismissed: boolean;
}

const DISMISS_KEY = 'pwa_install_dismissed';
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in window.navigator && (window.navigator as any).standalone === true)
  );
}

function isDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const ts = parseInt(raw, 10);
  return Date.now() - ts < DISMISS_DURATION_MS;
}

export function usePWAInstall(): UsePWAInstall {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installState, setInstallState] = useState<InstallState>('unsupported');
  const [isDismissed, setIsDismissed] = useState(isDismissedRecently);

  useEffect(() => {
    // Already installed — don't show prompt
    if (isInStandaloneMode()) {
      setInstallState('installed');
      return;
    }

    // iOS Safari: no beforeinstallprompt, show manual instructions
    if (isIOS()) {
      setInstallState('ios');
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallState('installable');
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setInstallState('installed');
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallState('installed');
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const dismissPrompt = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
    setIsDismissed(true);
  }, []);

  return { installState, installApp, dismissPrompt, isDismissed };
}
