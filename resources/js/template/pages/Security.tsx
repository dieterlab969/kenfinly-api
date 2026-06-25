import React, { useState, useRef } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import { useSecuritySettings, ToggleKey } from '../hooks/useSecuritySettings.ts';
import api from '../../utils/api.js';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModalState {
  open: boolean;
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes sec-spin { to { transform: rotate(360deg); } }
  @keyframes sec-shimmer { 0%,100%{opacity:.45} 50%{opacity:1} }

  .sec-toggle-spinner {
    display: inline-block;
    width: 12px; height: 12px;
    border: 2px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: sec-spin .6s linear infinite;
    margin-left: 8px;
    vertical-align: middle;
  }

  /* Modal overlay */
  .sec-modal-overlay {
    position: fixed; inset: 0; z-index: 1000;
    background: rgba(0,0,0,.45);
    display: flex; align-items: flex-end;
    animation: sec-overlay-in .2s ease;
  }
  @keyframes sec-overlay-in { from { opacity: 0; } to { opacity: 1; } }

  .sec-modal-sheet {
    background: #fff; width: 100%; border-radius: 20px 20px 0 0;
    padding: 28px 24px 40px;
    animation: sec-slide-up .25s ease;
    max-height: 90vh; overflow-y: auto;
  }
  @keyframes sec-slide-up {
    from { transform: translateY(100%); }
    to   { transform: translateY(0); }
  }

  .sec-modal-title {
    font-size: 18px; font-weight: 700; color: #111827;
    margin-bottom: 6px;
  }
  .sec-modal-sub {
    font-size: 13px; color: #6b7280; margin-bottom: 24px;
  }
  .sec-modal-drag {
    width: 40px; height: 4px; background: #e5e7eb;
    border-radius: 2px; margin: 0 auto 24px;
  }

  .sec-field-group {
    margin-bottom: 16px;
  }
  .sec-field-label {
    display: block; font-size: 12px; font-weight: 600;
    color: #374151; margin-bottom: 6px; text-transform: uppercase;
    letter-spacing: .4px;
  }
  .sec-field-input {
    width: 100%; border: 1px solid #d1d5db; border-radius: 10px;
    padding: 12px 14px; font-size: 15px; color: #111827;
    outline: none; box-sizing: border-box; background: #f9fafb;
    transition: border-color .15s, box-shadow .15s;
  }
  .sec-field-input:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
    background: #fff;
  }
  .sec-field-input.error { border-color: #ef4444; background: #fff; }
  .sec-field-error {
    color: #ef4444; font-size: 11px; margin-top: 4px; display: block;
  }

  /* PIN digit row */
  .sec-pin-row {
    display: flex; gap: 8px; justify-content: center;
    margin-bottom: 8px;
  }
  .sec-pin-digit {
    width: 44px; height: 52px;
    border: 1.5px solid #d1d5db; border-radius: 10px;
    font-size: 20px; font-weight: 700; color: #111827;
    text-align: center; outline: none; background: #f9fafb;
    transition: border-color .15s, box-shadow .15s;
    -moz-appearance: textfield;
  }
  .sec-pin-digit::-webkit-outer-spin-button,
  .sec-pin-digit::-webkit-inner-spin-button { -webkit-appearance: none; }
  .sec-pin-digit:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99,102,241,.12);
    background: #fff;
  }
  .sec-pin-digit.error { border-color: #ef4444; }
  .sec-pin-label {
    text-align: center; font-size: 12px; color: #6b7280; margin-bottom: 16px;
  }

  .sec-alert-success {
    background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
    border-radius: 10px; padding: 10px 14px; font-size: 13px;
    margin-bottom: 16px; display: flex; gap: 8px; align-items: center;
  }
  .sec-alert-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    border-radius: 10px; padding: 10px 14px; font-size: 13px;
    margin-bottom: 16px;
  }

  /* Buttons */
  .sec-btn-primary {
    width: 100%; padding: 14px; border: none; border-radius: 12px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff; font-size: 15px; font-weight: 700;
    cursor: pointer; transition: opacity .15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .sec-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
  .sec-btn-ghost {
    width: 100%; padding: 13px; border: 1.5px solid #d1d5db;
    border-radius: 12px; background: none; color: #6b7280;
    font-size: 14px; font-weight: 600; cursor: pointer;
    margin-top: 10px; transition: border-color .15s;
  }
  .sec-btn-ghost:hover { border-color: #9ca3af; }

  /* Toggle error banner */
  .sec-toggle-error {
    background: #fef2f2; border: 1px solid #fecaca; color: #dc2626;
    border-radius: 8px; padding: 8px 12px; font-size: 12px;
    margin: 8px 0 4px;
  }

  /* Skeleton shimmer row */
  .sec-skeleton-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 0; border-bottom: 1px solid #f3f4f6;
    animation: sec-shimmer 1.4s ease infinite;
  }
  .sec-skeleton-text {
    height: 14px; border-radius: 4px; background: #e5e7eb;
  }
  .sec-skeleton-toggle {
    width: 48px; height: 26px; border-radius: 13px; background: #e5e7eb;
    flex-shrink: 0;
  }
  .sec-skeleton-btn {
    height: 46px; border-radius: 10px; background: #f3f4f6; margin-top: 12px;
  }
`;

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#fff' }) => (
  <span style={{
    display: 'inline-block', width: size, height: size,
    border: `2px solid rgba(255,255,255,.3)`,
    borderTop: `2px solid ${color}`,
    borderRadius: '50%', animation: 'sec-spin .6s linear infinite',
  }} aria-hidden="true" />
);

// ─── Toggle row ───────────────────────────────────────────────────────────────

interface ToggleRowProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  disabled: boolean;
  saving: boolean;
  onChange: (value: boolean) => void;
  isLast?: boolean;
}

const ToggleRow: React.FC<ToggleRowProps> = ({
  id, label, description, checked, disabled, saving, onChange, isLast,
}) => (
  <div className={`notification-option-wrap${isLast ? ' border-0' : ''}`}>
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

// ─── PIN digit input helper ───────────────────────────────────────────────────

interface PinInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  id: string;
}

const PinInput: React.FC<PinInputProps> = ({ label, value, onChange, error, id }) => {
  const refs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  function handleKey(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    const key = e.key;
    if (/^\d$/.test(key)) {
      e.preventDefault();
      const next = [...digits];
      next[idx] = key;
      onChange(next.join('').replace(/\D/g, '').slice(0, 6));
      if (idx < 5) refs[idx + 1].current?.focus();
    } else if (key === 'Backspace') {
      e.preventDefault();
      const next = [...digits];
      if (next[idx] !== '' && next[idx] !== ' ') {
        next[idx] = '';
      } else if (idx > 0) {
        next[idx - 1] = '';
        refs[idx - 1].current?.focus();
      }
      onChange(next.join('').replace(/\D/g, ''));
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    const focusIdx = Math.min(pasted.length, 5);
    refs[focusIdx].current?.focus();
  }

  return (
    <div className="sec-field-group">
      <span className="sec-field-label">{label}</span>
      <div className="sec-pin-row" id={id}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={refs[i]}
            type="password"
            inputMode="numeric"
            maxLength={1}
            className={`sec-pin-digit${error ? ' error' : ''}`}
            value={d.trim() || ''}
            onChange={() => {}}
            onKeyDown={e => handleKey(i, e)}
            onPaste={handlePaste}
            onFocus={() => refs[i].current?.select()}
            aria-label={`${label} digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <span className="sec-field-error" style={{ textAlign: 'center', display: 'block' }}>{error}</span>}
    </div>
  );
};

// ─── Change Password Modal ────────────────────────────────────────────────────

interface ChangePasswordModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSuccess }) => {
  const [form,    setForm]    = useState({ current_password: '', new_password: '', new_password_confirmation: '' });
  const [errors,  setErrors]  = useState<Record<string, string>>({});
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  function handleChange(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (errors[field]) setErrors(e => { const n = { ...e }; delete n[field]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setErrors({});

    try {
      await api.put('/v1/user/change-password', form);
      setSuccess('Password changed. You will be logged out.');
      setTimeout(() => { onSuccess(); }, 2000);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const apiErrors = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.keys(apiErrors).forEach(k => {
          mapped[k] = Array.isArray(apiErrors[k]) ? apiErrors[k][0] : apiErrors[k];
        });
        setErrors(mapped);
      } else {
        setError(err.response?.data?.message ?? 'Failed to change password. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sec-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sec-modal-sheet" role="dialog" aria-modal="true" aria-label="Change Password">
        <div className="sec-modal-drag" />
        <p className="sec-modal-title">Change Password</p>
        <p className="sec-modal-sub">Choose a strong password of at least 8 characters.</p>

        {success && (
          <div className="sec-alert-success"><span>✓</span> {success}</div>
        )}
        {error && (
          <div className="sec-alert-error">{error}</div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            {[
              { field: 'current_password',          label: 'Current Password',        placeholder: 'Enter current password' },
              { field: 'new_password',               label: 'New Password',             placeholder: 'At least 8 characters' },
              { field: 'new_password_confirmation',  label: 'Confirm New Password',     placeholder: 'Repeat new password' },
            ].map(({ field, label, placeholder }) => (
              <div className="sec-field-group" key={field}>
                <label className="sec-field-label" htmlFor={field}>{label}</label>
                <input
                  id={field}
                  type="password"
                  className={`sec-field-input${errors[field] ? ' error' : ''}`}
                  value={(form as any)[field]}
                  onChange={e => handleChange(field, e.target.value)}
                  placeholder={placeholder}
                  autoComplete={field === 'current_password' ? 'current-password' : 'new-password'}
                />
                {errors[field] && <span className="sec-field-error">{errors[field]}</span>}
              </div>
            ))}

            <button type="submit" className="sec-btn-primary" disabled={saving}>
              {saving && <Spinner />}
              {saving ? 'Saving…' : 'Save Password'}
            </button>
            <button type="button" className="sec-btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Change PIN Modal ─────────────────────────────────────────────────────────

interface ChangePinModalProps {
  hasPin: boolean;
  onClose: () => void;
  onSuccess: (hasPin: boolean) => void;
}

const ChangePinModal: React.FC<ChangePinModalProps> = ({ hasPin, onClose, onSuccess }) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin,     setNewPin]     = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errors,     setErrors]     = useState<Record<string, string>>({});
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState('');
  const [error,      setError]      = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setError('');

    // Client-side check
    const errs: Record<string, string> = {};
    if (hasPin && currentPin.length < 6) errs.current_pin = 'Please enter your 6-digit current PIN.';
    if (newPin.length < 6)               errs.new_pin     = 'New PIN must be exactly 6 digits.';
    if (confirmPin !== newPin)           errs.confirm_pin = 'PINs do not match.';
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      const payload: Record<string, string> = {
        new_pin:                  newPin,
        new_pin_confirmation:     confirmPin,
      };
      if (hasPin) payload.current_pin = currentPin;

      const res = await api.post('/v1/user/change-pin', payload);
      setSuccess(res.data.message ?? 'PIN saved successfully.');
      setTimeout(() => { onSuccess(true); }, 1500);
    } catch (err: any) {
      if (err.response?.status === 422) {
        const apiErrors = err.response.data?.errors ?? {};
        const mapped: Record<string, string> = {};
        Object.keys(apiErrors).forEach(k => {
          mapped[k] = Array.isArray(apiErrors[k]) ? apiErrors[k][0] : apiErrors[k];
        });
        setErrors(mapped);
      } else {
        setError(err.response?.data?.message ?? 'Failed to save PIN. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sec-modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="sec-modal-sheet" role="dialog" aria-modal="true" aria-label="Change PIN">
        <div className="sec-modal-drag" />
        <p className="sec-modal-title">{hasPin ? 'Change PIN' : 'Set a PIN'}</p>
        <p className="sec-modal-sub">
          {hasPin
            ? 'Enter your current PIN, then choose a new 6-digit PIN.'
            : 'Set a 6-digit PIN for quick and secure access.'}
        </p>

        {success && (
          <div className="sec-alert-success"><span>✓</span> {success}</div>
        )}
        {error && (
          <div className="sec-alert-error">{error}</div>
        )}

        {!success && (
          <form onSubmit={handleSubmit} noValidate>
            {hasPin && (
              <PinInput
                id="current_pin"
                label="Current PIN"
                value={currentPin}
                onChange={setCurrentPin}
                error={errors.current_pin}
              />
            )}
            <PinInput
              id="new_pin"
              label="New PIN"
              value={newPin}
              onChange={setNewPin}
              error={errors.new_pin}
            />
            <PinInput
              id="confirm_pin"
              label="Confirm New PIN"
              value={confirmPin}
              onChange={setConfirmPin}
              error={errors.confirm_pin}
            />

            <button type="submit" className="sec-btn-primary" disabled={saving}>
              {saving && <Spinner />}
              {saving ? 'Saving…' : hasPin ? 'Change PIN' : 'Set PIN'}
            </button>
            <button type="button" className="sec-btn-ghost" onClick={onClose} disabled={saving}>
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const Security: React.FC = () => {
  const {
    settings, loading, fetchError, savingToggles, toggleError, refetch, updateToggle,
  } = useSecuritySettings();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal,      setShowPinModal]      = useState(false);
  const [successBanner,     setSuccessBanner]     = useState('');
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function flash(msg: string) {
    setSuccessBanner(msg);
    if (successTimer.current) clearTimeout(successTimer.current);
    successTimer.current = setTimeout(() => setSuccessBanner(''), 4000);
  }

  function handlePasswordSuccess() {
    setShowPasswordModal(false);
    // Force logout after password change — clear auth state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  function handlePinSuccess(hasPinNow: boolean) {
    setShowPinModal(false);
    flash(hasPinNow ? 'PIN saved successfully.' : 'PIN removed.');
  }

  return (
    <div>
      <style>{STYLES}</style>

      {/* ── Modals ── */}
      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handlePasswordSuccess}
        />
      )}
      {showPinModal && settings && (
        <ChangePinModal
          hasPin={settings.has_pin}
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
        />
      )}

      <div className="site-content">
        <div className="verify-number-main">

          {/* ── Top bar ── */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn"><BackBtn /></div>
                <div className="header-title"><p>Security</p></div>
              </div>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="verify-number-bottom" id="security-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Security</h1>

                {/* ── Global success banner ── */}
                {successBanner && (
                  <div className="sec-alert-success" role="status" style={{ margin: '0 0 12px' }}>
                    <span>✓</span> {successBanner}
                  </div>
                )}

                {/* ── Loading skeleton ── */}
                {loading && <SecuritySkeleton />}

                {/* ── Fetch error ── */}
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

                {/* ── Settings ── */}
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

                    {/* 4 · Security Alerts */}
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

                    {/* ── Action buttons ── */}
                    <button
                      type="button"
                      className="paid-button2 mt-16"
                      onClick={() => setShowPasswordModal(true)}
                      style={{ display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none', background: 'none', padding: 0 }}
                    >
                      <span className="paid-button2" style={{ display: 'block' }}>Change Password</span>
                    </button>

                    <button
                      type="button"
                      className="paid-button2 mt-16"
                      onClick={() => setShowPinModal(true)}
                      style={{ display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer', border: 'none', background: 'none', padding: 0, marginTop: 12 }}
                    >
                      <span className="paid-button2" style={{ display: 'block' }}>
                        {settings.has_pin ? 'Change PIN' : 'Set PIN'}
                      </span>
                    </button>

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
