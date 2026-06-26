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
import { useTranslation } from 'react-i18next';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type AccountType = 'wallet' | 'bank' | 'savings' | 'credit_card' | 'investment';

/** Full account shape returned by GET /accounts */
interface Account {
  id: number;
  name: string;
  /** Balance is ALWAYS read-only in the UI — driven by transactions */
  balance: string | number;
  currency: string;
  icon: string | null;
  color: string | null;
  bank_name?: string | null;
  account_type?: AccountType | string;
  transactions_count?: number;
}

/** Category returned by GET /categories */
interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
}

/**
 * Payload for creating a new wallet.
 *
 * `initialBalance` is the only time a balance figure is accepted as user
 * input. After creation, balance is read-only and may only change through
 * transactions (including the "Adjust Balance" flow below).
 */
interface CreateWalletPayload {
  name: string;
  currency: string;
  initialBalance: number;
  icon: string;
  color: string;
}

/**
 * Payload for editing an existing wallet's metadata.
 *
 * Balance is intentionally absent — it cannot be changed here.
 */
interface UpdateWalletPayload {
  name: string;
  currency: string;
  icon: string;
  color: string;
}

/**
 * Form state for the "Adjust Balance" flow.
 *
 * Instead of a direct balance edit, we calculate the difference between
 * the current balance and the target, then create an income or expense
 * transaction for that amount so the audit trail stays clean.
 */
interface AdjustBalanceForm {
  /** Desired new balance — must differ from current balance */
  targetBalance: string;
  /** Category for the auto-generated adjustment transaction (required by API) */
  categoryId: string;
  /** Optional note attached to the generated transaction */
  notes: string;
}

interface ApiValidationErrors {
  [field: string]: string[];
}

interface PageMessage {
  type: 'success' | 'error';
  text: string;
}

type PageView = 'list' | 'add' | 'edit' | 'adjust';

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

const EMPTY_CREATE: CreateWalletPayload = {
  name:           '',
  currency:       'VND',
  initialBalance: 0,
  icon:           '💰',
  color:          '#00A266',
};

const EMPTY_EDIT: UpdateWalletPayload = {
  name:     '',
  currency: 'VND',
  icon:     '💰',
  color:    '#00A266',
};

const EMPTY_ADJUST: AdjustBalanceForm = {
  targetBalance: '',
  categoryId:    '',
  notes:         'Balance adjustment',
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
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/** Locked badge shown wherever the balance appears in a read-only context */
const ReadOnlyBadge: React.FC = () => {
  const { t } = useTranslation();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--sub-text-color)',
        background: 'rgba(108,61,230,0.08)',
        border: '1px solid rgba(108,61,230,0.18)',
        borderRadius: 6,
        padding: '2px 8px',
        letterSpacing: '0.3px',
        userSelect: 'none',
      }}
    >
      {t('🔒 Read-only')}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

const WalletManagement: React.FC = () => {
  const { t } = useTranslation();
  // ── Data ──
  const [accounts,    setAccounts]    = useState<Account[]>([]);
  const [categories,  setCategories]  = useState<Category[]>([]);
  const [loading,     setLoading]     = useState<boolean>(true);
  const [errorMsg,    setErrorMsg]    = useState<string>('');

  // ── List UI ──
  const [search,   setSearch]   = useState<string>('');
  const [sortKey,  setSortKey]  = useState<string>('name_asc');

  // ── Page-level view + messages ──
  const [view,    setView]    = useState<PageView>('list');
  const [pageMsg, setPageMsg] = useState<PageMessage | null>(null);

  // ── Target records for edit / adjust ──
  const [editingAccount,  setEditingAccount]  = useState<Account | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<Account | null>(null);

  // ── Separate forms — one per workflow ──
  const [createForm, setCreateForm] = useState<CreateWalletPayload>(EMPTY_CREATE);
  const [editForm,   setEditForm]   = useState<UpdateWalletPayload>(EMPTY_EDIT);
  const [adjustForm, setAdjustForm] = useState<AdjustBalanceForm>(EMPTY_ADJUST);

  // ── Form feedback ──
  const [formErrors,    setFormErrors]    = useState<ApiValidationErrors>({});
  const [formGenError,  setFormGenError]  = useState<string>('');
  const [saving,        setSaving]        = useState<boolean>(false);
  const [adjusting,     setAdjusting]     = useState<boolean>(false);
  const [adjustGenError, setAdjustGenError] = useState<string>('');

  // ── Inline delete confirm ──
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting,        setDeleting]        = useState<boolean>(false);
  const [deleteError,     setDeleteError]     = useState<string>('');

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

  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      const res = await api.get('/categories');
      // Accept both {categories:[]} and {data:[]}
      setCategories(res.data.categories ?? res.data.data ?? []);
    } catch {
      // Categories failing is non-fatal; adjust form will show a message
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
    void fetchCategories();
  }, [fetchAccounts, fetchCategories]);

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

  /**
   * For the Adjust Balance form, compute the diff between target and current
   * balance so we can show a live preview of the transaction that will be created.
   */
  const adjustDiff = useMemo<number>(() => {
    if (!adjustingAccount) return 0;
    const target  = parseFloat(adjustForm.targetBalance);
    const current = toNumber(adjustingAccount.balance);
    return Number.isFinite(target) ? target - current : 0;
  }, [adjustingAccount, adjustForm.targetBalance]);

  /**
   * Categories filtered to match the direction of the adjustment:
   *  diff > 0  →  show income categories (money coming in)
   *  diff < 0  →  show expense categories (money going out)
   *  diff == 0 →  show all (let validation handle it)
   */
  const relevantCategories = useMemo<Category[]>(() => {
    if (adjustDiff > 0) return categories.filter((c) => c.type === 'income');
    if (adjustDiff < 0) return categories.filter((c) => c.type === 'expense');
    return categories;
  }, [categories, adjustDiff]);

  // ─── Navigation helpers ───────────────────────────────────────────────────

  const showPageMsg = (type: PageMessage['type'], text: string): void => {
    setPageMsg({ type, text });
    setTimeout(() => setPageMsg(null), 4000);
  };

  const goToList = (): void => {
    setView('list');
    setEditingAccount(null);
    setAdjustingAccount(null);
    setCreateForm(EMPTY_CREATE);
    setEditForm(EMPTY_EDIT);
    setAdjustForm(EMPTY_ADJUST);
    setFormErrors({});
    setFormGenError('');
    setAdjustGenError('');
    setConfirmDeleteId(null);
    setDeleteError('');
  };

  const openAdd = (): void => {
    setEditingAccount(null);
    setCreateForm(EMPTY_CREATE);
    setFormErrors({});
    setFormGenError('');
    setView('add');
  };

  const openEdit = (acc: Account): void => {
    setEditingAccount(acc);
    setEditForm({
      name:     acc.name,
      currency: acc.currency,
      icon:     acc.icon  ?? '💰',
      color:    acc.color ?? '#00A266',
    });
    setFormErrors({});
    setFormGenError('');
    setView('edit');
  };

  const openAdjust = (acc: Account): void => {
    setAdjustingAccount(acc);
    setAdjustForm({
      targetBalance: String(toNumber(acc.balance)),
      categoryId:    '',
      notes:         'Balance adjustment',
    });
    setAdjustGenError('');
    setView('adjust');
  };

  // ─── Create ───────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      await api.post('/accounts', {
        name:     createForm.name,
        balance:  createForm.initialBalance,   // Opening balance — one-time only
        currency: createForm.currency,
        icon:     createForm.icon,
        color:    createForm.color,
      });
      showPageMsg('success', `"${createForm.name}" created successfully.`);
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

  // ─── Update (metadata only — balance is intentionally excluded) ───────────

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!editingAccount) return;
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      // Only metadata fields: name, currency, icon, color
      // Balance is never included here — the server also blocks it
      await api.put(`/accounts/${editingAccount.id}`, {
        name:     editForm.name,
        currency: editForm.currency,
        icon:     editForm.icon,
        color:    editForm.color,
      });
      showPageMsg('success', `"${editForm.name}" updated successfully.`);
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

  // ─── Adjust Balance (auto-generates a transaction for the diff) ───────────

  /**
   * Adjust balance workflow:
   *
   *  1. Compute diff = targetBalance − currentBalance
   *  2. diff > 0  →  create an INCOME transaction (money flowing in)
   *     diff < 0  →  create an EXPENSE transaction (money flowing out)
   *  3. The transaction updates the account balance automatically via the
   *     server-side balance hook.
   *
   * This preserves a full audit trail — balance never changes without a
   * corresponding transaction.
   */
  const handleAdjust = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!adjustingAccount) return;

    setAdjustGenError('');

    const target  = parseFloat(adjustForm.targetBalance);
    const current = toNumber(adjustingAccount.balance);

    if (!Number.isFinite(target)) {
      setAdjustGenError('Please enter a valid target balance.');
      return;
    }
    if (!adjustForm.categoryId) {
      setAdjustGenError('Please select a category for the adjustment transaction.');
      return;
    }

    const diff = target - current;
    if (Math.abs(diff) < 0.01) {
      setAdjustGenError(
        'The target balance is the same as the current balance. No adjustment needed.',
      );
      return;
    }

    setAdjusting(true);
    try {
      await api.post('/transactions', {
        account_id:       adjustingAccount.id,
        category_id:      parseInt(adjustForm.categoryId, 10),
        type:             diff > 0 ? 'income' : 'expense',
        amount:           Math.abs(diff),
        transaction_date: new Date().toISOString().split('T')[0],
        notes:            adjustForm.notes || 'Balance adjustment',
      });

      showPageMsg(
        'success',
        `Balance adjusted from ${formatCurrency(current, adjustingAccount.currency)} → ${formatCurrency(target, adjustingAccount.currency)}.`,
      );
      goToList();
      await fetchAccounts();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { data?: { errors?: ApiValidationErrors; message?: string } };
      };
      const firstErr = Object.values(axiosErr.response?.data?.errors ?? {})[0]?.[0];
      setAdjustGenError(
        firstErr ??
        axiosErr.response?.data?.message ??
        'Adjustment failed. Please try again.',
      );
    } finally {
      setAdjusting(false);
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
  // Shared UI atoms
  // ─────────────────────────────────────────────────────────────────────────

  const iconPickerRow = (current: string, onChange: (v: string) => void): React.ReactNode => (
    <div className="mb-3">
      <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>{t('Icon')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {ICON_PRESETS.map((ic) => (
          <button
            key={ic}
            type="button"
            onClick={() => onChange(ic)}
            style={{
              width: 40, height: 40, borderRadius: 10,
              border: `1px solid ${current === ic ? 'var(--primary-color, #6C3DE6)' : 'var(--sub-bg-color)'}`,
              background: current === ic ? 'rgba(108,61,230,0.12)' : 'var(--sub-bg-color)',
              fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transform: current === ic ? 'scale(1.1)' : 'scale(1)',
              transition: 'transform 0.12s',
            }}
            aria-label={ic}
          >
            {ic}
          </button>
        ))}
      </div>
    </div>
  );

  const colorPickerRow = (current: string, onChange: (v: string) => void): React.ReactNode => (
    <div className="mb-3">
      <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 8 }}>{t('Color')}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {COLOR_PRESETS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{
              width: 28, height: 28, borderRadius: '50%',
              background: c, border: 'none', cursor: 'pointer',
              outline: current === c ? `3px solid ${c}` : 'none',
              outlineOffset: 2,
              transform: current === c ? 'scale(1.15)' : 'scale(1)',
              transition: 'transform 0.12s',
            }}
            aria-label={c}
          />
        ))}
      </div>
    </div>
  );

  const previewCard = (icon: string, name: string, currency: string, balanceDisplay: string, color: string): React.ReactNode => (
    <div className="transfer-first" style={{ marginBottom: 24, pointerEvents: 'none' }}>
      <div
        className="bank-img"
        style={{
          background: color ? `${color}22` : 'rgba(108,61,230,0.13)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{ marginBottom: 2 }}>{name || t('Account name')}</h2>
        <div className="bank-card">
          <span style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{currency}</span>
        </div>
      </div>
      <div className="bank-active-sec" style={{ flexShrink: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: 'var(--7, #00A266)', whiteSpace: 'nowrap' }}>
          {balanceDisplay}
        </p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const headerTitle: Record<PageView, string> = {
    list:   t('Wallets & Accounts'),
    add:    t('Add Account'),
    edit:   t('Edit Account'),
    adjust: t('Adjust Balance'),
  };

  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main">

          {/* ── TOP BAR ─────────────────────────────────────────────── */}
          <div className="verify-number-top">
            <div className="container">
              <div className="verify-number-top-content">
                <div className="back-btn">
                  {view !== 'list' ? (
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
                  <p>{headerTitle[view]}</p>
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
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('Search name, bank or type…')}
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
                        {t('Sort')}
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end">
                        {SORT_OPTIONS.map((opt) => (
                          <li key={opt.value}>
                            <button
                              className={`dropdown-item${sortKey === opt.value ? ' active' : ''}`}
                              onClick={() => setSortKey(opt.value)}
                            >
                              {t(opt.label)}
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

                {/* Page-level flash message */}
                {pageMsg && (
                  <div
                    style={{
                      padding: '10px 16px', borderRadius: 10, marginBottom: 16,
                      fontSize: 14, fontWeight: 500,
                      background: pageMsg.type === 'success' ? '#DCFCE7' : '#FEE2E2',
                      color:      pageMsg.type === 'success' ? '#166534' : '#991B1B',
                      border:     `1px solid ${pageMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
                    }}
                  >
                    {pageMsg.text}
                  </div>
                )}

                {/* ══════════════════════════════════════════════════════
                    LIST VIEW
                    ══════════════════════════════════════════════════════ */}
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
                          {t('Loading accounts…')}
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
                            onClick={(e) => { e.preventDefault(); void fetchAccounts(); }}
                          >
                            {t('Try Again')}
                          </a>
                        </div>
                      </div>
                    )}

                    {/* Total balance summary */}
                    {!loading && !errorMsg && accounts.length > 0 && (
                      <div style={{ marginBottom: 20 }}>
                        <p
                          style={{
                            color: 'var(--sub-text-color)', fontSize: 12, fontWeight: 600,
                            textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 4,
                          }}
                        >
                          {t('Total Balance')}
                        </p>
                        {totals.map(([cur, amt]) => (
                          <p key={cur} className="pay-txt1" style={{ fontSize: 24, fontWeight: 700, marginBottom: 2 }}>
                            {formatCurrency(amt, cur)}
                          </p>
                        ))}
                        <p style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 0 }}>
                          {accounts.length} {accounts.length !== 1 ? t('accounts') : t('account')}
                        </p>
                      </div>
                    )}

                    {/* Empty state — no accounts */}
                    {!loading && !errorMsg && accounts.length === 0 && (
                      <div className="text-center py-5">
                        <p style={{ fontSize: 40, marginBottom: 8 }}>💰</p>
                        <p style={{ color: 'var(--text-color)', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                          {t('No accounts yet')}
                        </p>
                        <p style={{ color: 'var(--sub-text-color)', fontSize: 14, marginBottom: 20 }}>
                          {t('Add your first wallet or bank account to get started.')}
                        </p>
                      </div>
                    )}

                    {/* Empty state — search returned nothing */}
                    {!loading && !errorMsg && accounts.length > 0 && displayed.length === 0 && (
                      <div className="text-center py-4">
                        <p style={{ color: 'var(--sub-text-color)', fontSize: 14 }}>
                          {t('No accounts match "{{search}}".'). replace('{{search}}', search)}{' '}
                          <button
                            className="btn btn-link p-0"
                            style={{ fontSize: 14 }}
                            onClick={() => setSearch('')}
                          >
                            {t('Clear search')}
                          </button>
                        </p>
                      </div>
                    )}

                    {/* Account rows */}
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
                                    {t('This cannot be undone.')}
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
                                      background: '#fff', color: '#374151', cursor: 'pointer',
                                    }}
                                  >
                                    {t('Cancel')}
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
                                    {deleting ? t('Deleting…') : t('Delete')}
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          /* ── Normal account row ── */
                          return (
                            <div key={acc.id} className="transfer-first">

                              {/* Emoji icon */}
                              <div
                                className="bank-img"
                                style={{
                                  background: acc.color ? `${acc.color}22` : 'rgba(108,61,230,0.13)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 26, flexShrink: 0,
                                }}
                              >
                                {acc.icon || '💰'}
                              </div>

                              {/* Name + type badge */}
                              <div className="bank-details" style={{ flex: 1, minWidth: 0 }}>
                                <h2 style={{ marginBottom: 2 }}>{acc.name}</h2>
                                <div className="bank-card">
                                  <span
                                    style={{
                                      color: typeConf.color, fontSize: 12, fontWeight: 600,
                                      background: `${typeConf.color}22`,
                                      padding: '1px 7px', borderRadius: 20, marginRight: 6,
                                    }}
                                  >
                                    {typeConf.label}
                                  </span>
                                  {acc.bank_name && (
                                    <span style={{ fontSize: 13 }}>{acc.bank_name}</span>
                                  )}
                                </div>
                              </div>

                              {/* Balance (read-only display) + action buttons */}
                              <div
                                className="bank-active-sec"
                                style={{
                                  display: 'flex', flexDirection: 'column',
                                  alignItems: 'flex-end', gap: 8,
                                  marginLeft: 'auto', flexShrink: 0,
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0, fontWeight: 700, fontSize: 14,
                                    color: isNeg ? '#EF4444' : 'var(--7, #00A266)',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {formatCurrency(balNum, acc.currency)}
                                </p>

                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                  {/* Edit metadata — pencil */}
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => openEdit(acc)}
                                    title={t('Edit name, icon, color')}
                                    style={{ lineHeight: 1 }}
                                  >
                                    <img src={purpleEditIcon} alt="edit" style={{ width: 18, height: 18 }} />
                                  </button>

                                  {/* Adjust balance — creates a transaction */}
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => openAdjust(acc)}
                                    title={t('Adjust balance via transaction')}
                                    style={{ lineHeight: 1, fontSize: 16 }}
                                  >
                                    ⚖️
                                  </button>

                                  {/* Delete */}
                                  <button
                                    className="btn btn-link p-0"
                                    onClick={() => setConfirmDeleteId(acc.id)}
                                    title="Delete account"
                                    style={{ lineHeight: 1 }}
                                  >
                                    <span style={{ color: '#EF4444', fontSize: 16 }}>✕</span>
                                  </button>
                                </div>
                              </div>

                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add new account CTA */}
                    {!loading && !errorMsg && (
                      <div className="verify-number-btn" id="bank-and-card-main" style={{ marginTop: 24 }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); openAdd(); }}>
                          <span><img src={faqPlus} alt="plus-icon" /></span>
                          {t('Add a New Account')}
                        </a>
                      </div>
                    )}
                  </>
                )}

                {/* ══════════════════════════════════════════════════════
                    ADD VIEW
                    Opening balance is the ONLY time balance can be entered
                    as a number. After creation it is driven by transactions.
                    ══════════════════════════════════════════════════════ */}
                {view === 'add' && (
                  <form onSubmit={(e) => void handleCreate(e)} noValidate>
                    {formGenError && (
                      <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
                        {formGenError}
                      </div>
                    )}

                    {/* Account name */}
                    <div className="personal-name mt-0 mb-3">
                      <label htmlFor="add-name" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('Account Name')} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="add-name"
                        type="text"
                        className={`px-0${formErrors.name ? ' is-invalid' : ''}`}
                        value={createForm.name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={t('e.g. Cash Wallet, Vietcombank')}
                        maxLength={255}
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                          {formErrors.name[0]}
                        </div>
                      )}
                    </div>

                    {/* Opening Balance + Currency */}
                    <div style={{ display: 'flex', gap: 16 }}>
                      <div className="personal-name mb-3" style={{ flex: 2 }}>
                        <label htmlFor="add-initial-balance" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                          {t('Opening Balance')} <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          id="add-initial-balance"
                          type="number"
                          step="0.01"
                          min="0"
                          className={`px-0${formErrors.balance ? ' is-invalid' : ''}`}
                          value={createForm.initialBalance === 0 ? '' : createForm.initialBalance}
                          onChange={(e) =>
                            setCreateForm((f) => ({
                              ...f,
                              initialBalance: parseFloat(e.target.value) || 0,
                            }))
                          }
                          placeholder="0"
                        />
                        <p style={{ fontSize: 11, color: 'var(--sub-text-color)', marginTop: 4, marginBottom: 0 }}>
                          {t('Set once at creation. After this, balance changes through transactions only.')}
                        </p>
                        {formErrors.balance && (
                          <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                            {formErrors.balance[0]}
                          </div>
                        )}
                      </div>

                      <div className="personal-name mb-3" style={{ flex: 1 }}>
                        <label htmlFor="add-currency" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                          {t('Currency')}
                        </label>
                        <select
                          id="add-currency"
                          className="px-0"
                          value={createForm.currency}
                          onChange={(e) => setCreateForm((f) => ({ ...f, currency: e.target.value }))}
                          style={{
                            background: 'var(--sub-bg-color)', color: 'var(--text-color)',
                            border: 0, borderBottom: '2px solid var(--sub-bg-color)',
                            width: '100%', fontSize: 14, paddingBottom: 4,
                          }}
                        >
                          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>

                    {iconPickerRow(createForm.icon, (v) => setCreateForm((f) => ({ ...f, icon: v })))}
                    {colorPickerRow(createForm.color, (v) => setCreateForm((f) => ({ ...f, color: v })))}

                    {/* Live preview */}
                    {previewCard(
                      createForm.icon,
                      createForm.name,
                      createForm.currency,
                      formatCurrency(createForm.initialBalance, createForm.currency),
                      createForm.color,
                    )}

                    <div className="verify-number-btn" style={{ marginTop: 8 }}>
                      <button type="submit" disabled={saving}>
                        {saving ? t('Creating…') : t('Create Account')}
                      </button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={goToList}
                        disabled={saving}
                        style={{ background: 'none', border: 'none', color: 'var(--sub-text-color)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {/* ══════════════════════════════════════════════════════
                    EDIT VIEW
                    Balance is READ-ONLY here. Only metadata is editable.
                    Use "Adjust Balance" (⚖️) for balance changes.
                    ══════════════════════════════════════════════════════ */}
                {view === 'edit' && editingAccount && (
                  <form onSubmit={(e) => void handleUpdate(e)} noValidate>
                    {formGenError && (
                      <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
                        {formGenError}
                      </div>
                    )}

                    {/* Current balance — locked display (NOT an input) */}
                    <div
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderRadius: 12,
                        background: 'rgba(108,61,230,0.06)',
                        border: '1px solid rgba(108,61,230,0.14)',
                        marginBottom: 20,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub-text-color)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0, marginBottom: 2 }}>
                          {t('Current Balance')}
                        </p>
                        <p
                          style={{
                            fontSize: 22, fontWeight: 700, margin: 0,
                            color: toNumber(editingAccount.balance) < 0 ? '#EF4444' : 'var(--7, #00A266)',
                          }}
                        >
                          {formatCurrency(toNumber(editingAccount.balance), editingAccount.currency)}
                        </p>
                      </div>
                      <ReadOnlyBadge />
                    </div>

                    {/* Hint linking to Adjust Balance */}
                    <p style={{ fontSize: 12, color: 'var(--sub-text-color)', marginBottom: 20, lineHeight: 1.5 }}>
                      {t('Balance is calculated from your transactions and cannot be edited here. Go back to the wallet list and tap the ⚖️ icon to adjust it.')}
                    </p>

                    {/* Account name */}
                    <div className="personal-name mt-0 mb-3">
                      <label htmlFor="edit-name" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('Account Name')} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        className={`px-0${formErrors.name ? ' is-invalid' : ''}`}
                        value={editForm.name}
                        onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder={t('e.g. Cash Wallet')}
                        maxLength={255}
                      />
                      {formErrors.name && (
                        <div className="invalid-feedback d-block" style={{ fontSize: 12 }}>
                          {formErrors.name[0]}
                        </div>
                      )}
                    </div>

                    {/* Currency (still editable metadata) */}
                    <div className="personal-name mb-3">
                      <label htmlFor="edit-currency" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('Currency')}
                      </label>
                      <select
                        id="edit-currency"
                        className="px-0"
                        value={editForm.currency}
                        onChange={(e) => setEditForm((f) => ({ ...f, currency: e.target.value }))}
                        style={{
                          background: 'var(--sub-bg-color)', color: 'var(--text-color)',
                          border: 0, borderBottom: '2px solid var(--sub-bg-color)',
                          width: '100%', fontSize: 14, paddingBottom: 4,
                        }}
                      >
                        {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {iconPickerRow(editForm.icon, (v) => setEditForm((f) => ({ ...f, icon: v })))}
                    {colorPickerRow(editForm.color, (v) => setEditForm((f) => ({ ...f, color: v })))}

                    {/* Live preview — balance comes from the actual account (not form) */}
                    {previewCard(
                      editForm.icon,
                      editForm.name,
                      editForm.currency,
                      formatCurrency(toNumber(editingAccount.balance), editingAccount.currency),
                      editForm.color,
                    )}

                    <div className="verify-number-btn" style={{ marginTop: 8 }}>
                      <button type="submit" disabled={saving}>
                        {saving ? t('Saving…') : t('Save Changes')}
                      </button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={goToList}
                        disabled={saving}
                        style={{ background: 'none', border: 'none', color: 'var(--sub-text-color)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
                      >
                        {t('Cancel')}
                      </button>
                    </div>
                  </form>
                )}

                {/* ══════════════════════════════════════════════════════
                    ADJUST BALANCE VIEW
                    Creates an income or expense transaction for the diff.
                    Full audit trail — balance never mutated directly.
                    ══════════════════════════════════════════════════════ */}
                {view === 'adjust' && adjustingAccount && (
                  <form onSubmit={(e) => void handleAdjust(e)} noValidate>

                    {/* Current balance chip */}
                    <div
                      style={{
                        padding: '14px 16px', borderRadius: 12,
                        background: 'rgba(108,61,230,0.06)',
                        border: '1px solid rgba(108,61,230,0.14)',
                        marginBottom: 24,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                        <span style={{ fontSize: 22 }}>{adjustingAccount.icon || '💰'}</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: 'var(--text-color)' }}>
                            {adjustingAccount.name}
                          </p>
                          <p style={{ fontSize: 12, margin: 0, color: 'var(--sub-text-color)' }}>
                            {adjustingAccount.currency}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--sub-text-color)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>
                            {t('Current Balance')}
                          </p>
                          <p
                            style={{
                              fontSize: 24, fontWeight: 700, margin: 0,
                              color: toNumber(adjustingAccount.balance) < 0 ? '#EF4444' : 'var(--7, #00A266)',
                            }}
                          >
                            {formatCurrency(toNumber(adjustingAccount.balance), adjustingAccount.currency)}
                          </p>
                        </div>
                        <ReadOnlyBadge />
                      </div>
                    </div>

                    {/* How it works — brief explanation */}
                    <div
                      style={{
                        padding: '10px 14px', borderRadius: 10,
                        background: 'rgba(59,130,246,0.07)',
                        border: '1px solid rgba(59,130,246,0.18)',
                        marginBottom: 20, fontSize: 12,
                        color: 'var(--sub-text-color)', lineHeight: 1.55,
                      }}
                    >
                      {adjustDiff > 0
                        ? t("ℹ️ Enter the target balance you want. We'll automatically create an income transaction for the difference to keep your audit trail intact.")
                        : adjustDiff < 0
                          ? t("ℹ️ Enter the target balance you want. We'll automatically create an expense transaction for the difference to keep your audit trail intact.")
                          : t("ℹ️ Enter the target balance you want. We'll automatically create a transaction for the difference to keep your audit trail intact.")}
                    </div>

                    {adjustGenError && (
                      <div style={{ padding: '10px 14px', background: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 10, color: '#991B1B', fontSize: 13, marginBottom: 16 }}>
                        {adjustGenError}
                      </div>
                    )}

                    {/* Target balance input */}
                    <div className="personal-name mt-0 mb-3">
                      <label htmlFor="adj-target" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('New Target Balance')} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <input
                        id="adj-target"
                        type="number"
                        step="0.01"
                        className="px-0"
                        value={adjustForm.targetBalance}
                        onChange={(e) => setAdjustForm((f) => ({ ...f, targetBalance: e.target.value }))}
                        placeholder={t('Enter desired balance')}
                      />

                      {/* Live diff preview */}
                      {adjustForm.targetBalance !== '' && Math.abs(adjustDiff) >= 0.01 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--sub-text-color)' }}>{t('Difference:')}</span>
                          <span
                            style={{
                              fontSize: 13, fontWeight: 700,
                              color: adjustDiff > 0 ? '#00A266' : '#EF4444',
                            }}
                          >
                            {adjustDiff > 0 ? '+' : ''}{formatCurrency(adjustDiff, adjustingAccount.currency)}
                          </span>
                          <span
                            style={{
                              fontSize: 11, fontWeight: 600, padding: '1px 8px', borderRadius: 20,
                              background: adjustDiff > 0 ? '#DCFCE7' : '#FEE2E2',
                              color:      adjustDiff > 0 ? '#166534'  : '#991B1B',
                            }}
                          >
                            {adjustDiff > 0 ? t('Income txn') : t('Expense txn')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Category picker */}
                    <div className="personal-name mb-3">
                      <label htmlFor="adj-category" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('Category')} <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      {categories.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#EF4444', margin: 0 }}>
                          {t('No categories found. Please create a category first.')}
                        </p>
                      ) : (
                        <select
                          id="adj-category"
                          className="px-0"
                          value={adjustForm.categoryId}
                          onChange={(e) => setAdjustForm((f) => ({ ...f, categoryId: e.target.value }))}
                          style={{
                            background: 'var(--sub-bg-color)', color: 'var(--text-color)',
                            border: 0, borderBottom: '2px solid var(--sub-bg-color)',
                            width: '100%', fontSize: 14, paddingBottom: 4,
                          }}
                        >
                          <option value="">{t('Select a category…')}</option>
                          {/* Filter to matching type when diff direction is known */}
                          {(relevantCategories.length > 0 ? relevantCategories : categories).map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>
                              {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                            </option>
                          ))}
                          {/* Offer full list as fallback if relevant is empty */}
                          {relevantCategories.length === 0 && categories.length > 0 && (
                            <>
                              <optgroup label="── Income ──">
                                {categories.filter((c) => c.type === 'income').map((cat) => (
                                  <option key={cat.id} value={String(cat.id)}>
                                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                  </option>
                                ))}
                              </optgroup>
                              <optgroup label="── Expense ──">
                                {categories.filter((c) => c.type === 'expense').map((cat) => (
                                  <option key={cat.id} value={String(cat.id)}>
                                    {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                                  </option>
                                ))}
                              </optgroup>
                            </>
                          )}
                        </select>
                      )}
                      <p style={{ fontSize: 11, color: 'var(--sub-text-color)', marginTop: 4, marginBottom: 0 }}>
                        {adjustDiff > 0
                          ? t('Shows income categories matching the adjustment direction.')
                          : adjustDiff < 0
                            ? t('Shows expense categories matching the adjustment direction.')
                            : t('Shows all categories matching the adjustment direction.')}
                      </p>
                    </div>

                    {/* Notes */}
                    <div className="personal-name mb-3">
                      <label htmlFor="adj-notes" style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>
                        {t('Note')}
                      </label>
                      <input
                        id="adj-notes"
                        type="text"
                        className="px-0"
                        value={adjustForm.notes}
                        onChange={(e) => setAdjustForm((f) => ({ ...f, notes: e.target.value }))}
                        placeholder={t('Balance adjustment')}
                        maxLength={500}
                      />
                    </div>

                    <div className="verify-number-btn" style={{ marginTop: 8 }}>
                      <button type="submit" disabled={adjusting || categories.length === 0}>
                        {adjusting ? t('Applying…') : t('Apply Adjustment')}
                      </button>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={goToList}
                        disabled={adjusting}
                        style={{ background: 'none', border: 'none', color: 'var(--sub-text-color)', fontSize: 14, cursor: 'pointer', padding: '8px 0' }}
                      >
                        {t('Cancel')}
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
