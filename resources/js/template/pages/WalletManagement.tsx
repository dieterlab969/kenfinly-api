import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import BackBtn from '../components/BackBtn';
import BackBtnIcon from '../assets/svg/backBtn.svg';
import SearchIcon from '../assets/svg/search-icon.svg';
import faqPlus from '../assets/svg/faq-plus.svg';
import purpleEditIcon from '../assets/svg/purple-edit-icon.svg';
import api from '../../utils/api';
import { formatCurrency } from '../../constants/categories';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type AccountType = 'wallet' | 'bank' | 'savings' | 'credit_card' | 'investment';

/** Full account shape returned by GET /accounts */
interface Account {
  id: number;
  name: string;
  balance: string | number;
  currency: string;
  icon: string | null;
  color: string | null;
  /** Kept optional — present on existing records, not editable via form (YAGNI) */
  bank_name?: string | null;
  /** Kept optional — used for display badges and search only (YAGNI) */
  account_type?: AccountType | string;
  transactions_count?: number;
}

/** Minimal form shape — no bank_name / account_type (backend ignores them) */
interface AccountForm {
  name: string;
  balance: string;
  currency: string;
  icon: string;
  color: string;
}

interface ApiValidationErrors {
  [field: string]: string[];
}

interface PageMessage {
  type: 'success' | 'error';
  text: string;
}

type PageView = 'list' | 'add' | 'edit';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const ACCOUNT_TYPES: { value: AccountType; label: string; color: string }[] = [
  { value: 'wallet',      label: 'Wallet',      color: '#00A266' },
  { value: 'bank',        label: 'Bank',         color: '#6C3DE6' },
  { value: 'savings',     label: 'Savings',      color: '#F59E0B' },
  { value: 'credit_card', label: 'Credit Card',  color: '#EF4444' },
  { value: 'investment',  label: 'Investment',   color: '#3B82F6' },
];

const CURRENCIES: string[] = ['VND', 'USD', 'EUR', 'JPY', 'GBP', 'KRW', 'SGD', 'AUD'];

const ICON_PRESETS: string[] = ['💰', '🏦', '💳', '🏧', '📈', '🪙', '💵', '🏠', '🎯', '🚀'];

const COLOR_PRESETS: string[] = [
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
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function toNumber(v: string | number | null | undefined): number {
  const n = typeof v === 'number' ? v : Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function getTypeConfig(type: string | undefined): { label: string; color: string } {
  if (!type) return { label: 'Wallet', color: '#00A266' };
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
  // ── Data ──
  const [accounts, setAccounts]   = useState<Account[]>([]);
  const [loading, setLoading]     = useState<boolean>(true);
  const [errorMsg, setErrorMsg]   = useState<string>('');

  // ── List UI ──
  const [search, setSearch]       = useState<string>('');
  const [sortKey, setSortKey]     = useState<string>('name_asc');

  // ── Page-level view ──
  const [view, setView]           = useState<PageView>('list');
  const [pageMsg, setPageMsg]     = useState<PageMessage | null>(null);

  // ── Form ──
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [form, setForm]           = useState<AccountForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<ApiValidationErrors>({});
  const [formGenError, setFormGenError] = useState<string>('');
  const [saving, setSaving]       = useState<boolean>(false);

  // ── Inline delete confirm ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting]   = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string>('');

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async (): Promise<void> => {
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

  useEffect(() => { void fetchAccounts(); }, [fetchAccounts]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const displayed = useMemo<Account[]>(() => {
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

  const totals = useMemo<[string, number][]>(() => {
    const map: Record<string, number> = {};
    for (const acc of accounts) {
      const cur = acc.currency || 'VND';
      map[cur] = (map[cur] ?? 0) + toNumber(acc.balance);
    }
    return Object.entries(map);
  }, [accounts]);

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const showPageMsg = (type: PageMessage['type'], text: string): void => {
    setPageMsg({ type, text });
    setTimeout(() => setPageMsg(null), 3500);
  };

  const goToList = (): void => {
    setView('list');
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormGenError('');
    setConfirmDeleteId(null);
    setDeleteError('');
  };

  const openAdd = (): void => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setFormGenError('');
    setView('add');
  };

  const openEdit = (acc: Account): void => {
    setEditingAccount(acc);
    setForm({
      name:     acc.name,
      balance:  String(acc.balance),
      currency: acc.currency,
      icon:     acc.icon ?? '💰',
      color:    acc.color ?? '#00A266',
    });
    setFormErrors({});
    setFormGenError('');
    setView('edit');
  };

  // ─── Form field helper ────────────────────────────────────────────────────

  const setField = <K extends keyof AccountForm>(key: K, value: AccountForm[K]): void => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  // ─── Save (create / update) ───────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      const payload = { ...form, balance: parseFloat(form.balance) || 0 };
      if (editingAccount) {
        await api.put(`/accounts/${editingAccount.id}`, payload);
        showPageMsg('success', `"${form.name}" updated successfully.`);
      } else {
        await api.post('/accounts', payload);
        showPageMsg('success', `"${form.name}" created successfully.`);
      }
      goToList();
      await fetchAccounts();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: ApiValidationErrors; message?: string } };
      };
      const apiErrors = axiosErr.response?.data?.errors ?? {};
      if (Object.keys(apiErrors).length > 0) {
        setFormErrors(apiErrors);
      } else {
        setFormGenError(
          axiosErr.response?.data?.message ?? 'Something went wrong. Please try again.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = async (id: number): Promise<void> => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/accounts/${id}`);
      setConfirmDeleteId(null);
      await fetchAccounts();
      showPageMsg('success', 'Account deleted successfully.');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setDeleteError(
        axiosErr.response?.data?.message ?? 'Could not delete this account.',
      );
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const isFormView = view === 'add' || view === 'edit';

  const headerTitle =
    view === 'add' ? 'Add Account' :
    view === 'edit' ? 'Edit Account' :
    'Wallets & Accounts';

  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main">

          {/* ── TOP BAR ─────────────────────────────────────────────── */}
          <div className="verify-number-top">
            <div className="container">

              <div className="verify-number-top-content">
                <div className="back-btn">
                  {isFormView ? (
                    /* In form view: back arrow returns to list, not browser history */
                    <button
                      type="button"
                      onClick={goToList}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}
                    >
                      <img src={BackBtnIcon} alt="back" />
                    </button>
                  ) : (
                    <BackBtn />
                  )}
                </div>
                <div className="header-title">
                  <p>{headerTitle}</p>
                </div>
              </div>

              {/* Search + sort — list view only */}
              {view === 'list' && (
                <div className="contact-search">
                  <div className="input-group contact-searchbar">
                    <div className="search-icon">
                      <img src={SearchIcon} alt="search-icon" />
                    </div>
                    <div className="seach-bar" style={{ flex: 1 }}>
                      <input
                        type="search"
                        value={search}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                        placeholder="Search name, bank or type…"
                        className="form-control search-text"
                      />
                    </div>
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
              )}

            </div>
          </div>

          {/* ── BODY ────────────────────────────────────────────────── */}
          <div className="verify-number-bottom" id="wallet-management-main">
            <div className="verify-number-bottom-wrap">
              <div className="verify-number-content">
                <h1 className="d-none">Wallets &amp; Accounts</h1>

                {/* Page-level success / error message */}
                {pageMsg && (
                  <div
                    style={{
                      padding: '10px 16px',
                      borderRadius: 10,
                      marginBottom: 16,
                      fontSize: 14,
                      fontWeight: 500,
                      background: pageMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                      color:      pageMsg.type === 'success' ? '#166534' : '#991B1B',
                      border:     `1px solid ${pageMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    }}
                  >
                    {pageMsg.text}
                  </div>
                )}

                {/* ══════════════ LIST VIEW ══════════════ */}
                {view === 'list' && (
                  <>
                    {/* Loading */}
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

                    {/* Fetch error */}
                    {!loading && errorMsg && (
                      <div className="text-center py-5">
                        <p style={{ color: '#EF4444', fontSize: 15, marginBottom: 12 }}>{errorMsg}</p>
                        <div className="verify-number-btn" style={{ display: 'inline-block' }}>
                          <a
                            href="#"
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); void fetchAccounts(); }}
                          >
                            Try Again
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Total balance summary */}
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

                    {/* Empty state — no accounts at all */}
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

                    {/* Empty state — search returned nothing */}
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

                    {/* Account rows — BankAndCard.tsx transfer-first pattern */}
                    {!loading && !errorMsg && displayed.length > 0 && (
                      <div className="transfer-to-bank">
                        {displayed.map((acc) => {
                          const balNum   = toNumber(acc.balance);
                          const isNeg    = balNum < 0;
                          const typeConf = getTypeConfig(acc.account_type);

                          /* ── Inline delete confirmation row ── */
                          if (confirmDeleteId === acc.id) {
                            return (
                              <div
                                key={acc.id}
                                className="transfer-first"
                                style={{ background: '#FEF2F2', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}
                              >
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ color: '#991B1B', fontWeight: 600, marginBottom: 2, fontSize: 14 }}>
                                    Delete &ldquo;{acc.name}&rdquo;?
                                  </p>
                                  <p style={{ color: '#B91C1C', fontSize: 12, marginBottom: 0 }}>
                                    This cannot be undone.
                                  </p>
                                  {deleteError && (
                                    <p style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginBottom: 0 }}>
                                      {deleteError}
                                    </p>
                                  )}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                  <button
                                    type="button"
                                    onClick={() => { setConfirmDeleteId(null); setDeleteError(''); }}
                                    disabled={deleting}
                                    style={{
                                      fontSize: 13, fontWeight: 600, padding: '5px 14px',
                                      borderRadius: 8, border: '1px solid #D1D5DB',
                                      background: '#F9FAFB', color: '#374151', cursor: 'pointer',
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDelete(acc.id)}
                                    disabled={deleting}
                                    style={{
                                      fontSize: 13, fontWeight: 600, padding: '5px 14px',
                                      borderRadius: 8, border: 'none',
                                      background: '#EF4444', color: '#fff', cursor: 'pointer',
                                      opacity: deleting ? 0.6 : 1,
                                    }}
                                  >
                                    {deleting ? 'Deleting…' : 'Delete'}
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          /* ── Normal account row ── */
                          return (
                            <div key={acc.id} className="transfer-first">

                              {/* Emoji icon with tinted background */}
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

                              {/* Name + type badge + bank name */}
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
                                    <span style={{ fontSize: 13 }}>{acc.bank_name}</span>
                                  )}
                                </div>
                              </div>

                              {/* Balance + edit / delete buttons */}
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
                                    onClick={() => setConfirmDeleteId(acc.id)}
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

                    {/* Add new account CTA — matches BankAndCard.tsx verify-number-btn */}
                    {!loading && !errorMsg && (
                      <div className="verify-number-btn" id="bank-and-card-main" style={{ marginTop: 24 }}>
                        <a
                          href="#"
                          onClick={(e: React.MouseEvent) => { e.preventDefault(); openAdd(); }}
                        >
                          <span>
                            <img src={faqPlus} alt="plus-icon" />
                          </span>
                          Add a New Account
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* ══════════════ FORM VIEW (add / edit) ══════════════ */}
                {isFormView && (
                  <form
                    onSubmit={(e: React.FormEvent<HTMLFormElement>) => void handleSave(e)}
                    noValidate
                  >
                    {/* General API error */}
                    {formGenError && (
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#FEE2E2',
                          border: '1px solid #FECACA',
                          borderRadius: 10,
                          color: '#991B1B',
                          fontSize: 13,
                          marginBottom: 16,
                        }}
                      >
                        {formGenError}
                      </div>
                    )}

                    {/* Account name */}
                    <div className="personal-name mt-0 mb-3">
                      <label
                        htmlFor="acc-name"
                        style={{ color: 'var(--sub-text-color)', fontSize: 13 }}
                      >
                        Account Name <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="acc-name"
                        type="text"
                        className={`px-0${formErrors.name ? ' is-invalid' : ''}`}
                        value={form.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setField('name', e.target.value)
                        }
                        placeholder="e.g. Cash Wallet, Vietcombank"
                        maxLength={255}
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                          {formErrors.name[0]}
                        </div>
                      )}
                    </div>

                    {/* Balance + Currency side by side */}
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div className="personal-name mb-3" style={{ flex: 2 }}>
                        <label
                          htmlFor="acc-balance"
                          style={{ color: 'var(--sub-text-color)', fontSize: 13 }}
                        >
                          {view === 'edit' ? 'Balance' : 'Opening Balance'}{' '}
                          <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          id="acc-balance"
                          type="number"
                          step="0.01"
                          className={`px-0${formErrors.balance ? ' is-invalid' : ''}`}
                          value={form.balance}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setField('balance', e.target.value)
                          }
                          placeholder="0"
                        />
                        {formErrors.balance && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                            {formErrors.balance[0]}
                          </div>
                        )}
                      </div>

                      <div className="personal-name mb-3" style={{ flex: 1 }}>
                        <label
                          htmlFor="acc-currency"
                          style={{ color: 'var(--sub-text-color)', fontSize: 13 }}
                        >
                          Currency
                        </label>
                        <select
                          id="acc-currency"
                          className="px-0"
                          value={form.currency}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            setField('currency', e.target.value)
                          }
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
                              transform: form.icon === ic ? 'scale(1.1)' : 'scale(1)',
                              transition: 'transform 0.12s',
                            }}
                            aria-label={ic}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color picker */}
                    <div className="mb-3">
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

                    {/* Live preview — mirrors BankAndCard transfer-first style */}
                    <div className="transfer-first" style={{ marginBottom: 24, pointerEvents: 'none' }}>
                      <div
                        className="bank-img"
                        style={{
                          background: form.color ? `${form.color}22` : 'rgba(108,61,230,0.13)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 26,
                          flexShrink: 0,
                        }}
                      >
                        {form.icon}
                      </div>
                      <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
                        <h2 style={{ marginBottom: 2 }}>{form.name || 'Account name'}</h2>
                        <div className="bank-card">
                          <span style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                            {form.currency}
                          </span>
                        </div>
                      </div>
                      <div className="bank-active-sec" style={{ flexShrink: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontWeight: 700,
                            fontSize: 14,
                            color: 'var(--7, #00A266)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatCurrency(parseFloat(form.balance) || 0, form.currency)}
                        </p>
                      </div>
                    </div>

                    {/* Submit button — verify-number-btn matches Payment.tsx CTA style */}
                    <div className="verify-number-btn" style={{ marginTop: 8 }}>
                      <button type="submit" disabled={saving}>
                        {saving
                          ? (view === 'edit' ? 'Saving…' : 'Creating…')
                          : (view === 'edit' ? 'Save Changes' : 'Create Account')}
                      </button>
                    </div>

                    {/* Cancel link */}
                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={goToList}
                        disabled={saving}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--sub-text-color)',
                          fontSize: 14,
                          cursor: 'pointer',
                          padding: '8px 0',
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                  </form>
                )}

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WalletManagement;
