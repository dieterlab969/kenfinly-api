import React, { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeftRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../utils/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
    id: number
    name: string
    balance: string | number
    currency: string
    icon?: string
    color?: string
}

interface TransferSuccessData {
    amount: number
    from_account: { id: number; name: string; balance: number }
    to_account:   { id: number; name: string; balance: number }
}

interface TransferMoneyModalProps {
    isOpen:    boolean
    onClose:   () => void
    onSuccess: () => void
}

// ─── Design tokens (mirrors EditTransactionModal's MS object) ─────────────────

const MS = {
    fieldWrap: { marginBottom: '16px' } as React.CSSProperties,
    fieldLabel: {
        fontSize: '13px', color: '#6b7280', display: 'block',
        marginBottom: '8px', fontWeight: 600,
    } as React.CSSProperties,
    inputBase: {
        width: '100%',
        border: '1.5px solid #e5e7eb',
        borderRadius: '14px',
        padding: '13px 16px',
        fontSize: '14px',
        color: '#121212',
        outline: 'none',
        background: '#fff',
        fontFamily: 'inherit',
        boxSizing: 'border-box' as const,
    } as React.CSSProperties,
} as const

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatBalance = (balance: string | number, currency: string): string => {
    const num = typeof balance === 'string' ? parseFloat(balance) : balance
    if (isNaN(num)) return `0 ${currency}`
    return `${num.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${currency}`
}

const isAxiosError = (
    err: unknown,
): err is { response: { status: number; data: { message?: string; errors?: Record<string, string[]> } } } =>
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response: unknown }).response === 'object'

// ─── Component ────────────────────────────────────────────────────────────────

const TransferMoneyModal: React.FC<TransferMoneyModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const { t } = useTranslation()
    const formRef = useRef<HTMLFormElement>(null)

    const [accounts,         setAccounts]         = useState<Account[]>([])
    const [fromAccountId,    setFromAccountId]    = useState<string>('')
    const [toAccountId,      setToAccountId]      = useState<string>('')
    const [amount,           setAmount]           = useState<string>('')
    const [notes,            setNotes]            = useState<string>('')
    const [loading,          setLoading]          = useState(false)
    const [fetchingAccounts, setFetchingAccounts] = useState(false)
    const [error,            setError]            = useState<string>('')
    const [amountError,      setAmountError]      = useState<string>('')
    const [successData,      setSuccessData]      = useState<TransferSuccessData | null>(null)

    const fromAccount = accounts.find(a => String(a.id) === fromAccountId) ?? null
    const toAccount   = accounts.find(a => String(a.id) === toAccountId)   ?? null

    const fromBalance = fromAccount
        ? (typeof fromAccount.balance === 'string' ? parseFloat(fromAccount.balance) : fromAccount.balance)
        : null

    // Only accounts that share the same currency as the selected source account
    const compatibleToAccounts = fromAccount
        ? accounts.filter(a => a.currency === fromAccount.currency && String(a.id) !== fromAccountId)
        : accounts.filter(a => String(a.id) !== fromAccountId)

    const differentCurrency =
        fromAccount !== null &&
        toAccount   !== null &&
        fromAccount.currency !== toAccount.currency

    const amountNum      = parseFloat(amount) || 0
    const isInsufficient = fromBalance !== null && amountNum > 0 && amountNum > fromBalance
    const sameWallet     = fromAccountId !== '' && fromAccountId === toAccountId
    const canSubmit      =
        fromAccountId !== '' &&
        toAccountId   !== '' &&
        !sameWallet &&
        !differentCurrency &&
        amountNum > 0 &&
        !isInsufficient &&
        !loading &&
        !successData

    // ── Fetch accounts ─────────────────────────────────────────────────────────

    const fetchAccounts = useCallback(async () => {
        setFetchingAccounts(true)
        try {
            const res = await api.get('/accounts')
            const list: Account[] = res.data.accounts ?? []
            setAccounts(list)
            if (list.length >= 1) {
                const first = list[0]
                setFromAccountId(String(first.id))
                // Pre-select the first compatible (same-currency) destination
                const compatible = list.filter(a => a.currency === first.currency && a.id !== first.id)
                if (compatible.length >= 1) setToAccountId(String(compatible[0].id))
            }
        } catch {
            setError(t('Failed to load wallets. Please close and try again.') as string)
        } finally {
            setFetchingAccounts(false)
        }
    }, [t])

    // Reset and fetch on open
    useEffect(() => {
        if (!isOpen) return
        setFromAccountId('')
        setToAccountId('')
        setAmount('')
        setNotes('')
        setError('')
        setAmountError('')
        setSuccessData(null)
        fetchAccounts()
    }, [isOpen, fetchAccounts])

    // When "from" wallet changes, clear "to" if it no longer has the same currency
    useEffect(() => {
        if (!fromAccount || !toAccount) return
        if (fromAccount.currency !== toAccount.currency) {
            setToAccountId('')
            setAmountError('')
        }
    }, [fromAccountId]) // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-close after success
    useEffect(() => {
        if (!successData) return
        const id = setTimeout(() => {
            onSuccess()
            onClose()
        }, 2200)
        return () => clearTimeout(id)
    }, [successData, onSuccess, onClose])

    // ── Swap handler ───────────────────────────────────────────────────────────

    const handleSwap = () => {
        setFromAccountId(toAccountId)
        setToAccountId(fromAccountId)
        setAmountError('')
    }

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError('')
        setAmountError('')

        if (sameWallet) {
            setError(t('Destination wallet must be different from the source wallet.') as string)
            return
        }
        if (differentCurrency) {
            setError(t('Both wallets must use the same currency.') as string)
            return
        }
        if (amountNum <= 0) {
            setAmountError(t('Please enter a valid amount greater than zero.') as string)
            return
        }
        if (isInsufficient) {
            setAmountError(t('Amount exceeds available balance in source wallet.') as string)
            return
        }

        setLoading(true)
        try {
            const res = await api.post('/v1/accounts/transfer', {
                from_account_id: parseInt(fromAccountId, 10),
                to_account_id:   parseInt(toAccountId,   10),
                amount:          amountNum,
                notes:           notes || undefined,
            })
            setSuccessData(res.data.data as TransferSuccessData)
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                const { data } = err.response
                if (data.errors?.amount) {
                    setAmountError(data.errors.amount[0])
                } else {
                    setError(data.message ?? (t('Transfer failed. Please try again.') as string))
                }
            } else {
                setError(t('Network error. Please check your connection and try again.') as string)
            }
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setError('')
        setAmountError('')
        onClose()
    }

    if (!isOpen) return null

    const currency = fromAccount?.currency ?? toAccount?.currency ?? 'VND'

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
            onClick={e => { if (e.currentTarget === e.target) handleClose() }}
        >
            <div style={{
                background: '#fff', borderRadius: '24px 24px 0 0',
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.25)',
            }}>

                {/* ── Sticky header ─────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px 14px', borderBottom: '1px solid #f1f5f9',
                    position: 'sticky', top: 0, background: '#fff', zIndex: 1,
                }}>
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        style={{
                            background: 'none', border: 'none', color: '#6b7280',
                            fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                            padding: '4px 8px', opacity: loading ? 0.5 : 1,
                        }}
                    >
                        {t('Cancel') as string}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>
                            {t('CHUYỂN TIỀN') as string}
                        </p>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#3b82f6', letterSpacing: '0.5px' }}>
                            {t('Transfer Money') as string}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => formRef.current?.requestSubmit()}
                        disabled={!canSubmit}
                        style={{
                            background: canSubmit ? '#3b82f6' : '#93c5fd',
                            border: 'none', color: '#fff',
                            padding: '8px 18px', borderRadius: '20px',
                            fontSize: '14px', fontWeight: 700,
                            cursor: canSubmit ? 'pointer' : 'not-allowed',
                            transition: 'background 0.2s',
                            display: 'flex', alignItems: 'center', gap: '6px',
                        }}
                    >
                        {loading && <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 0.9s linear infinite' }} />}
                        {loading ? (t('Processing…') as string) : (t('Transfer') as string)}
                    </button>
                </div>

                {/* ── Summary strip ─────────────────────────────────────────── */}
                {(fromAccount || toAccount) && !successData && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
                    }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                            background: '#dbeafe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <ArrowLeftRight style={{ width: '18px', height: '18px', color: '#3b82f6' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                                {fromAccount?.name ?? '—'} → {toAccount?.name ?? '—'}
                            </p>
                            {amountNum > 0 && (
                                <p style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6' }}>
                                    {amountNum.toLocaleString('en-US')} {currency}
                                </p>
                            )}
                        </div>
                        {sameWallet && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: '20px', padding: '4px 10px',
                            }}>
                                <AlertCircle style={{ width: '11px', height: '11px', color: '#ef4444' }} />
                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                    {t('Same wallet') as string}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Success screen ─────────────────────────────────────────── */}
                {successData && (
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: '#dcfce7', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 16px',
                        }}>
                            <CheckCircle style={{ width: '36px', height: '36px', color: '#22c55e' }} />
                        </div>
                        <p style={{ fontSize: '18px', fontWeight: 800, color: '#121212', marginBottom: '6px' }}>
                            {t('Transfer Completed') as string}
                        </p>
                        <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '24px' }}>
                            {t('Your funds have been moved successfully.') as string}
                        </p>

                        <div style={{
                            background: '#f8fafc', borderRadius: '14px', padding: '16px',
                            textAlign: 'left', marginBottom: '20px',
                            border: '1px solid #f1f5f9',
                        }}>
                            {[
                                { label: t('From') as string,           val: successData.from_account.name, color: '#121212' },
                                { label: t('To') as string,             val: successData.to_account.name,   color: '#121212' },
                                { label: t('Amount') as string,         val: `${successData.amount.toLocaleString('en-US')} ${currency}`, color: '#3b82f6' },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>{val}</span>
                                </div>
                            ))}
                            <div style={{ height: '1px', background: '#e5e7eb', margin: '10px 0' }} />
                            {[
                                { label: `${successData.from_account.name} ${t('new balance') as string}`, val: formatBalance(successData.from_account.balance, currency), color: '#ef4444' },
                                { label: `${successData.to_account.name} ${t('new balance') as string}`,   val: formatBalance(successData.to_account.balance, currency),   color: '#22c55e' },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{label}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color }}>{val}</span>
                                </div>
                            ))}
                        </div>

                        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{t('Closing automatically…') as string}</p>
                    </div>
                )}

                {/* ── Form ──────────────────────────────────────────────────── */}
                {!successData && (
                    <form ref={formRef} onSubmit={handleSubmit} style={{ padding: '20px' }}>

                        {/* Global error */}
                        {error && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                background: '#fef2f2', border: '1px solid #fecaca',
                                borderRadius: '12px', padding: '10px 12px',
                                fontSize: '13px', color: '#b91c1c', fontWeight: 600,
                                marginBottom: '16px',
                            }}>
                                <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0, marginTop: '1px' }} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Fetching spinner */}
                        {fetchingAccounts && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                                <div style={{
                                    width: '36px', height: '36px',
                                    border: '4px solid #dbeafe', borderTopColor: '#3b82f6',
                                    borderRadius: '50%', animation: 'spin 0.9s linear infinite',
                                }} />
                                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            </div>
                        )}

                        {/* Not enough wallets */}
                        {!fetchingAccounts && accounts.length < 2 && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: '12px', padding: '10px 12px',
                                fontSize: '13px', color: '#92400e', fontWeight: 500,
                                marginBottom: '16px',
                            }}>
                                <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0, marginTop: '1px' }} />
                                <span>
                                    {accounts.length === 0
                                        ? (t('No wallets found. Please create at least two wallets to transfer between.') as string)
                                        : (t('You need at least two wallets to make a transfer.') as string)}
                                </span>
                            </div>
                        )}

                        {/* No compatible (same-currency) destination wallets */}
                        {!fetchingAccounts && accounts.length >= 2 && fromAccount && compatibleToAccounts.length === 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'flex-start', gap: '8px',
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: '12px', padding: '10px 12px',
                                fontSize: '13px', color: '#92400e', fontWeight: 500,
                                marginBottom: '16px',
                            }}>
                                <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0, marginTop: '1px' }} />
                                <span>
                                    {t('No other wallet with the same currency ({{currency}}) found. Transfers are only allowed between wallets with the same currency.', { currency: fromAccount.currency }) as string}
                                </span>
                            </div>
                        )}

                        {!fetchingAccounts && accounts.length >= 2 && (
                            <>
                                {/* From Wallet */}
                                <div style={MS.fieldWrap}>
                                    <label style={MS.fieldLabel}>
                                        {t('From Wallet') as string} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            required
                                            value={fromAccountId}
                                            onChange={e => { setFromAccountId(e.target.value); setAmountError('') }}
                                            style={{ ...MS.inputBase, appearance: 'none', paddingRight: '36px' }}
                                        >
                                            <option value="">{t('Select wallet…') as string}</option>
                                            {accounts.map(a => (
                                                <option key={a.id} value={String(a.id)}>
                                                    {a.name} — {formatBalance(a.balance, a.currency)}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{
                                            position: 'absolute', right: '14px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                                        }}>▾</span>
                                    </div>
                                    {fromAccount && (
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                            {t('Available') as string}:{' '}
                                            <span style={{ fontWeight: 700, color: '#374151' }}>
                                                {formatBalance(fromAccount.balance, fromAccount.currency)}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Swap button */}
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                                    <button
                                        type="button"
                                        onClick={handleSwap}
                                        title={t('Swap wallets') as string}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            background: '#eff6ff', border: '1.5px solid #bfdbfe',
                                            borderRadius: '20px', padding: '8px 16px',
                                            fontSize: '13px', fontWeight: 600, color: '#3b82f6',
                                            cursor: 'pointer', transition: 'background 0.15s',
                                        }}
                                    >
                                        <ArrowLeftRight style={{ width: '14px', height: '14px' }} />
                                        {t('Swap') as string}
                                    </button>
                                </div>

                                {/* To Wallet */}
                                <div style={MS.fieldWrap}>
                                    <label style={MS.fieldLabel}>
                                        {t('To Wallet') as string} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <select
                                            required
                                            value={toAccountId}
                                            onChange={e => { setToAccountId(e.target.value); setAmountError('') }}
                                            disabled={compatibleToAccounts.length === 0}
                                            style={{
                                                ...MS.inputBase, appearance: 'none', paddingRight: '36px',
                                                borderColor: sameWallet ? '#fca5a5' : '#e5e7eb',
                                                background: compatibleToAccounts.length === 0 ? '#f9fafb' : sameWallet ? '#fef2f2' : '#fff',
                                                color: compatibleToAccounts.length === 0 ? '#9ca3af' : '#121212',
                                                cursor: compatibleToAccounts.length === 0 ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <option value="">
                                                {compatibleToAccounts.length === 0
                                                    ? t('No compatible wallet available') as string
                                                    : t('Select wallet…') as string}
                                            </option>
                                            {compatibleToAccounts.map(a => (
                                                <option key={a.id} value={String(a.id)}>
                                                    {a.name} — {formatBalance(a.balance, a.currency)}
                                                </option>
                                            ))}
                                        </select>
                                        <span style={{
                                            position: 'absolute', right: '14px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                                        }}>▾</span>
                                    </div>
                                    {sameWallet && (
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                                            {t('Destination wallet must be different from the source wallet.') as string}
                                        </p>
                                    )}
                                    {toAccount && !sameWallet && !differentCurrency && (
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                            {t('Current balance') as string}:{' '}
                                            <span style={{ fontWeight: 700, color: '#374151' }}>
                                                {formatBalance(toAccount.balance, toAccount.currency)}
                                            </span>
                                        </p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div style={MS.fieldWrap}>
                                    <label style={MS.fieldLabel}>
                                        {t('Amount') as string} <span style={{ color: '#ef4444' }}>*</span>
                                    </label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            required
                                            value={amount}
                                            onChange={e => { setAmount(e.target.value); setAmountError('') }}
                                            placeholder="0"
                                            style={{
                                                ...MS.inputBase,
                                                paddingRight: '56px',
                                                borderColor: isInsufficient || amountError ? '#fca5a5' : '#e5e7eb',
                                                background:  isInsufficient || amountError ? '#fef2f2' : '#fff',
                                            }}
                                        />
                                        <span style={{
                                            position: 'absolute', right: '14px', top: '50%',
                                            transform: 'translateY(-50%)',
                                            pointerEvents: 'none', fontSize: '13px',
                                            fontWeight: 600, color: '#9ca3af',
                                        }}>{currency}</span>
                                    </div>

                                    {isInsufficient && !amountError && (
                                        <div style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '6px',
                                            background: '#fffbeb', border: '1px solid #fde68a',
                                            borderRadius: '10px', padding: '8px 10px',
                                            marginTop: '8px',
                                        }}>
                                            <AlertCircle style={{ width: '13px', height: '13px', color: '#d97706', flexShrink: 0, marginTop: '1px' }} />
                                            <span style={{ fontSize: '12px', color: '#92400e' }}>
                                                {t('Insufficient balance in source wallet.') as string}
                                                {fromAccount && (
                                                    <> {t('Available') as string}: <strong>{formatBalance(fromBalance ?? 0, currency)}</strong></>
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {amountError && (
                                        <p style={{ marginTop: '6px', fontSize: '12px', color: '#ef4444', fontWeight: 600 }}>
                                            {amountError}
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div style={MS.fieldWrap}>
                                    <label style={MS.fieldLabel}>
                                        {t('Note') as string}{' '}
                                        <span style={{ color: '#9ca3af', fontWeight: 400 }}>({t('optional') as string})</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value.slice(0, 200))}
                                        rows={3}
                                        placeholder={t('e.g. Monthly savings transfer…') as string}
                                        style={{ ...MS.inputBase, resize: 'none', lineHeight: '1.5' }}
                                    />
                                    <p style={{ textAlign: 'right', fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                                        {notes.length}/200
                                    </p>
                                </div>
                            </>
                        )}

                        {/* Hidden submit — triggered by header Transfer button */}
                        <button type="submit" style={{ display: 'none' }} aria-hidden />
                    </form>
                )}

                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </div>
    )
}

export default TransferMoneyModal
