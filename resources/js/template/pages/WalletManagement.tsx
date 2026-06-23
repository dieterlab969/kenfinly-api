import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import BackBtn from '../components/BackBtn';
import SearchIcon from '../assets/svg/search-icon.svg';
import faqPlus from '../assets/svg/faq-plus.svg';
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg';
import api from '../../utils/api';
import { formatCurrency } from '../../constants/categories';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type AccountType = 'wallet' | 'bank' | 'savings' | 'credit_card' | 'investment';

interface Account {
  id: number;
  name: string;
  balance: string | number;
  currency: string;
  icon: string | null;
  color: string | null;
  bank_name: string | null;
  account_type: AccountType | string;
  transactions_count?: number;
}

interface AccountForm {
  name: string;
  balance: string;
  currency: string;
  icon: string;
  color: string;
  bank_name: string;
  account_type: AccountType;
}

interface ApiValidationErrors {
  [field: string]: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string; color: string }[] = [
  { value: 'wallet',      label: 'Wallet',       color: '#00A266' },
  { value: 'bank',        label: 'Bank',          color: '#6C3DE6' },
  { value: 'savings',     label: 'Savings',       color: '#F59E0B' },
  { value: 'credit_card', label: 'Credit Card',   color: '#EF4444' },
  { value: 'investment',  label: 'Investment',    color: '#3B82F6' },
];

const CURRENCIES = ['VND', 'USD', 'EUR', 'JPY', 'GBP'];

const ICON_PRESETS = ['💰', '🏦', '💳', '🏧', '📈', '🪙', '💵', '🏠'];

const COLOR_PRESETS = [
  '#00A266', '#6C3DE6', '#EF4444', '#F59E0B',
  '#3B82F6', '#EC4899', '#06B6D4', '#84CC16',
];

const SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'name_asc',     label: 'Name A → Z' },
  { value: 'name_desc',    label: 'Name Z → A' },
  { value: 'balance_desc', label: 'Balance: High → Low' },
  { value: 'balance_asc',  label: 'Balance: Low → High' },
  { value: 'txn_desc',     label: 'Most Transactions' },
];

const EMPTY_FORM: AccountForm = {
  name: '',
  balance: '',
  currency: 'VND',
  icon: '💰',
  color: '#00A266',
  bank_name: '',
  account_type: 'wallet',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNumber(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getTypeConfig(type: string): { label: string; color: string } {
  return ACCOUNT_TYPES.find((t) => t.value === type) ?? { label: type, color: '#888' };
}

function sortAccounts(list: Account[], key: string): Account[] {
  const arr = [...list];
  switch (key) {
    case 'name_asc':     return arr.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc':    return arr.sort((a, b) => b.name.localeCompare(a.name));
    case 'balance_desc': return arr.sort((a, b) => toNumber(b.balance) - toNumber(a.balance));
    case 'balance_asc':  return arr.sort((a, b) => toNumber(a.balance) - toNumber(b.balance));
    case 'txn_desc':     return arr.sort((a, b) => (b.transactions_count ?? 0) - (a.transactions_count ?? 0));
    default:             return arr;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const WalletManagement: React.FC = () => {
  // ── Data state ──
  const [accounts, setAccounts]     = useState<Account[]>([]);
  const [loading, setLoading]       = useState(true);
  const [errorMsg, setErrorMsg]     = useState('');

  // ── UI state ──
  const [search, setSearch]         = useState('');
  const [sortKey, setSortKey]       = useState('name_asc');

  // ── Form / modal state ──
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm]             = useState<AccountForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ApiValidationErrors>({});
  const [formGenError, setFormGenError] = useState('');
  const [saving, setSaving]         = useState(false);

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<Account | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Bootstrap modal refs ──
  const accountModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef  = useRef<HTMLDivElement>(null);
  const bsAccountModal  = useRef<any>(null);
  const bsDeleteModal   = useRef<any>(null);

  // ── Bootstrap modal init ──
  useEffect(() => {
    // @ts-ignore
    const Modal = window?.bootstrap?.Modal;
    if (!Modal) return;
    if (accountModalRef.current) bsAccountModal.current = new Modal(accountModalRef.current, { backdrop: 'static' });
    if (deleteModalRef.current)  bsDeleteModal.current  = new Modal(deleteModalRef.current,  { backdrop: 'static' });
  }, []);

  // ── Fetch accounts ──
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/accounts');
      setAccounts(res.data.accounts ?? []);
    } catch {
      setErrorMsg('Unable to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  // ── Filtered + sorted list ──
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? accounts.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.bank_name ?? '').toLowerCase().includes(q) ||
            (a.account_type ?? '').toLowerCase().includes(q),
        )
      : accounts;
    return sortAccounts(filtered, sortKey);
  }, [accounts, search, sortKey]);

  // ── Total balance per currency ──
  const totals = useMemo(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) {
      const cur = acc.currency || 'VND';
      map[cur] = (map[cur] ?? 0) + toNumber(acc.balance);
    }
    return Object.entries(map);
  }, [accounts]);

  // ── Open add modal ──
  const openAdd = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormGenError('');
    bsAccountModal.current?.show();
  };

  // ── Open edit modal ──
  const openEdit = (acc: Account) => {
    setEditingAccount(acc);
    setForm({
      name:         acc.name,
      balance:      String(acc.balance),
      currency:     acc.currency,
      icon:         acc.icon ?? '💰',
      color:        acc.color ?? '#00A266',
      bank_name:    acc.bank_name ?? '',
      account_type: (acc.account_type ?? 'wallet') as AccountType,
    });
    setFormErrors({});
    setFormGenError('');
    bsAccountModal.current?.show();
  };

  // ── Open delete confirm ──
  const openDelete = (acc: Account) => {
    setDeleteTarget(acc);
    setDeleteError('');
    bsDeleteModal.current?.show();
  };

  // ── Form field helper ──
  const setField = <K extends keyof AccountForm>(key: K, value: AccountForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Submit add/edit ──
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      const payload = { ...form, balance: parseFloat(form.balance) || 0 };
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
      } else {
        await api.post('/accounts', payload);
      }
      bsAccountModal.current?.hide();
      await fetchAccounts();
    } catch (err: any) {
      const apiErrors: ApiValidationErrors = err?.response?.data?.errors ?? {};
      if (Object.keys(apiErrors).length > 0) {
        setFormErrors(apiErrors);
      } else {
        setFormGenError(err?.response?.data?.message ?? 'Something went wrong. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Confirm delete ──
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/accounts/${deleteTarget.id}`);
      bsDeleteModal.current?.hide();
      await fetchAccounts();
    } catch (err: any) {
      setDeleteError(err?.response?.data?.message ?? 'Could not delete this account.');
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main">

          {/* ── TOP BAR ── */}
          <div className="verify-number-top">
            <div className="container">

              {/* Header row */}
              <div className="verify-number-top-content">
                <div className="back-btn">
                  <BackBtn />
                </div>
                <div className="header-title">
                  <p>Wallets &amp; Accounts</p>
                </div>
              </div>

              {/* Search bar — follows AllContact.tsx pattern */}
              <div className="contact-search">
                <div className="input-group contact-searchbar">
                  <div className="search-icon">
                    <img src={SearchIcon} alt="search-icon" />
                  </div>
                  <div className="seach-bar" style={{ flex: 1 }}>
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, bank or type…"
                      className="form-control search-text"
                    />
                  </div>
                  {/* Sort dropdown — Bootstrap dropdown, no extra CSS needed */}
                  <div className="dropdown">
                    <button
                      className="btn btn-sm btn-link p-0 dropdown-toggle"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      style={{ color: 'rgba(255,255,255,0.64)', fontSize: 12 }}
                    >
                      Sort
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      {SORT_OPTIONS.map((opt) => (
                        <li key={opt.value}>
                          <button
                            className={`dropdown-item${sortKey === opt.value ? ' active' : ''}`}
                            onClick={() => setSortKey(opt.value)}
                          >
                            {opt.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* ── BOTTOM CONTENT ── */}
          <div className="verify-number-bottom" id="wallet-management-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Wallets &amp; Accounts</h1>

                {/* ── Loading state ── */}
                {loading && (
                  <div className="text-center py-5">
                    <div
                      className="spinner-border"
                      role="status"
                      style={{ color: 'var(--primary-color, #6C3DE6)', width: 40, height: 40 }}
                    >
                      <span className="visually-hidden">Loading…</span>
                    </div>
                    <p style={{ color: 'var(--sub-text-color)', marginTop: 12, fontSize: 14 }}>
                      Loading accounts…
                    </p>
                  </div>
                )}

                {/* ── Error state ── */}
                {!loading && errorMsg && (
                  <div className="text-center py-5">
                    <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 12 }}>{errorMsg}</p>
                    <button
                      className="verify-number-btn"
                      onClick={fetchAccounts}
                      style={{ display: 'inline-block' }}
                    >
                      <a href="#" onClick={(e) => { e.preventDefault(); fetchAccounts(); }}>
                        Try Again
                      </a>
                    </button>
                  </div>
                )}

                {/* ── Total balance summary ── */}
                {!loading && !errorMsg && accounts.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p
                      style={{
                        color: 'var(--sub-text-color)',
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.8px',
                        marginBottom: 4,
                      }}
                    >
                      Total Balance
                    </p>
                    {totals.map(([cur, amt]) => (
                      <p
                        key={cur}
                        className="pay-txt1"
                        style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}
                      >
                        {formatCurrency(amt, cur)}
                      </p>
                    ))}
                    <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 0 }}>
                      {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* ── Empty state — no accounts ── */}
                {!loading && !errorMsg && accounts.length === 0 && (
                  <div className="text-center py-5">
                    <p style={{ fontSize: 40, marginBottom: 8 }}>💰</p>
                    <p
                      style={{
                        color: 'var(--text-color)',
                        fontSize: 16,
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                    >
                      No accounts yet
                    </p>
                    <p style={{ color: 'var(--sub-text-color)', fontSize: 14, marginBottom: 20 }}>
                      Add your first wallet or bank account to get started.
                    </p>
                  </div>
                )}

                {/* ── Empty state — search has no results ── */}
                {!loading && !errorMsg && accounts.length > 0 && displayed.length === 0 && (
                  <div className="text-center py-4">
                    <p style={{ color: 'var(--sub-text-color)', fontSize: 14 }}>
                      No accounts match &ldquo;{search}&rdquo;.{' '}
                      <button
                        className="btn btn-link p-0"
                        style={{ fontSize: 14 }}
                        onClick={() => setSearch('')}
                      >
                        Clear search
                      </button>
                    </p>
                  </div>
                )}

                {/* ── Account cards — follows BankAndCard.tsx transfer-first pattern ── */}
                {!loading && !errorMsg && displayed.length > 0 && (
                  <div className="transfer-to-bank">
                    {displayed.map((acc) => {
                      const balNum   = toNumber(acc.balance);
                      const isNeg    = balNum < 0;
                      const typeConf = getTypeConfig(acc.account_type);

                      return (
                        <div key={acc.id} className="transfer-first">

                          {/* Icon / emoji */}
                          <div
                            className="bank-img"
                            style={{
                              background: acc.color ? `${acc.color}22` : 'rgba(108,61,230,0.13)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 26,
                              flexShrink: 0,
                            }}
                          >
                            {acc.icon || '💰'}
                          </div>

                          {/* Name + bank + type */}
                          <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
                            <h2 style={{ marginBottom: 2 }}>{acc.name}</h2>
                            <div className="bank-card">
                              <span
                                style={{
                                  color: typeConf.color,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: `${typeConf.color}22`,
                                  padding: '1px 7px',
                                  borderRadius: 20,
                                  marginRight: 6,
                                }}
                              >
                                {typeConf.label}
                              </span>
                              {acc.bank_name && (
                                <span style={{ fontSize: 13 }}>
                                  {acc.bank_name}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Balance + actions */}
                          <div
                            className="bank-active-sec"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              gap: 8,
                              marginLeft: 'auto',
                              flexShrink: 0,
                            }}
                          >
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 700,
                                fontSize: 14,
                                color: isNeg ? '#EF4444' : 'var(--7, #00A266)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {formatCurrency(balNum, acc.currency)}
                            </p>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <button
                                className="btn btn-link p-0"
                                onClick={() => openEdit(acc)}
                                title="Edit account"
                                style={{ lineHeight: 1 }}
                              >
                                <img src={purpleEditIcon} alt="edit" style={{ width: 18, height: 18 }} />
                              </button>
                              <button
                                className="btn btn-link p-0"
                                onClick={() => openDelete(acc)}
                                title="Delete account"
                                style={{ lineHeight: 1 }}
                              >
                                <span style={{ color: '#EF4444', fontSize: 16, lineHeight: 1 }}>✕</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ── Add account CTA ── */}
                {!loading && !errorMsg && (
                  <div className="verify-number-btn" id="bank-and-card-main" style={{ marginTop: 24 }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); openAdd(); }}>
                      <span>
                        <img src={faqPlus} alt="plus-icon" />
                      </span>
                      Add a New Account
                    </a>
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          ADD / EDIT MODAL — Bootstrap modal
      ════════════════════════════════════════════════ */}
      <div
        className="modal fade"
        id="accountModal"
        tabIndex={-1}
        aria-labelledby="accountModalLabel"
        aria-hidden="true"
        ref={accountModalRef}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content" style={{ background: 'var(--bg-color)', border: '1px solid var(--sub-bg-color)' }}>
            <div className="modal-header" style={{ borderColor: 'var(--sub-bg-color)' }}>
              <h5
                className="modal-title"
                id="accountModalLabel"
                style={{ color: 'var(--text-color)', fontWeight: 700, fontFamily: 'Satoshi' }}
              >
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                style={{ filter: 'var(--icon-filter)' }}
              />
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">

                {/* General error */}
                {formGenError && (
                  <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                    {formGenError}
                  </div>
                )}

                {/* Account name */}
                <div className="personal-name mt-0 mb-3">
                  <label htmlFor="acc-name" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                    Account Name *
                  </label>
                  <input
                    id="acc-name"
                    type="text"
                    className={`px-0${formErrors.name ? ' is-invalid' : ''}`}
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="e.g. Cash Wallet"
                    required
                    maxLength={255}
                  />
                  {formErrors.name && (
                    <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                      {formErrors.name[0]}
                    </div>
                  )}
                </div>

                {/* Bank name */}
                <div className="personal-name mb-3">
                  <label htmlFor="acc-bank" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                    Bank Name <span style={{ fontWeight: 400 }}>(optional)</span>
                  </label>
                  <input
                    id="acc-bank"
                    type="text"
                    className="px-0"
                    value={form.bank_name}
                    onChange={(e) => setField('bank_name', e.target.value)}
                    placeholder="e.g. Vietcombank"
                    maxLength={100}
                  />
                </div>

                {/* Account type */}
                <div className="mb-3">
                  <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>
                    Account Type
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {ACCOUNT_TYPES.map((t) => {
                      const active = form.account_type === t.value;
                      return (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => setField('account_type', t.value)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: 20,
                            border: `1px solid ${active ? t.color : 'var(--sub-bg-color)'}`,
                            background: active ? `${t.color}22` : 'transparent',
                            color: active ? t.color : 'var(--sub-text-color)',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Balance + Currency */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <div className="personal-name mb-3" style={{ flex: 2 }}>
                    <label htmlFor="acc-balance" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                      Balance *
                    </label>
                    <input
                      id="acc-balance"
                      type="number"
                      step="0.01"
                      className={`px-0${formErrors.balance ? ' is-invalid' : ''}`}
                      value={form.balance}
                      onChange={(e) => setField('balance', e.target.value)}
                      placeholder="0"
                      required
                    />
                    {formErrors.balance && (
                      <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                        {formErrors.balance[0]}
                      </div>
                    )}
                  </div>
                  <div className="personal-name mb-3" style={{ flex: 1 }}>
                    <label htmlFor="acc-currency" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                      Currency
                    </label>
                    <select
                      id="acc-currency"
                      className="px-0"
                      value={form.currency}
                      onChange={(e) => setField('currency', e.target.value)}
                      style={{
                        background: 'var(--sub-bg-color)',
                        color: 'var(--text-color)',
                        border: 0,
                        borderBottom: '2px solid var(--sub-bg-color)',
                        width: '100%',
                        fontSize: 14,
                        paddingBottom: 4,
                      }}
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Icon picker */}
                <div className="mb-3">
                  <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>
                    Icon
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {ICON_PRESETS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setField('icon', ic)}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          border: `1px solid ${form.icon === ic ? 'var(--primary-color, #6C3DE6)' : 'var(--sub-bg-color)'}`,
                          background: form.icon === ic ? 'rgba(108,61,230,0.12)' : 'var(--sub-bg-color)',
                          fontSize: 20,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        aria-label={ic}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color picker */}
                <div className="mb-1">
                  <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>
                    Color
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setField('color', c)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: c,
                          border: 'none',
                          cursor: 'pointer',
                          outline: form.color === c ? `3px solid ${c}` : 'none',
                          outlineOffset: 2,
                          transform: form.color === c ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.12s',
                        }}
                        aria-label={c}
                      />
                    ))}
                  </div>
                </div>

              </div>

              <div className="modal-footer" style={{ borderColor: 'var(--sub-bg-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  data-bs-dismiss="modal"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm"
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, #6C3DE6, #8B5CF6)',
                    color: '#fff',
                    fontWeight: 600,
                    minWidth: 110,
                  }}
                >
                  {saving
                    ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                        Saving…
                      </>
                    )
                    : editingAccount ? 'Save Changes' : 'Create Account'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          DELETE CONFIRM MODAL
      ════════════════════════════════════════════════ */}
      <div
        className="modal fade"
        id="deleteModal"
        tabIndex={-1}
        aria-labelledby="deleteModalLabel"
        aria-hidden="true"
        ref={deleteModalRef}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content" style={{ background: 'var(--bg-color)', border: '1px solid var(--sub-bg-color)' }}>
            <div className="modal-header" style={{ borderColor: 'var(--sub-bg-color)' }}>
              <h5
                className="modal-title"
                id="deleteModalLabel"
                style={{ color: '#EF4444', fontWeight: 700, fontFamily: 'Satoshi' }}
              >
                Delete Account
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                style={{ filter: 'var(--icon-filter)' }}
              />
            </div>
            <div className="modal-body">
              {deleteError && (
                <div className="alert alert-danger py-2 px-3 mb-3" style={{ fontSize: 13 }}>
                  {deleteError}
                </div>
              )}
              <p style={{ color: 'var(--text-color)', fontSize: 14, lineHeight: 1.6, marginBottom: 0 }}>
                Are you sure you want to delete{' '}
                <strong>{deleteTarget?.name}</strong>? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer" style={{ borderColor: 'var(--sub-bg-color)' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                data-bs-dismiss="modal"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDelete}
                disabled={deleting}
                style={{ minWidth: 100 }}
              >
                {deleting
                  ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                      Deleting…
                    </>
                  )
                  : 'Delete Account'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WalletManagement;
