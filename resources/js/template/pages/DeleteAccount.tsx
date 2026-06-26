import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import BackBtn from '../components/BackBtn.tsx'
import { useSecureLogout } from '../hooks/useSecureLogout'
import api from '../../utils/api'

// ─── Constants ────────────────────────────────────────────────────────────────

/** Exact phrase the user must type to unlock the Delete button. Case-sensitive. */
const REQUIRED_PHRASE = 'DELETE MY ACCOUNT'

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

const DeleteAccount: React.FC = () => {
  const { t }      = useTranslation()
  const { logout } = useSecureLogout()

  const [password,      setPassword]      = useState('')
  const [phrase,        setPhrase]        = useState('')
  const [phase,         setPhase]         = useState<Phase>('idle')
  const [passwordError, setPasswordError] = useState('')
  const [phraseError,   setPhraseError]   = useState('')
  const [globalError,   setGlobalError]   = useState('')

  const phraseMatches = phrase === REQUIRED_PHRASE
  const canSubmit     = password.length > 0 && phraseMatches && phase === 'idle'

  // Auto-logout 1.5 s after a successful API response.
  // skipApiCall: true because the backend already revoked the JWT.
  useEffect(() => {
    if (phase !== 'success') return
    const id = setTimeout(() => logout({ skipApiCall: true }), 1500)
    return () => clearTimeout(id)
  }, [phase, logout])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError('')
    setPhraseError('')
    setGlobalError('')

    if (!password) { setPasswordError(t('Please enter your password.')); return }
    if (!phraseMatches) { setPhraseError(t('Please type the exact phrase to confirm.')); return }

    setPhase('loading')

    try {
      await api.delete('/v1/user/account', {
        data: { password, confirmation: REQUIRED_PHRASE },
      })
      setPhase('success')
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        const { status, data } = err.response
        if (status === 422) {
          if (data.errors?.password) {
            setPasswordError(data.errors.password[0])
          } else if (data.errors?.confirmation) {
            setPhraseError(data.errors.confirmation[0])
          } else {
            setGlobalError(data.message)
          }
          setPhase('idle')
        } else {
          setGlobalError(t('An unexpected error occurred. Please try again later.'))
          console.error('[DeleteAccount] server error:', data)
          setPhase('idle')
        }
      } else {
        setGlobalError(t('Network error. Please check your connection and try again.'))
        console.error('[DeleteAccount] network error:', err)
        setPhase('idle')
      }
    }
  }

  const isLoading        = phase === 'loading'
  const remainingChars   = REQUIRED_PHRASE.length - phrase.length

  return (
    <>
      <style>{`@keyframes ks-spin { to { transform: rotate(360deg); } }`}</style>

      <div className="site-content">
        <div className="verify-number-main">

          {/* Header */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn"><BackBtn /></div>
                <div className="header-title"><p>{t('Delete Account')}</p></div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="verify-number-bottom" id="delete-account">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <div className="deactive-account-sec">

                  {/* Success banner */}
                  {phase === 'success' && (
                    <div style={s.successBanner}>
                      <span style={{ fontSize: 22, color: '#22c55e', fontWeight: 700 }}>✓</span>
                      <div>
                        <strong style={{ display: 'block' }}>{t('Deletion Scheduled')}</strong>
                        <span style={{ fontSize: 13 }}>
                          {t('Your account will be permanently deleted in 30 days. Logging you out…')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Global / network error */}
                  {globalError && (
                    <div style={s.errorBanner} role="alert">⚠&nbsp;{globalError}</div>
                  )}

                  {/* Danger warning box */}
                  <div style={s.dangerBox}>
                    <p style={s.dangerTitle}>🗑&nbsp;{t('Permanent Account Deletion')}</p>
                    <p style={{ fontSize: 13, margin: '6px 0 12px', color: '#7f1d1d' }}>
                      {t('This action is irreversible. After a 30-day grace period the following will happen permanently:')}
                    </p>
                    <ul style={s.consequenceList}>
                      <li style={s.consequenceItem}>
                        <span style={s.bulletDanger}>✕</span>
                        {t('Permanent loss of access to your Kenfinly account')}
                      </li>
                      <li style={s.consequenceItem}>
                        <span style={s.bulletDanger}>✕</span>
                        {t('All transactions, accounts, budgets, and financial history will be erased')}
                      </li>
                      <li style={s.consequenceItem}>
                        <span style={s.bulletDanger}>✕</span>
                        {t('Active paid subscriptions will be cancelled without refund')}
                      </li>
                      <li style={s.consequenceItem}>
                        <span style={s.bulletDanger}>✕</span>
                        {t('Your data cannot be recovered after the grace period ends')}
                      </li>
                      <li style={{ ...s.consequenceItem, color: '#166534' }}>
                        <span style={{ ...s.bulletDanger, color: '#22c55e' }}>✓</span>
                        {t('You may cancel by logging in again within 30 days')}
                      </li>
                    </ul>
                  </div>

                  {/* Confirmation form */}
                  <form onSubmit={handleSubmit} style={{ marginTop: 24 }} noValidate>

                    {/* Password field */}
                    <div style={s.fieldGroup}>
                      <label style={s.label} htmlFor="del-password">
                        {t('Confirm your password')}
                      </label>
                      <input
                        id="del-password"
                        type="password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setPasswordError('') }}
                        disabled={isLoading || phase === 'success'}
                        placeholder={t('Enter your current password')}
                        autoComplete="current-password"
                        style={{ ...s.input, borderColor: passwordError ? '#dc3545' : '#e0d9f7' }}
                      />
                      {passwordError && <p style={s.fieldError} role="alert">{passwordError}</p>}
                    </div>

                    {/* Phrase field */}
                    <div style={{ ...s.fieldGroup, marginTop: 16 }}>
                      <label style={s.label} htmlFor="del-phrase">
                        {t('Type')}&nbsp;
                        <code style={s.phraseCode}>{REQUIRED_PHRASE}</code>
                        &nbsp;{t('to confirm')}
                      </label>
                      <input
                        id="del-phrase"
                        type="text"
                        value={phrase}
                        onChange={e => { setPhrase(e.target.value); setPhraseError('') }}
                        disabled={isLoading || phase === 'success'}
                        placeholder={REQUIRED_PHRASE}
                        autoComplete="off"
                        spellCheck={false}
                        style={{
                          ...s.input,
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                          borderColor:
                            phrase.length > 0 && !phraseMatches
                              ? '#dc3545'
                              : phraseMatches
                              ? '#22c55e'
                              : '#e0d9f7',
                        }}
                      />
                      {phraseError && <p style={s.fieldError} role="alert">{phraseError}</p>}
                      {phrase.length > 0 && !phraseMatches && !phraseError && (
                        <p style={{ ...s.fieldError, color: '#9ca3af', fontSize: 12 }}>
                          {remainingChars > 0
                            ? `${remainingChars} ${t('characters remaining')}`
                            : t('Phrase does not match — check for extra spaces or typos.')}
                        </p>
                      )}
                    </div>

                    {/* Delete button */}
                    <div style={{ marginTop: 32 }}>
                      <button
                        type="submit"
                        disabled={!canSubmit || isLoading || phase === 'success'}
                        style={{
                          ...s.submitBtn,
                          background: canSubmit && !isLoading ? '#dc3545' : '#e5e7eb',
                          color:      canSubmit && !isLoading ? '#fff'     : '#9ca3af',
                          cursor:     canSubmit && !isLoading ? 'pointer'  : 'not-allowed',
                        }}
                      >
                        {isLoading && <Spinner />}
                        {isLoading
                          ? t('Processing…')
                          : phase === 'success'
                          ? t('Logging out…')
                          : t('Delete My Account')}
                      </button>
                      <p style={{ textAlign: 'center', marginTop: 10, fontSize: 12, color: '#9ca3af' }}>
                        {t('Button activates only when password is entered and phrase matches exactly.')}
                      </p>
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
  dangerBox: {
    background: 'rgba(220,53,69,0.07)',
    border: '1.5px solid rgba(220,53,69,0.35)',
    borderRadius: 12,
    padding: '18px 20px',
    marginTop: 16,
  } satisfies React.CSSProperties,
  dangerTitle: {
    color: '#dc3545',
    fontWeight: 800,
    fontSize: 16,
    margin: 0,
    fontFamily: 'Satoshi, sans-serif',
  } satisfies React.CSSProperties,
  consequenceList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  } satisfies React.CSSProperties,
  consequenceItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 13,
    lineHeight: 1.5,
    color: '#374151',
  } satisfies React.CSSProperties,
  bulletDanger: {
    color: '#dc3545',
    fontWeight: 700,
    flexShrink: 0,
    minWidth: 14,
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
  phraseCode: {
    background: 'rgba(220,53,69,0.10)',
    color: '#dc3545',
    borderRadius: 4,
    padding: '1px 5px',
    fontFamily: 'monospace',
    letterSpacing: 1,
    fontSize: 13,
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
    borderRadius: 14,
    padding: '14px 0',
    fontSize: 16,
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.2s, color 0.2s',
  } satisfies React.CSSProperties,
} as const

export default DeleteAccount
