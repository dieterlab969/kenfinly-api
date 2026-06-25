import React, { useState, useRef } from 'react';
import { Offcanvas } from 'bootstrap';
import BackBtn from '../components/BackBtn.tsx';
import { useSecuritySettings, ToggleKey } from '../hooks/useSecuritySettings.ts';
import api from '../../utils/api.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PwForm {
  current_password:          string;
  new_password:              string;
  new_password_confirmation: string;
}

// ─── Scoped styles ────────────────────────────────────────────────────────────
// Only genuinely new atoms — no overrides for elements that already exist in the
// design system (Bootstrap form-control, offcanvas, etc.).
// Pattern mirrors PersonalInfo.tsx's `pi-alert-*` / `pi-spin` approach.

const STYLES = `
  @keyframes sec-spin    { to { transform: rotate(360deg); } }
  @keyframes sec-shimmer { 0%,100%{opacity:.45} 50%{opacity:1} }

  /* Inline spinner shown next to a toggle label while the PUT is in-flight */
  .sec-toggle-spinner {
    display: inline-block; width: 12px; height: 12px;
    border: 2px solid #e5e7eb; border-top-color: #6366f1;
    border-radius: 50%; animation: sec-spin .6s linear infinite;
    margin-left: 8px; vertical-align: middle;
  }

  /* Loading skeleton rows */
  .sec-skeleton-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0; border-bottom: 1px solid #f3f4f6;
    animation: sec-shimmer 1.4s ease infinite;
  }
  .sec-skeleton-text  { height: 14px; border-radius: 4px; background: #e5e7eb; }
  .sec-skeleton-toggle{ width: 48px; height: 26px; border-radius: 13px; background: #e5e7eb; flex-shrink: 0; }
  .sec-skeleton-btn   { height: 46px; border-radius: 10px; background: #f3f4f6; margin-top: 12px; }

  /* Toggle-level error banner */
  .sec-toggle-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    border-radius: 8px; padding: 8px 12px; font-size: 12px; margin: 8px 0 4px;
  }

  /* Inline alert banners — same pattern as PersonalInfo.tsx pi-alert-* */
  .sec-alert-success {
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
    border-radius: 8px; padding: 10px 14px; font-size: 13px;
    margin-bottom: 12px; display: flex; align-items: center; gap: 8px;
  }
  .sec-alert-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    border-radius: 8px; padding: 10px 14px; font-size: 13px; margin-bottom: 12px;
  }

  /* Allow taller form content inside the existing logout-main offcanvas */
  .sec-form-canvas            { max-height: 88vh; overflow-y: auto; }
  .sec-form-canvas .offcanvas-body { padding-bottom: 40px; }

  /* 6-digit PIN row — extends the existing otp-section flex layout */
  .sec-pin-6 { justify-content: center; gap: 8px; }
  .sec-pin-6 .otp {
    width: calc((100% - 40px) / 6);
    min-width: 40px; text-align: center;
    padding: 10px 4px; font-size: 18px;
  }
`;

// ─── Chevron SVG (same markup as Activity.tsx offcanvas close button) ─────────

const ChevronDown: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 24 16" fill="none">
    <path d="M22 8L12 13L2 8"  stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M22 2L12 7L2 2"  stroke="#F2EEFE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Spinner (same shape as PersonalInfo.tsx Spinner) ─────────────────────────

const Spinner: React.FC = () => (
  <span style={{
    display: 'inline-block', width: 14, height: 14,
    border: '2px solid rgba(255,255,255,.35)', borderTop: '2px solid #fff',
    borderRadius: '50%', animation: 'sec-spin .65s linear infinite',
  }} aria-hidden="true" />
);

// ─── Toggle row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  id:          string;
  label:       string;
  description?: string;
  checked:     boolean;
  disabled:    boolean;
  saving:      boolean;
  onChange:    (value: boolean) => void;
  isLast?:     boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  id, label, description, checked, disabled, saving, onChange, isLast,
}) => (
  <div className="notification-option-wrapper">
    <div className="notification-option-name" style={{ flex: 1 }}>
      <p style={{ marginBottom: description ? 2 : 0 }}>{label}</p>
      {description && (
        <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', lineHeight: 1.4 }}>
          {description}
        </span>
      )}
    </div>
    <div className="notification-option-switch" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {saving && <span className="sec-toggle-spinner" aria-hidden="true" />}
      <label className="switch" htmlFor={id} style={{ opacity: disabled ? 0.7 : 1 }}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          disabled={disabled}
          onChange={e => onChange(e.target.checked)}
        />
        <span className="slider" />
      </label>
    </div>
  </div>
);

// ─── Loading skeleton ─────────────────────────────────────────────────────────

const SecuritySkeleton: React.FC = () => (
  <div className="notification-setting">
    {[140, 180, 160, 155].map((w, i) => (
      <div key={i} className="sec-skeleton-row" style={{ animationDelay: `${i * 0.1}s` }}>
        <div className="sec-skeleton-text" style={{ width: w }} />
        <div className="sec-skeleton-toggle" />
      </div>
    ))}
    <div className="sec-skeleton-btn" style={{ marginTop: 24 }} />
    <div className="sec-skeleton-btn" style={{ animationDelay: '.1s' }} />
  </div>
);

// ─── 6-digit PIN row ──────────────────────────────────────────────────────────
// Uses existing CSS classes: digit-group otp-section + form-control otp
// Matches the pattern in CreateNewPin.tsx (extended from 4 → 6 inputs).

interface PinRowProps {
  value:     string;
  onChange:  (v: string) => void;
  groupId:   string;
  isInvalid: boolean;
  disabled:  boolean;
}

const PinRow: React.FC<PinRowProps> = ({ value, onChange, groupId, isInvalid, disabled }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = (value + '      ').slice(0, 6).split('');

  function handleChange(e: React.ChangeEvent<HTMLInputElement>, idx: number) {
    const v = e.target.value.replace(/\D/g, '').slice(-1);
    if (!v) return;
    const arr = value.split('').concat(Array(6).fill('')).slice(0, 6);
    arr[idx] = v;
    onChange(arr.join('').replace(/\s/g, '').padEnd(6, ' ').trimEnd());
    if (idx < 5) refs.current[idx + 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>, idx: number) {
    if (e.key !== 'Backspace') return;
    e.preventDefault();
    const arr = value.split('').concat(Array(6).fill(' ')).slice(0, 6);
    if ((arr[idx] ?? ' ').trim()) {
      arr[idx] = ' ';
      onChange(arr.join('').trimEnd());
    } else if (idx > 0) {
      arr[idx - 1] = ' ';
      onChange(arr.join('').trimEnd());
      refs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs.current[Math.min(pasted.length, 5)]?.focus();
  }

  return (
    <div id={groupId} className="digit-group otp-section sec-pin-6">
      {[0, 1, 2, 3, 4, 5].map(i => (
        <input
          key={i}
          className={`form-control otp${isInvalid ? ' is-invalid' : ''}`}
          type="password"
          inputMode="numeric"
          maxLength={1}
          autoComplete="one-time-code"
          ref={el => { refs.current[i] = el; }}
          value={(digits[i] ?? '').trim()}
          onChange={e => handleChange(e, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`PIN digit ${i + 1}`}
        />
      ))}
    </div>
  );
};

// ─── Security page ────────────────────────────────────────────────────────────

const Security: React.FC = () => {
  const {
    settings, loading, fetchError,
    savingToggles, toggleError, refetch, updateToggle,
  } = useSecuritySettings();

  // ── Offcanvas refs (Bootstrap programmatic API — FaceRecognitionRunning.tsx pattern)
  const passwordCanvasRef = useRef<HTMLDivElement>(null);
  const pinCanvasRef      = useRef<HTMLDivElement>(null);

  function getCanvas(ref: React.RefObject<HTMLDivElement>) {
    if (!ref.current) return null;
    return Offcanvas.getOrCreateInstance(ref.current);
  }

  // ── Change-password form state
  const [pwForm,    setPwForm]    = useState<PwForm>({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [pwErrors,  setPwErrors]  = useState<Record<string, string>>({});
  const [pwSaving,  setPwSaving]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwError,   setPwError]   = useState('');

  function openPasswordCanvas() {
    setPwForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    setPwErrors({});
    setPwError('');
    setPwSuccess('');
    getCanvas(passwordCanvasRef)?.show();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwSaving(true);
    setPwErrors({});
    setPwError('');
    try {
      await api.put('/v1/user/change-password', pwForm);
      setPwSuccess('Password changed. Logging you out…');
      setTimeout(() => {
        getCanvas(passwordCanvasRef)?.hide();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const raw = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.keys(raw).forEach(k => { mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k]; });
        setPwErrors(mapped);
      } else {
        setPwError(err.response?.data?.message ?? 'Failed to change password. Please try again.');
      }
    } finally {
      setPwSaving(false);
    }
  }

  // ── Change-PIN form state
  const [currentPin,  setCurrentPin]  = useState('');
  const [newPin,      setNewPin]      = useState('');
  const [confirmPin,  setConfirmPin]  = useState('');
  const [pinErrors,   setPinErrors]   = useState<Record<string, string>>({});
  const [pinSaving,   setPinSaving]   = useState(false);
  const [pinSuccess,  setPinSuccess]  = useState('');
  const [pinError,    setPinError]    = useState('');

  function openPinCanvas() {
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setPinErrors({});
    setPinError('');
    setPinSuccess('');
    getCanvas(pinCanvasRef)?.show();
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (settings?.has_pin && currentPin.trim().length < 6) errs.current_pin  = 'Please enter your 6-digit current PIN.';
    if (newPin.trim().length < 6)                          errs.new_pin      = 'New PIN must be exactly 6 digits.';
    if (confirmPin.trim() !== newPin.trim())               errs.confirm_pin  = 'PINs do not match.';
    if (Object.keys(errs).length) { setPinErrors(errs); return; }

    setPinSaving(true);
    setPinErrors({});
    setPinError('');
    try {
      const payload: Record<string, string> = {
        new_pin:              newPin.trim(),
        new_pin_confirmation: confirmPin.trim(),
      };
      if (settings?.has_pin) payload.current_pin = currentPin.trim();
      const res = await api.post('/v1/user/change-pin', payload);
      setPinSuccess(res.data.message ?? 'PIN saved successfully.');
      setTimeout(() => { getCanvas(pinCanvasRef)?.hide(); }, 1500);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const raw = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.keys(raw).forEach(k => { mapped[k] = Array.isArray(raw[k]) ? raw[k][0] : raw[k]; });
        setPinErrors(mapped);
      } else {
        setPinError(err.response?.data?.message ?? 'Failed to save PIN. Please try again.');
      }
    } finally {
      setPinSaving(false);
    }
  }

  // ── Page-level success banner
  const [successBanner, setSuccessBanner] = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout>>();

  function flash(msg: string) {
    setSuccessBanner(msg);
    clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessBanner(''), 4000);
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{STYLES}</style>

      {/* ═══════════════════════════════════════════════════════════════════════
          CHANGE PASSWORD — offcanvas offcanvas-bottom
          Follows the exact structure from Activity.tsx logout modal.
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="offcanvas offcanvas-bottom logout-main sec-form-canvas"
        id="changePasswordCanvas"
        ref={passwordCanvasRef}
      >
        <button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
          <ChevronDown />
        </button>

        <div className="offcanvas-body small">
          <h2 className="logout-text-pop mt-12">Change Password</h2>
          <p className="sm-txt mt-16">Enter your current password, then choose a strong new password.</p>

          {pwSuccess && (
            <div className="sec-alert-success mt-16" role="status">
              <span>✓</span> {pwSuccess}
            </div>
          )}
          {pwError && (
            <div className="sec-alert-error mt-16" role="alert">{pwError}</div>
          )}

          {!pwSuccess && (
            <form onSubmit={handlePasswordSubmit} noValidate>

              {/* Current Password — Bootstrap form-floating (CreateNewPassword.tsx pattern) */}
              <div className="form-floating mt-24">
                <input
                  type="password"
                  className={`form-control${pwErrors.current_password ? ' is-invalid' : ''}`}
                  id="sec-current-pw"
                  placeholder="Current password"
                  value={pwForm.current_password}
                  onChange={e => {
                    setPwForm(f => ({ ...f, current_password: e.target.value }));
                    if (pwErrors.current_password) setPwErrors(er => ({ ...er, current_password: '' }));
                  }}
                  autoComplete="current-password"
                  disabled={pwSaving}
                />
                <label htmlFor="sec-current-pw">Current Password</label>
                {pwErrors.current_password && (
                  <div className="invalid-feedback">{pwErrors.current_password}</div>
                )}
              </div>

              {/* New Password */}
              <div className="form-floating mt-12">
                <input
                  type="password"
                  className={`form-control${pwErrors.new_password ? ' is-invalid' : ''}`}
                  id="sec-new-pw"
                  placeholder="New password"
                  value={pwForm.new_password}
                  onChange={e => {
                    setPwForm(f => ({ ...f, new_password: e.target.value }));
                    if (pwErrors.new_password) setPwErrors(er => ({ ...er, new_password: '' }));
                  }}
                  autoComplete="new-password"
                  disabled={pwSaving}
                />
                <label htmlFor="sec-new-pw">New Password</label>
                {pwErrors.new_password && (
                  <div className="invalid-feedback">{pwErrors.new_password}</div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="form-floating mt-12">
                <input
                  type="password"
                  className={`form-control${pwErrors.new_password_confirmation ? ' is-invalid' : ''}`}
                  id="sec-confirm-pw"
                  placeholder="Confirm new password"
                  value={pwForm.new_password_confirmation}
                  onChange={e => {
                    setPwForm(f => ({ ...f, new_password_confirmation: e.target.value }));
                    if (pwErrors.new_password_confirmation) setPwErrors(er => ({ ...er, new_password_confirmation: '' }));
                  }}
                  autoComplete="new-password"
                  disabled={pwSaving}
                />
                <label htmlFor="sec-confirm-pw">Confirm New Password</label>
                {pwErrors.new_password_confirmation && (
                  <div className="invalid-feedback">{pwErrors.new_password_confirmation}</div>
                )}
              </div>

              {/* Buttons — logout-button-main pattern from Activity.tsx */}
              <div className="logout-button-main mt-32">
                <button
                  type="button"
                  className="logout-cancel"
                  data-bs-dismiss="offcanvas"
                  disabled={pwSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="logout-cancel yes-logot"
                  disabled={pwSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                >
                  {pwSaving && <Spinner />}
                  {pwSaving ? 'Saving…' : 'Save Password'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          CHANGE / SET PIN — offcanvas offcanvas-bottom
          PIN row uses digit-group otp-section + form-control otp (CreateNewPin.tsx).
      ═══════════════════════════════════════════════════════════════════════ */}
      <div
        className="offcanvas offcanvas-bottom logout-main sec-form-canvas"
        id="changePinCanvas"
        ref={pinCanvasRef}
      >
        <button type="button" className="text-reset" data-bs-dismiss="offcanvas" aria-label="Close">
          <ChevronDown />
        </button>

        <div className="offcanvas-body small">
          <h2 className="logout-text-pop mt-12">
            {settings?.has_pin ? 'Change PIN' : 'Set a PIN'}
          </h2>
          <p className="sm-txt mt-16">
            {settings?.has_pin
              ? 'Enter your current PIN then choose a new 6-digit PIN.'
              : 'Add a 6-digit PIN to make your account more secure.'}
          </p>

          {pinSuccess && (
            <div className="sec-alert-success mt-16" role="status">
              <span>✓</span> {pinSuccess}
            </div>
          )}
          {pinError && (
            <div className="sec-alert-error mt-16" role="alert">{pinError}</div>
          )}

          {!pinSuccess && (
            <form onSubmit={handlePinSubmit} noValidate>

              {/* Current PIN (only when user already has a PIN) */}
              {settings?.has_pin && (
                <div className="mt-24">
                  <p className="sm-txt" style={{ fontWeight: 600, marginBottom: 10 }}>Current PIN</p>
                  <PinRow
                    groupId="sec-current-pin"
                    value={currentPin}
                    onChange={setCurrentPin}
                    isInvalid={!!pinErrors.current_pin}
                    disabled={pinSaving}
                  />
                  {pinErrors.current_pin && (
                    <p className="text-danger mt-8" style={{ fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                      {pinErrors.current_pin}
                    </p>
                  )}
                </div>
              )}

              {/* New PIN */}
              <div className="mt-24">
                <p className="sm-txt" style={{ fontWeight: 600, marginBottom: 10 }}>New PIN</p>
                <PinRow
                  groupId="sec-new-pin"
                  value={newPin}
                  onChange={setNewPin}
                  isInvalid={!!pinErrors.new_pin}
                  disabled={pinSaving}
                />
                {pinErrors.new_pin && (
                  <p className="text-danger" style={{ fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                    {pinErrors.new_pin}
                  </p>
                )}
              </div>

              {/* Confirm PIN */}
              <div className="mt-24">
                <p className="sm-txt" style={{ fontWeight: 600, marginBottom: 10 }}>Confirm PIN</p>
                <PinRow
                  groupId="sec-confirm-pin"
                  value={confirmPin}
                  onChange={setConfirmPin}
                  isInvalid={!!pinErrors.confirm_pin}
                  disabled={pinSaving}
                />
                {pinErrors.confirm_pin && (
                  <p className="text-danger" style={{ fontSize: 12, textAlign: 'center', margin: '4px 0 0' }}>
                    {pinErrors.confirm_pin}
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="logout-button-main mt-32">
                <button
                  type="button"
                  className="logout-cancel"
                  data-bs-dismiss="offcanvas"
                  disabled={pinSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="logout-cancel yes-logot"
                  disabled={pinSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}
                >
                  {pinSaving && <Spinner />}
                  {pinSaving ? 'Saving…' : settings?.has_pin ? 'Change PIN' : 'Set PIN'}
                </button>
              </div>

            </form>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MAIN PAGE — verify-number-main shell (identical to NotificationSetting.tsx)
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="site-content">
        <div className="verify-number-main">

          {/* Top bar */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn"><BackBtn /></div>
                <div className="header-title"><p>Security</p></div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="verify-number-bottom" id="security-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Security</h1>

                {/* Page-level success banner */}
                {successBanner && (
                  <div className="sec-alert-success" role="status">
                    <span>✓</span> {successBanner}
                  </div>
                )}

                {/* Loading skeleton */}
                {loading && <SecuritySkeleton />}

                {/* Fetch error */}
                {!loading && fetchError && (
                  <div style={{ textAlign: 'center', padding: '48px 16px' }}>
                    <p style={{ color: '#ef4444', marginBottom: 16 }}>{fetchError}</p>
                    <button
                      type="button"
                      onClick={refetch}
                      style={{
                        padding: '10px 24px', background: '#6366f1', color: '#fff',
                        border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Try Again
                    </button>
                  </div>
                )}

                {/* Settings — notification-setting shell (NotificationSetting.tsx) */}
                {!loading && settings && (
                  <div className="notification-setting">

                    {/* Toggle error banner */}
                    {toggleError && (
                      <div className="sec-toggle-error" role="alert">{toggleError}</div>
                    )}

                    {/* 1 · Two-Factor Authentication */}
                    <div className="notification-option-wrap">
                      <ToggleRow
                        id="toggle-2fa"
                        label="Two-Factor Authentication"
                        description="Require a verification code at login"
                        checked={settings.is_2fa_enabled}
                        disabled={savingToggles.has('is_2fa_enabled')}
                        saving={savingToggles.has('is_2fa_enabled')}
                        onChange={v => updateToggle('is_2fa_enabled', v)}
                      />
                    </div>

                    {/* 2 · Biometric Login */}
                    <div className="notification-option-wrap">
                      <ToggleRow
                        id="toggle-biometric"
                        label="Biometric Login"
                        description="Use Face ID or fingerprint to sign in"
                        checked={settings.is_biometric_enabled}
                        disabled={savingToggles.has('is_biometric_enabled')}
                        saving={savingToggles.has('is_biometric_enabled')}
                        onChange={v => updateToggle('is_biometric_enabled', v)}
                      />
                    </div>

                    {/* 3 · Login Notifications */}
                    <div className="notification-option-wrap">
                      <ToggleRow
                        id="toggle-login-notif"
                        label="Login Notifications"
                        description="Get notified whenever your account is accessed"
                        checked={settings.login_notifications_enabled}
                        disabled={savingToggles.has('login_notifications_enabled')}
                        saving={savingToggles.has('login_notifications_enabled')}
                        onChange={v => updateToggle('login_notifications_enabled', v)}
                      />
                    </div>

                    {/* 4 · Security & Marketing Alerts */}
                    <div className="notification-option-wrap border-0">
                      <ToggleRow
                        id="toggle-security-alerts"
                        label="Security &amp; Marketing Alerts"
                        description="Receive emails about account security and offers"
                        checked={settings.security_alerts_enabled}
                        disabled={savingToggles.has('security_alerts_enabled')}
                        saving={savingToggles.has('security_alerts_enabled')}
                        onChange={v => updateToggle('security_alerts_enabled', v)}
                        isLast
                      />
                    </div>

                    {/* Action buttons — paid-button2 pattern (BillPaid.tsx / TransferBank1.tsx) */}
                    <div className="paid-button2 mt-16">
                      <button type="button" onClick={openPasswordCanvas}>
                        Change Password
                      </button>
                    </div>

                    <div className="paid-button2 mt-16">
                      <button type="button" onClick={openPinCanvas}>
                        {settings.has_pin ? 'Change PIN' : 'Set PIN'}
                      </button>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Security;
