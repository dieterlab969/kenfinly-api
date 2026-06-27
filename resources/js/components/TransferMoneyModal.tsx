import React, { useState, useEffect, useCallback } from 'react'
import { X, ArrowLeftRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
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
  to_account: { id: number; name: string; balance: number }
}

interface TransferMoneyModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

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

  const amountNum      = parseFloat(amount) || 0
  const isInsufficient = fromBalance !== null && amountNum > 0 && amountNum > fromBalance
  const sameWallet     = fromAccountId !== '' && fromAccountId === toAccountId
  const canSubmit      =
    fromAccountId !== '' &&
    toAccountId   !== '' &&
    !sameWallet &&
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
      if (list.length >= 1) setFromAccountId(String(list[0].id))
      if (list.length >= 2) setToAccountId(String(list[1].id))
    } catch {
      setError(t('Failed to load wallets. Please close and try again.'))
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
      setError(t('Destination wallet must be different from the source wallet.'))
      return
    }
    if (amountNum <= 0) {
      setAmountError(t('Please enter a valid amount greater than zero.'))
      return
    }
    if (isInsufficient) {
      setAmountError(t('Amount exceeds available balance in source wallet.'))
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
          setError(data.message ?? t('Transfer failed. Please try again.'))
        }
      } else {
        setError(t('Network error. Please check your connection and try again.'))
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const currency = fromAccount?.currency ?? toAccount?.currency ?? 'VND'

  // ── Success screen ─────────────────────────────────────────────────────────

  if (successData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {t('Transfer Completed')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('Your funds have been moved successfully.')}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('From')}</span>
              <span className="font-medium text-gray-900">{successData.from_account.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('To')}</span>
              <span className="font-medium text-gray-900">{successData.to_account.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{t('Amount')}</span>
              <span className="font-bold text-blue-600">
                {successData.amount.toLocaleString('en-US')} {currency}
              </span>
            </div>
            <hr />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{successData.from_account.name} {t('new balance')}</span>
              <span className="font-medium text-red-600">
                {formatBalance(successData.from_account.balance, currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">{successData.to_account.name} {t('new balance')}</span>
              <span className="font-medium text-green-600">
                {formatBalance(successData.to_account.balance, currency)}
              </span>
            </div>
          </div>

          <p className="text-xs text-gray-400">{t('Closing automatically…')}</p>
        </div>
      </div>
    )
  }

  // ── Form screen ────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">
              {t('Transfer Money')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Global error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Fetching spinner */}
          {fetchingAccounts && (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}

          {!fetchingAccounts && accounts.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
              {t('No wallets found. Please create at least two wallets to transfer between.')}
            </div>
          )}

          {!fetchingAccounts && accounts.length === 1 && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded text-sm">
              {t('You need at least two wallets to make a transfer.')}
            </div>
          )}

          {!fetchingAccounts && accounts.length >= 2 && (
            <>
              {/* From Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('From Wallet')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={fromAccountId}
                  onChange={e => { setFromAccountId(e.target.value); setAmountError('') }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('Select wallet…')}</option>
                  {accounts.map(a => (
                    <option key={a.id} value={String(a.id)}>
                      {a.name} — {formatBalance(a.balance, a.currency)}
                    </option>
                  ))}
                </select>
                {fromAccount && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('Available')}: <span className="font-semibold text-gray-700">{formatBalance(fromAccount.balance, fromAccount.currency)}</span>
                  </p>
                )}
              </div>

              {/* Swap button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleSwap}
                  title={t('Swap wallets')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors font-medium"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {t('Swap')}
                </button>
              </div>

              {/* To Wallet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('To Wallet')} <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={e => { setToAccountId(e.target.value); setAmountError('') }}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    sameWallet ? 'border-red-400 bg-red-50' : 'border-gray-300'
                  }`}
                >
                  <option value="">{t('Select wallet…')}</option>
                  {accounts.map(a => (
                    <option
                      key={a.id}
                      value={String(a.id)}
                      disabled={String(a.id) === fromAccountId}
                    >
                      {a.name} — {formatBalance(a.balance, a.currency)}
                      {String(a.id) === fromAccountId ? ` ${t('(source)')}` : ''}
                    </option>
                  ))}
                </select>
                {sameWallet && (
                  <p className="mt-1 text-xs text-red-600">
                    {t('Destination wallet must be different from the source wallet.')}
                  </p>
                )}
                {toAccount && !sameWallet && (
                  <p className="mt-1 text-xs text-gray-500">
                    {t('Current balance')}: <span className="font-semibold text-gray-700">{formatBalance(toAccount.balance, toAccount.currency)}</span>
                  </p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Amount')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={e => { setAmount(e.target.value); setAmountError('') }}
                    className={`w-full px-4 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isInsufficient || amountError ? 'border-red-400 bg-red-50' : 'border-gray-300'
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 font-medium text-sm">{currency}</span>
                  </div>
                </div>

                {/* Insufficient balance warning */}
                {isInsufficient && !amountError && (
                  <div className="mt-2 flex items-start gap-1.5 text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">
                      {t('Insufficient balance in source wallet.')}
                      {fromAccount && (
                        <> {t('Available')}: <strong>{formatBalance(fromBalance ?? 0, currency)}</strong></>
                      )}
                    </span>
                  </div>
                )}

                {amountError && (
                  <p className="mt-1 text-xs text-red-600">{amountError}</p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('Note')}{' '}
                  <span className="text-gray-400 font-normal">({t('optional')})</span>
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value.slice(0, 200))}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder={t('e.g. Monthly savings transfer…')}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{notes.length}/200</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  {t('Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    canSubmit
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-300 cursor-not-allowed'
                  }`}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? t('Processing…') : t('Transfer')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default TransferMoneyModal
