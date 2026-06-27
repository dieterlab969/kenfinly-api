import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import BackBtn from '../components/BackBtn';
import SearchIcon from '../assets/svg/search-icon.svg';
import EditIcon from '../assets/svg/purple-edit-icon.svg';
import ExpiredIcon from '../assets/svg/expired-icon.svg';
import faqPlus from '../assets/svg/faq-plus.svg';
import api from '../../utils/api';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Reminder {
  id?: number;
  is_enabled: boolean;
  remind_before_days: number;
  channels: string[];
}

interface UserSubscription {
  id: number;
  service_name: string;
  amount: string;
  currency: string;
  billing_cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  next_billing_date: string;
  is_trial: boolean;
  status: 'ACTIVE' | 'EXPIRED';
  reminder: Reminder | null;
}

interface PaymentHistoryItem {
  id: number;
  amount_paid: string;
  currency: string;
  payment_date: string;
  status: 'SUCCESS' | 'FAILED';
  failure_reason: string | null;
  transaction_code: string | null;
}

interface SubscriptionForm {
  service_name: string;
  amount: string;
  currency: 'VND' | 'USD';
  billing_cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  next_billing_date: string;
  is_trial: boolean;
  reminder_enabled: boolean;
  remind_before_days: number;
  channels_email: boolean;
  channels_push: boolean;
}

interface PageMessage {
  type: 'success' | 'error';
  text: string;
}

interface ValidationErrors {
  [field: string]: string[];
}

type PageView = 'list' | 'add' | 'edit' | 'history';
type ActiveTab = 'active' | 'expired';
type SortKey = 'next_billing_date_asc' | 'next_billing_date_desc' | 'amount_high' | 'amount_low' | 'name_asc';

// ─── Constants ────────────────────────────────────────────────────────────────

const EMPTY_FORM: SubscriptionForm = {
  service_name:       '',
  amount:             '',
  currency:           'VND',
  billing_cycle:      'MONTHLY',
  next_billing_date:  '',
  is_trial:           false,
  reminder_enabled:   false,
  remind_before_days: 3,
  channels_email:     true,
  channels_push:      false,
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'next_billing_date_asc',  label: 'Next Billing ↑' },
  { value: 'next_billing_date_desc', label: 'Next Billing ↓' },
  { value: 'amount_high',            label: 'Amount: High → Low' },
  { value: 'amount_low',             label: 'Amount: Low → High' },
  { value: 'name_asc',               label: 'Service Name (A-Z)' },
];

const REMIND_OPTIONS = [1, 3, 5, 7, 14];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatAmount(amount: string, currency: string): string {
  const num = parseFloat(amount);
  if (isNaN(num)) return `0 ${currency}`;
  if (currency === 'VND') {
    return `${num.toLocaleString('vi-VN')} VND`;
  }
  return `$${num.toFixed(2)}`;
}

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function serviceInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

function serviceColor(name: string): string {
  const colors = ['#7B51F1', '#EF4444', '#F97316', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldErrorProps { errors: ValidationErrors; field: string }
const FieldError: React.FC<FieldErrorProps> = ({ errors, field }) => {
  const msgs = errors[field];
  if (!msgs?.length) return null;
  return <p style={{ color: '#EF4444', fontSize: 12, marginTop: 3 }}>{msgs[0]}</p>;
};

// ─── Main component ───────────────────────────────────────────────────────────

const SubscriptionManagement: React.FC = () => {
  const { t } = useTranslation();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading]             = useState<boolean>(true);
  const [errorMsg, setErrorMsg]           = useState<string>('');

  // ── List UI ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab]   = useState<ActiveTab>('active');
  const [search, setSearch]         = useState<string>('');
  const [sortKey, setSortKey]       = useState<SortKey>('next_billing_date_asc');
  const [showSort, setShowSort]     = useState<boolean>(false);

  // ── View / forms ──────────────────────────────────────────────────────────
  const [view, setView]             = useState<PageView>('list');
  const [pageMsg, setPageMsg]       = useState<PageMessage | null>(null);
  const [form, setForm]             = useState<SubscriptionForm>(EMPTY_FORM);
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [historyId, setHistoryId]   = useState<number | null>(null);

  // ── Form feedback ─────────────────────────────────────────────────────────
  const [fieldErrors, setFieldErrors]   = useState<ValidationErrors>({});
  const [formGenError, setFormGenError] = useState<string>('');
  const [saving, setSaving]             = useState<boolean>(false);

  // ── Delete ────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete]   = useState<boolean>(false);
  const [deleting, setDeleting]             = useState<boolean>(false);

  // ── Payment history ───────────────────────────────────────────────────────
  const [history, setHistory]               = useState<PaymentHistoryItem[]>([]);
  const [historySubscription, setHistorySub] = useState<UserSubscription | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // ─── Fetch ───────────────────────────────────────────────────────────────

  const fetchSubscriptions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.get('/user-subscriptions');
      setSubscriptions(res.data.subscriptions ?? []);
    } catch {
      setErrorMsg(t('Unable to load subscriptions. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchSubscriptions(); }, [fetchSubscriptions]);

  // ─── Derived data ─────────────────────────────────────────────────────────

  const filtered = useMemo<UserSubscription[]>(() => {
    const q = search.trim().toLowerCase();
    let list = subscriptions.filter(s =>
      activeTab === 'active' ? s.status === 'ACTIVE' : s.status === 'EXPIRED'
    );
    if (q) list = list.filter(s => s.service_name.toLowerCase().includes(q));

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'next_billing_date_asc':  return a.next_billing_date.localeCompare(b.next_billing_date);
        case 'next_billing_date_desc': return b.next_billing_date.localeCompare(a.next_billing_date);
        case 'amount_high':            return parseFloat(b.amount) - parseFloat(a.amount);
        case 'amount_low':             return parseFloat(a.amount) - parseFloat(b.amount);
        case 'name_asc':               return a.service_name.localeCompare(b.service_name);
        default:                       return 0;
      }
    });
  }, [subscriptions, activeTab, search, sortKey]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const showPageMsg = (type: PageMessage['type'], text: string): void => {
    setPageMsg({ type, text });
    setTimeout(() => setPageMsg(null), 4000);
  };

  const updateForm = (patch: Partial<SubscriptionForm>): void =>
    setForm(prev => ({ ...prev, ...patch }));

  const goToList = (): void => {
    setView('list');
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormGenError('');
    setConfirmDelete(false);
  };

  const openAdd = (): void => {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setFormGenError('');
    setEditingId(null);
    setView('add');
  };

  const openEdit = async (sub: UserSubscription): Promise<void> => {
    setFieldErrors({});
    setFormGenError('');
    setConfirmDelete(false);
    setEditingId(sub.id);
    const r = sub.reminder;
    setForm({
      service_name:       sub.service_name,
      amount:             sub.amount,
      currency:           sub.currency as 'VND' | 'USD',
      billing_cycle:      sub.billing_cycle,
      next_billing_date:  sub.next_billing_date,
      is_trial:           sub.is_trial,
      reminder_enabled:   r?.is_enabled ?? false,
      remind_before_days: r?.remind_before_days ?? 3,
      channels_email:     r?.channels?.includes('email') ?? true,
      channels_push:      r?.channels?.includes('push') ?? false,
    });
    setView('edit');
  };

  const openHistory = async (sub: UserSubscription): Promise<void> => {
    setHistoryId(sub.id);
    setHistorySub(sub);
    setHistoryLoading(true);
    setView('history');
    try {
      const res = await api.get(`/user-subscriptions/${sub.id}/payment-history`);
      setHistory(res.data.history ?? []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  const buildPayload = (f: SubscriptionForm) => ({
    service_name:       f.service_name,
    amount:             parseFloat(f.amount),
    currency:           f.currency,
    billing_cycle:      f.billing_cycle,
    next_billing_date:  f.next_billing_date,
    is_trial:           f.is_trial,
    reminder: f.reminder_enabled ? {
      is_enabled:         true,
      remind_before_days: f.remind_before_days,
      channels: [
        ...(f.channels_email ? ['email'] : []),
        ...(f.channels_push  ? ['push']  : []),
      ],
    } : { is_enabled: false, remind_before_days: f.remind_before_days, channels: [] },
  });

  const handleCreate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    setFormGenError('');
    try {
      await api.post('/user-subscriptions', buildPayload(form));
      showPageMsg('success', t('Subscription created successfully.'));
      goToList();
      await fetchSubscriptions();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: ValidationErrors; message?: string } } };
      const errs = ax.response?.data?.errors ?? {};
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
      } else {
        setFormGenError(ax.response?.data?.message ?? t('Something went wrong. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setFieldErrors({});
    setFormGenError('');
    try {
      await api.put(`/user-subscriptions/${editingId}`, buildPayload(form));
      showPageMsg('success', t('Subscription updated successfully.'));
      goToList();
      await fetchSubscriptions();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { errors?: ValidationErrors; message?: string } } };
      const errs = ax.response?.data?.errors ?? {};
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
      } else {
        setFormGenError(ax.response?.data?.message ?? t('Something went wrong. Please try again.'));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!editingId) return;
    setDeleting(true);
    try {
      await api.delete(`/user-subscriptions/${editingId}`);
      showPageMsg('success', t('Subscription deleted successfully.'));
      goToList();
      await fetchSubscriptions();
    } catch {
      setFormGenError(t('Could not delete subscription. Please try again.'));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  // ─── Shared form UI ───────────────────────────────────────────────────────

  const renderForm = (isEdit: boolean): React.ReactNode => (
    <form onSubmit={isEdit ? handleUpdate : handleCreate} noValidate>
      {formGenError && (
        <div className="alert" style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#EF4444', fontSize: 14,
        }}>
          {formGenError}
        </div>
      )}

      {/* Service Name */}
      <div className="personal-name mb-3">
        <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('Service Name')} *</label>
        <input
          type="text"
          className="form-control"
          placeholder={t('Enter service name (e.g. Netflix, Spotify)')}
          value={form.service_name}
          onChange={e => updateForm({ service_name: e.target.value })}
          maxLength={255}
          style={{ marginTop: 6 }}
        />
        <FieldError errors={fieldErrors} field="service_name" />
      </div>

      {/* Amount + Currency row */}
      <div className="personal-name mb-3">
        <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('Amount')} *</label>
        <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
          <input
            type="number"
            className="form-control"
            placeholder="0"
            min="0.01"
            step="any"
            value={form.amount}
            onChange={e => updateForm({ amount: e.target.value })}
            style={{ flex: 1 }}
          />
          <select
            className="form-control"
            value={form.currency}
            onChange={e => updateForm({ currency: e.target.value as 'VND' | 'USD' })}
            style={{ width: 90, flex: 'none' }}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <FieldError errors={fieldErrors} field="amount" />
        <FieldError errors={fieldErrors} field="currency" />
      </div>

      {/* Billing Cycle */}
      <div className="personal-name mb-3">
        <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('Billing Cycle')} *</label>
        <select
          className="form-control"
          value={form.billing_cycle}
          onChange={e => updateForm({ billing_cycle: e.target.value as SubscriptionForm['billing_cycle'] })}
          style={{ marginTop: 6 }}
        >
          <option value="WEEKLY">{t('Weekly')}</option>
          <option value="MONTHLY">{t('Monthly')}</option>
          <option value="YEARLY">{t('Yearly')}</option>
        </select>
        <FieldError errors={fieldErrors} field="billing_cycle" />
      </div>

      {/* Next Billing Date */}
      <div className="personal-name mb-3">
        <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('Next Billing Date')} *</label>
        <input
          type="date"
          className="form-control"
          value={form.next_billing_date}
          onChange={e => updateForm({ next_billing_date: e.target.value })}
          style={{ marginTop: 6 }}
        />
        <FieldError errors={fieldErrors} field="next_billing_date" />
      </div>

      {/* Trial toggle */}
      <div className="personal-name mb-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <label style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 0 }}>{t('This is a free trial')}</label>
        <div
          onClick={() => updateForm({ is_trial: !form.is_trial })}
          style={{
            width: 44, height: 24, borderRadius: 12,
            background: form.is_trial ? 'var(--primary-color, #7B51F1)' : 'var(--border-color, #E8E8E8)',
            cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <div style={{
            position: 'absolute', top: 2,
            left: form.is_trial ? 22 : 2,
            width: 20, height: 20, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>

      {/* ── Reminder section ── */}
      <div style={{
        borderTop: '1px solid var(--border-color, #E8E8E8)',
        paddingTop: 16, marginTop: 8, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <p style={{ fontWeight: 600, fontSize: 15, margin: 0, color: 'var(--text-color)' }}>{t('Reminder')}</p>
            <p style={{ fontSize: 12, color: 'var(--sub-text-color)', margin: 0 }}>{t('Remind me before automatic renewal')}</p>
          </div>
          <div
            onClick={() => updateForm({ reminder_enabled: !form.reminder_enabled })}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: form.reminder_enabled ? 'var(--primary-color, #7B51F1)' : 'var(--border-color, #E8E8E8)',
              cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2,
              left: form.reminder_enabled ? 22 : 2,
              width: 20, height: 20, borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {form.reminder_enabled && (
          <>
            {/* Remind before N days */}
            <div className="personal-name mb-3">
              <label style={{ color: 'var(--sub-text-color)', fontSize: 13 }}>{t('Remind me')}</label>
              <select
                className="form-control"
                value={form.remind_before_days}
                onChange={e => updateForm({ remind_before_days: parseInt(e.target.value, 10) })}
                style={{ marginTop: 6 }}
              >
                {REMIND_OPTIONS.map(d => (
                  <option key={d} value={d}>{d} {t('days before renewal')}</option>
                ))}
              </select>
            </div>

            {/* Notification channels */}
            <div className="personal-name mb-2">
              <label style={{ color: 'var(--sub-text-color)', fontSize: 13, marginBottom: 10, display: 'block' }}>{t('Notify via')}</label>
              {/* Email */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 10 }}>
                <input
                  type="checkbox"
                  checked={form.channels_email}
                  onChange={e => updateForm({ channels_email: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary-color, #7B51F1)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: 'var(--text-color)' }}>✉ {t('Notify via email')}</span>
              </label>
              {/* Push */}
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.channels_push}
                  onChange={e => updateForm({ channels_push: e.target.checked })}
                  style={{ width: 18, height: 18, accentColor: 'var(--primary-color, #7B51F1)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: 14, color: 'var(--text-color)' }}>🔔 {t('Notify via app notification')}</span>
              </label>
            </div>
          </>
        )}
      </div>

      {/* Submit button */}
      <button
        type="submit"
        disabled={saving}
        className="btn-check-primary w-100"
        style={{
          background: 'var(--primary-color, #7B51F1)', color: '#fff',
          border: 'none', borderRadius: 12, padding: '14px 0',
          fontWeight: 700, fontSize: 16, cursor: saving ? 'not-allowed' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving
          ? t('Saving…')
          : isEdit ? t('Update Subscription') : t('Create Subscription')
        }
      </button>

      {/* Delete (edit only) */}
      {isEdit && !confirmDelete && (
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          style={{
            width: '100%', marginTop: 12, padding: '12px 0',
            border: '1.5px solid #EF4444', borderRadius: 12,
            background: 'transparent', color: '#EF4444',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}
        >
          {t('Delete Subscription')}
        </button>
      )}

      {/* Confirm delete */}
      {isEdit && confirmDelete && (
        <div style={{
          marginTop: 12, background: 'rgba(239,68,68,0.07)',
          border: '1.5px solid rgba(239,68,68,0.3)',
          borderRadius: 12, padding: 16,
        }}>
          <p style={{ fontWeight: 600, color: '#EF4444', margin: '0 0 6px' }}>{t('Delete Subscription')}</p>
          <p style={{ fontSize: 13, color: 'var(--sub-text-color)', margin: '0 0 14px' }}>
            {t('Are you sure you want to delete this subscription? This action cannot be undone.')}
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              style={{
                flex: 1, padding: '10px 0', border: '1px solid var(--border-color, #E8E8E8)',
                borderRadius: 10, background: 'var(--sub-bg-color)', color: 'var(--text-color)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              {t('Cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              style={{
                flex: 1, padding: '10px 0', border: 'none',
                borderRadius: 10, background: '#EF4444', color: '#fff',
                fontWeight: 600, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer',
                opacity: deleting ? 0.7 : 1,
              }}
            >
              {deleting ? t('Deleting…') : t('Delete')}
            </button>
          </div>
        </div>
      )}
    </form>
  );

  // ─── Subscription list item ───────────────────────────────────────────────

  const renderItem = (sub: UserSubscription): React.ReactNode => {
    const color  = serviceColor(sub.service_name);
    const days   = getDaysUntil(sub.next_billing_date);
    const isActive = sub.status === 'ACTIVE';

    return (
      <div key={sub.id} className="send-money-contact-tab p-0 mt-16" style={{ alignItems: 'center' }}>
        {/* Avatar */}
        <div className="contact-profile" style={{
          background: `${color}22`, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          borderRadius: 12, flexShrink: 0,
        }}>
          <span style={{ fontSize: 22, fontWeight: 700, color }}>{serviceInitial(sub.service_name)}</span>
        </div>

        {/* Details */}
        <div className="contact-details" style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ marginBottom: 2 }}>
            {sub.service_name}
            {sub.is_trial && (
              <span style={{
                marginLeft: 6, fontSize: 10, fontWeight: 700,
                background: 'rgba(59,130,246,0.12)', color: '#3B82F6',
                borderRadius: 4, padding: '1px 6px', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                {t('Trial')}
              </span>
            )}
          </h3>
          <h4 style={{ fontSize: 12, color: 'var(--sub-text-color)', margin: 0 }}>
            {formatAmount(sub.amount, sub.currency)} · {t(sub.billing_cycle.charAt(0) + sub.billing_cycle.slice(1).toLowerCase())}
          </h4>
          <h4 style={{ fontSize: 11, margin: '2px 0 0', color: isActive && days <= 7 ? '#F97316' : 'var(--sub-text-color)' }}>
            {isActive
              ? days === 0
                ? t('Renews today')
                : days < 0
                  ? t('Overdue by {{n}} days', { n: Math.abs(days) })
                  : t('Renews in {{n}} days', { n: days })
              : `${t('Expired on')} ${formatDate(sub.next_billing_date)}`
            }
          </h4>
        </div>

        {/* Actions */}
        <div className="contact-star">
          <div className="star-favourite" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isActive && (
              <button
                type="button"
                onClick={() => openEdit(sub)}
                style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
                aria-label={t('Edit')}
              >
                <img src={EditIcon} alt="edit" className="purple-edit-icon" />
              </button>
            )}
            <button
              type="button"
              onClick={() => openHistory(sub)}
              style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}
              aria-label={t('Payment History')}
            >
              <img src={ExpiredIcon} alt="history" style={{ opacity: 0.6 }} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Payment history view ─────────────────────────────────────────────────

  const renderHistory = (): React.ReactNode => (
    <>
      {/* Header */}
      <div className="verify-number-top">
        <div className="container">
          <div className="verify-number-top-content">
            <div className="back-btn">
              <button type="button" onClick={goToList} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={faqPlus} alt="back" style={{ transform: 'rotate(180deg) scale(0.8)', opacity: 0.7 }} />
              </button>
            </div>
            <div className="header-title">
              <p>{t('Payment History')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="verify-number-bottom">
        <div className="verify-number-bottom-wrap">
          <div className="verify-number-content">
            {historySubscription && (
              <div style={{
                background: `${serviceColor(historySubscription.service_name)}11`,
                border: `1px solid ${serviceColor(historySubscription.service_name)}33`,
                borderRadius: 14, padding: '14px 16px', marginBottom: 20,
              }}>
                <p style={{ fontWeight: 700, fontSize: 17, margin: '0 0 2px', color: 'var(--text-color)' }}>
                  {historySubscription.service_name}
                </p>
                <p style={{ fontSize: 13, color: 'var(--sub-text-color)', margin: 0 }}>
                  {formatAmount(historySubscription.amount, historySubscription.currency)} · {t(historySubscription.billing_cycle.charAt(0) + historySubscription.billing_cycle.slice(1).toLowerCase())}
                </p>
              </div>
            )}

            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--sub-text-color)' }}>
                {t('Loading…')}
              </div>
            ) : history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)', marginBottom: 6 }}>
                  {t('No payment records yet')}
                </p>
                <p style={{ fontSize: 13, color: 'var(--sub-text-color)' }}>
                  {t('Payment history will appear here after renewals are processed.')}
                </p>
              </div>
            ) : history.map(item => (
              <div key={item.id} className="send-money-contact-tab p-0 mt-16" style={{ alignItems: 'flex-start' }}>
                <div className="contact-profile" style={{
                  background: item.status === 'SUCCESS' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, flexShrink: 0,
                }}>
                  <span style={{ fontSize: 22 }}>{item.status === 'SUCCESS' ? '✓' : '✕'}</span>
                </div>
                <div className="contact-details" style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ marginBottom: 2 }}>
                    {formatAmount(item.amount_paid, item.currency)}
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontWeight: 700, borderRadius: 4,
                      padding: '1px 7px', letterSpacing: 0.5,
                      background: item.status === 'SUCCESS' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                      color: item.status === 'SUCCESS' ? '#10B981' : '#EF4444',
                    }}>
                      {item.status}
                    </span>
                  </h3>
                  <h4 style={{ fontSize: 12, color: 'var(--sub-text-color)', margin: 0 }}>
                    {formatDate(item.payment_date)}
                  </h4>
                  {item.transaction_code && (
                    <h4 style={{ fontSize: 11, color: 'var(--sub-text-color)', margin: '2px 0 0' }}>
                      #{item.transaction_code}
                    </h4>
                  )}
                  {item.failure_reason && (
                    <p style={{ fontSize: 12, color: '#EF4444', margin: '4px 0 0' }}>
                      {item.failure_reason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  // ─── Form views (add / edit) ──────────────────────────────────────────────

  const renderFormView = (isEdit: boolean): React.ReactNode => (
    <>
      <div className="verify-number-top">
        <div className="container">
          <div className="verify-number-top-content">
            <div className="back-btn">
              <button type="button" onClick={goToList} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                <img src={faqPlus} alt="back" style={{ transform: 'rotate(180deg) scale(0.8)', opacity: 0.7 }} />
              </button>
            </div>
            <div className="header-title">
              <p>{isEdit ? t('Edit Subscription') : t('Add Subscription')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="verify-number-bottom">
        <div className="verify-number-bottom-wrap">
          <div className="verify-number-content" style={{ paddingBottom: 32 }}>
            {renderForm(isEdit)}
          </div>
        </div>
      </div>
    </>
  );

  // ─── List view ────────────────────────────────────────────────────────────

  const renderList = (): React.ReactNode => (
    <>
      <div className="verify-number-top">
        <div className="container">
          <div className="verify-number-top-content">
            <div className="back-btn"><BackBtn /></div>
            <div className="header-title"><p>{t('Subscriptions')}</p></div>
          </div>

          {/* Search bar */}
          <div className="contact-search">
            <div className="input-group contact-searchbar">
              <div className="search-icon"><img src={SearchIcon} alt="search-icon" /></div>
              <div className="seach-bar">
                <input
                  type="search"
                  placeholder={t('Search')}
                  className="form-control search-text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Sort + Add row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 0' }}>
            {/* Sort dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowSort(s => !s)}
                style={{
                  background: 'var(--sub-bg-color)', border: '1px solid var(--border-color, #E8E8E8)',
                  borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer',
                  color: 'var(--sub-text-color)', display: 'flex', gap: 6, alignItems: 'center',
                }}
              >
                {t('Sort')} ▾
              </button>
              {showSort && (
                <div style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 50,
                  background: 'var(--bg-color, #fff)', border: '1px solid var(--border-color, #E8E8E8)',
                  borderRadius: 10, minWidth: 200, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                }}>
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => { setSortKey(opt.value); setShowSort(false); }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', background: 'none', border: 'none',
                        fontSize: 14, cursor: 'pointer',
                        color: sortKey === opt.value ? 'var(--primary-color, #7B51F1)' : 'var(--text-color)',
                        fontWeight: sortKey === opt.value ? 600 : 400,
                      }}
                    >
                      {t(opt.label)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Add button */}
            <button
              type="button"
              onClick={openAdd}
              style={{
                background: 'var(--primary-color, #7B51F1)', color: '#fff',
                border: 'none', borderRadius: 8, padding: '6px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <img src={faqPlus} alt="add" style={{ width: 14, height: 14, filter: 'brightness(10)' }} />
              {t('Add Subscription')}
            </button>
          </div>

          {/* Tabs */}
          <div className="nav nav-tabs custom-tab-contact" id="nav-tab" role="tablist" style={{ marginTop: 12 }}>
            <button
              className={`nav-link ${activeTab === 'active' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab('active')}
            >
              {t('Active')}
              {subscriptions.filter(s => s.status === 'ACTIVE').length > 0 && (
                <span style={{
                  marginLeft: 6, fontSize: 11, fontWeight: 700,
                  background: 'var(--primary-color, #7B51F1)', color: '#fff',
                  borderRadius: 10, padding: '1px 7px',
                }}>
                  {subscriptions.filter(s => s.status === 'ACTIVE').length}
                </span>
              )}
            </button>
            <button
              className={`nav-link ${activeTab === 'expired' ? 'active' : ''}`}
              type="button"
              onClick={() => setActiveTab('expired')}
            >
              {t('Expired')}
            </button>
          </div>
        </div>
      </div>

      {/* Page-level messages */}
      {pageMsg && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, maxWidth: 340, width: '90%',
          background: pageMsg.type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
          color: '#fff', borderRadius: 12, padding: '12px 20px',
          fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          textAlign: 'center',
        }}>
          {pageMsg.text}
        </div>
      )}

      <div className="verify-number-bottom" id="send-money-contact">
        <div className="verify-number-bottom-wrap">
          <div className="send-contact-favourite">
            <div className="favourite-list">
              <div style={{ padding: '0 0 24px' }}>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: 50, color: 'var(--sub-text-color)' }}>
                    {t('Loading…')}
                  </div>
                ) : errorMsg ? (
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <p style={{ color: '#EF4444', marginBottom: 12 }}>{errorMsg}</p>
                    <button
                      type="button"
                      onClick={() => void fetchSubscriptions()}
                      style={{
                        background: 'var(--primary-color, #7B51F1)', color: '#fff',
                        border: 'none', borderRadius: 10, padding: '10px 20px',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      {t('Try Again')}
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 50 }}>
                    <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
                    <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-color)', marginBottom: 6 }}>
                      {t('No subscriptions found')}
                    </p>
                    <p style={{ fontSize: 13, color: 'var(--sub-text-color)', marginBottom: 20 }}>
                      {activeTab === 'active'
                        ? t('Create your first subscription to start tracking recurring payments.')
                        : t('No expired subscriptions.')
                      }
                    </p>
                    {activeTab === 'active' && (
                      <button
                        type="button"
                        onClick={openAdd}
                        style={{
                          background: 'var(--primary-color, #7B51F1)', color: '#fff',
                          border: 'none', borderRadius: 10, padding: '12px 24px',
                          fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        {t('Add Subscription')}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="send-money-contact">
                    {filtered.map(sub => renderItem(sub))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="site-content">
        <div className="verify-number-main" id="subscription-main">
          {view === 'list'    && renderList()}
          {view === 'add'     && renderFormView(false)}
          {view === 'edit'    && renderFormView(true)}
          {view === 'history' && renderHistory()}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManagement;
