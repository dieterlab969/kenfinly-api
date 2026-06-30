import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../utils/api.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SecuritySettings {
  is_2fa_enabled: boolean;
  is_biometric_enabled: boolean;
  login_notifications_enabled: boolean;
  security_alerts_enabled: boolean;
  has_pin: boolean;
}

export type ToggleKey = Exclude<keyof SecuritySettings, 'has_pin'>;

export interface UseSecuritySettingsReturn {
  settings: SecuritySettings | null;
  loading: boolean;
  fetchError: string;
  savingToggles: Set<ToggleKey>;
  toggleError: string;
  refetch: () => void;
  updateToggle: (key: ToggleKey, value: boolean) => Promise<void>;
}

const ENDPOINT = '/v1/user/security-settings';

const DEFAULT_SETTINGS: SecuritySettings = {
  is_2fa_enabled:              false,
  is_biometric_enabled:        false,
  login_notifications_enabled: true,
  security_alerts_enabled:     true,
  has_pin:                     false,
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Fetches and manages the user's security settings.
 *
 * Optimistic update strategy per toggle:
 *  1. Immediately flip the value in local state.
 *  2. Mark the toggle as "saving" (disables it to prevent race conditions).
 *  3. Send PUT to the API.
 *  4. On success: replace local state with the server response.
 *  5. On failure: revert to the previous value and surface the error.
 */
export function useSecuritySettings(): UseSecuritySettingsReturn {
  const [settings,      setSettings]      = useState<SecuritySettings | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [fetchError,    setFetchError]    = useState('');
  const [savingToggles, setSavingToggles] = useState<Set<ToggleKey>>(new Set());
  const [toggleError,   setToggleError]   = useState('');

  // Prevent state updates after unmount
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const fetch = useCallback(async () => {
    if (mounted.current) { setLoading(true); setFetchError(''); }
    try {
      const res = await api.get(ENDPOINT);
      if (mounted.current) setSettings(res.data.settings ?? DEFAULT_SETTINGS);
    } catch (err: any) {
      if (mounted.current) {
        setFetchError(
          err.response?.data?.message ?? 'Unable to load security settings. Please try again.'
        );
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateToggle = useCallback(async (key: ToggleKey, value: boolean) => {
    if (!mounted.current) return;

    // Optimistic update
    const previous = settings ? settings[key] : !value;
    setSettings(prev => prev ? { ...prev, [key]: value } : prev);
    setSavingToggles(prev => new Set(prev).add(key));
    setToggleError('');

    try {
      const res = await api.put(ENDPOINT, { [key]: value });
      if (mounted.current) {
        setSettings(res.data.settings ?? null);
      }
    } catch (err: any) {
      // Roll back on failure
      if (mounted.current) {
        setSettings(prev => prev ? { ...prev, [key]: previous as boolean } : prev);
        setToggleError(
          err.response?.data?.message ?? 'Failed to save setting. Please try again.'
        );
      }
    } finally {
      if (mounted.current) {
        setSavingToggles(prev => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    }
  }, [settings]);

  return {
    settings,
    loading,
    fetchError,
    savingToggles,
    toggleError,
    refetch: fetch,
    updateToggle,
  };
}
