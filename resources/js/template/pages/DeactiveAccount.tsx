import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BackBtn from '../components/BackBtn.tsx'
import { useSecureLogout } from '../hooks/useSecureLogout'
import api from '../../utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiValidationError {
  message: string
  errors?: Record<string, string[]>
}

type Phase = 'idle' | 'loading' | 'success'

// ─── Type guard ───────────────────────────────────────────────────────────────

function isAxiosError(err: unknown): err is { response: { status: number; data: ApiValidationError } } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response: unknown }).response === 'object' &&
    (err as { response: unknown }).response !== null
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <span
    style={{
      width: 16, height: 16, flexShrink: 0,
      border: '2px solid rgba(255,255,255,0.35)',
      borderTopColor: '#fff',
      borderRadius: '50%',
      display: 'inline-block',
      animation: 'ks-spin 0.75s linear infinite',
    }}
  />
)

// ─── Component ────────────────────────────────────────────────────────────────

const DeactiveAccount: React.FC = () => {
  const { t }      = useTranslation()
  const { logout } = useSecureLogout()

  const [password,    setPassword]    = useState('')
  const [phase,       setPhase]       = useState<Phase>('idle')
  const [fieldError,  setFieldError]  = useState('')
  const [globalError, setGlobalError] = useState('')

  // Auto-logout 1.5 s after a successful API response.
  // skipApiCall: true because the backend already revoked the JWT.
  useEffect(() => {
    if (phase !== 'success') return
    const id = setTimeout(() => logout({ skipApiCall: true }), 1500)
    return () => clearTimeout(id)
  }, [phase, logout])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldError('')
    setGlobalError('')

    if (!password) {
      setFieldError(t('Please enter your password to continue.'))
      return
    }

    setPhase('loading')

    try {
      await api.post('/v1/user/deactivate', { password })
      setPhase('success')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const { status, data } = err.response
        if (status === 422) {
          // Wrong password — keep form open with inline error
          setFieldError(data.errors?.password?.[0] ?? data.message)
          setPhase('idle')
        } else {
          // 500 / unexpected — generic message + console debug log
          setGlobalError(t('An unexpected error occurred. Please try again later.'))
          console.error('[DeactiveAccount] server error:', data)
          setPhase('idle')
        }
      } else {
        // Network timeout / offline
        setGlobalError(t('Network error. Please check your connection and try again.'))
        console.error('[DeactiveAccount] network error:', err)
        setPhase('idle')
      }
    }
  }

  const isLoading = phase === 'loading'

  return (
    <>
      {/* Spinner keyframes — inlined so no global CSS change is needed */}
      <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="site-content">
        <div className="verify-number-main">

          {/* Header */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn"><BackBtn /></div>
                <div className="header-title"><p>{t('Deactivate Account')}</p></div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="verify-number-bottom" id="deactive-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <div className="deactive-account-sec">

                  {/* Success banner */}
                  {phase === 'success' && (
                    <div style={s.successBanner}>
                      <span style={{ fontSize: 22, color: '#22c55e', fontWeight: 700 }}>✓</span>
                      <div>
                        <strong style={{ display: 'block' }}>{t('Account Deactivated')}</strong>
                        <span style={{ fontSize: 13 }}>{t('Logging you out…')}</span>
                      </div>
                    </div>
                  )}

                  {/* Global / network error */}
                  {globalError && (
                    <div style={s.errorBanner} role="alert">⚠&nbsp;{globalError}</div>
                  )}

                  {/* Warning box */}
                  <div style={s.warningBox}>
                    <p style={s.warningTitle}>⚠&nbsp;{t('Deactivate this account?')}</p>
                    <div className="deactivate-step mt-16">
                      <p style={{ fontWeight: 600, marginBottom: 8, color: '#374151' }}>
                        {t('If you deactivate your account:')}
                      </p>
                      <ul className="deactivate-step-list mt-12">
                        <li className="pt-0">{t('Your account and all content will be hidden from others.')}</li>
                        <li>{t('Your financial data and transaction history are safely retained.')}</li>
                        <li>{t('Active paid subscriptions will be paused, not cancelled.')}</li>
                        <li>{t('You can reactivate instantly by logging in again with the same credentials.')}</li>
                      </ul>
                    </div>
                  </div>

                  {/* Password confirmation */}
                  <form onSubmit={handleSubmit} style={{ marginTop: 24 }} noValidate>
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="da-password">
                        {t('Confirm your password')}
                      </label>
                      <input
                        id="da-password"
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setFieldError('') }}
                        disabled={isLoading || phase === 'success'}
                        placeholder={t('Enter your password')}
                        autoComplete="current-password"
                        style={{ ...s.input, borderColor: fieldError ? '#dc3545' : '#e0d9f7' }}
                      />
                      {fieldError && <p style={s.fieldError} role="alert">{fieldError}</p>}
                    </div>

                    <div className="verify-number-btn" style={{ marginTop: 32 }}>
                      <button
                        type="submit"
                        disabled={isLoading || phase === 'success'}
                        style={{
                          ...s.submitBtn,
                          background: '#dc3545',
                          opacity: isLoading || phase === 'success' ? 0.75 : 1,
                          cursor: isLoading || phase === 'success' ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {isLoading && <Spinner />}
                        {isLoading
                          ? t('Deactivating…')
                          : phase === 'success'
                          ? t('Logging out…')
                          : t('Deactivate Account')}
                      </button>
                    </div>
                  </form>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = {
  warningBox: {
    background: 'rgba(220,53,69,0.06)',
    border: '1px solid rgba(220,53,69,0.25)',
    borderRadius: 12,
    padding: '16px 18px',
    marginTop: 16,
  } satisfies React.CSSProperties,

  warningTitle: {
    color: '#dc3545',
    fontWeight: 700,
    fontSize: 15,
    margin: 0,
  } satisfies React.CSSProperties,

  successBanner: {
    background: 'rgba(34,197,94,0.10)',
    border: '1px solid rgba(34,197,94,0.35)',
    borderRadius: 12,
    padding: '14px 16px',
    marginBottom: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    color: '#166534',
  } satisfies React.CSSProperties,

  errorBanner: {
    background: 'rgba(220,53,69,0.08)',
    border: '1px solid rgba(220,53,69,0.28)',
    borderRadius: 10,
    padding: '12px 14px',
    marginBottom: 12,
    color: '#dc3545',
    fontSize: 14,
  } satisfies React.CSSProperties,

  fieldGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  } satisfies React.CSSProperties,

  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    fontFamily: 'Satoshi, sans-serif',
  } satisfies React.CSSProperties,

  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e0d9f7',
    borderRadius: 10,
    fontSize: 15,
    fontFamily: 'Satoshi, sans-serif',
    outline: 'none',
    background: '#fafafa',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
  } satisfies React.CSSProperties,

  fieldError: {
    color: '#dc3545',
    fontSize: 13,
    margin: 0,
  } satisfies React.CSSProperties,

  submitBtn: {
    width: '100%',
    border: 'none',
    color: '#fff',
    borderRadius: 14,
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'opacity 0.2s',
  } satisfies React.CSSProperties,
} as const

export default DeactiveAccount
