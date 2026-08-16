import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';

export interface SubscriptionReminder {
  id?: number;
  is_enabled: boolean;
  remind_before_days: number;
  channels: string[];
}
export interface UserSubscription {
  id: number;
  service_name: string;
  amount: string;
  currency: string;
  billing_cycle: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  next_billing_date: string;
  is_trial: boolean;
  status: 'ACTIVE' | 'EXPIRED';
  reminder: SubscriptionReminder | null;
}
export interface PaymentHistoryItem {
  id: number;
  amount_paid: string;
  currency: string;
  payment_date: string;
  status: 'SUCCESS' | 'FAILED';
  failure_reason: string | null;
  transaction_code: string | null;
}
export interface SubscriptionForm {
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
export interface SubscriptionValidationErrors { [field: string]: string[] }
export interface SubscriptionPageMessage { type: 'success' | 'error'; text: string }
export type SubscriptionPageView = 'list' | 'add' | 'edit' | 'history';
export type SubscriptionActiveTab = 'active' | 'expired';
export type SubscriptionSortKey =
  | 'next_billing_date_asc' | 'next_billing_date_desc'
  | 'amount_high' | 'amount_low' | 'name_asc';

export const EMPTY_SUBSCRIPTION_FORM: SubscriptionForm = {
  service_name: '', amount: '', currency: 'VND', billing_cycle: 'MONTHLY',
  next_billing_date: '', is_trial: false, reminder_enabled: false,
  remind_before_days: 3, channels_email: true, channels_push: false,
};

export function useSubscriptionManagement() {
  const { t } = useTranslation();
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<SubscriptionActiveTab>('active');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SubscriptionSortKey>('next_billing_date_asc');
  const [showSort, setShowSort] = useState(false);
  const [view, setView] = useState<SubscriptionPageView>('list');
  const [pageMsg, setPageMsg] = useState<SubscriptionPageMessage | null>(null);
  const [form, setForm] = useState<SubscriptionForm>(EMPTY_SUBSCRIPTION_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [historyId, setHistoryId] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<SubscriptionValidationErrors>({});
  const [formGenError, setFormGenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [historySubscription, setHistorySub] = useState<UserSubscription | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchSubscriptions = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/user-subscriptions');
      setSubscriptions(response.data.subscriptions ?? []);
    } catch {
      setErrorMsg(t('Unable to load subscriptions. Please try again.'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { void fetchSubscriptions(); }, [fetchSubscriptions]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = subscriptions.filter((subscription) =>
      (activeTab === 'active' ? subscription.status === 'ACTIVE' : subscription.status === 'EXPIRED') &&
      (!query || subscription.service_name.toLowerCase().includes(query)));
    return [...list].sort((a, b) => {
      switch (sortKey) {
        case 'next_billing_date_asc': return a.next_billing_date.localeCompare(b.next_billing_date);
        case 'next_billing_date_desc': return b.next_billing_date.localeCompare(a.next_billing_date);
        case 'amount_high': return parseFloat(b.amount) - parseFloat(a.amount);
        case 'amount_low': return parseFloat(a.amount) - parseFloat(b.amount);
        case 'name_asc': return a.service_name.localeCompare(b.service_name);
        default: return 0;
      }
    });
  }, [subscriptions, activeTab, search, sortKey]);

  const showPageMsg = useCallback((type: SubscriptionPageMessage['type'], text: string) => {
    setPageMsg({ type, text });
    window.setTimeout(() => setPageMsg(null), 4000);
  }, []);
  const updateForm = useCallback((patch: Partial<SubscriptionForm>) => setForm((current) => ({ ...current, ...patch })), []);
  const goToList = useCallback(() => {
    setView('list'); setEditingId(null); setForm(EMPTY_SUBSCRIPTION_FORM);
    setFieldErrors({}); setFormGenError(''); setConfirmDelete(false);
  }, []);
  const openAdd = useCallback(() => {
    setForm(EMPTY_SUBSCRIPTION_FORM); setFieldErrors({}); setFormGenError('');
    setEditingId(null); setView('add');
  }, []);
  const openEdit = useCallback(async (subscription: UserSubscription) => {
    setFieldErrors({}); setFormGenError(''); setConfirmDelete(false); setEditingId(subscription.id);
    const reminder = subscription.reminder;
    setForm({
      service_name: subscription.service_name, amount: subscription.amount,
      currency: subscription.currency as 'VND' | 'USD', billing_cycle: subscription.billing_cycle,
      next_billing_date: subscription.next_billing_date, is_trial: subscription.is_trial,
      reminder_enabled: reminder?.is_enabled ?? false,
      remind_before_days: reminder?.remind_before_days ?? 3,
      channels_email: reminder?.channels?.includes('email') ?? true,
      channels_push: reminder?.channels?.includes('push') ?? false,
    });
    setView('edit');
  }, []);
  const openHistory = useCallback(async (subscription: UserSubscription) => {
    setHistoryId(subscription.id); setHistorySub(subscription); setHistoryLoading(true); setView('history');
    try {
      const response = await api.get(`/user-subscriptions/${subscription.id}/payment-history`);
      setHistory(response.data.history ?? []);
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  }, []);

  const buildPayload = (value: SubscriptionForm) => ({
    service_name: value.service_name, amount: parseFloat(value.amount),
    currency: value.currency, billing_cycle: value.billing_cycle,
    next_billing_date: value.next_billing_date, is_trial: value.is_trial,
    reminder: value.reminder_enabled
      ? { is_enabled: true, remind_before_days: value.remind_before_days,
          channels: [...(value.channels_email ? ['email'] : []), ...(value.channels_push ? ['push'] : [])] }
      : { is_enabled: false, remind_before_days: value.remind_before_days, channels: [] },
  });
  const save = useCallback(async (event: React.FormEvent, mode: 'create' | 'update') => {
    event.preventDefault(); setSaving(true); setFieldErrors({}); setFormGenError('');
    try {
      const payload = buildPayload(form);
      if (mode === 'create') await api.post('/user-subscriptions', payload);
      else if (editingId) await api.put(`/user-subscriptions/${editingId}`, payload);
      showPageMsg('success', t(mode === 'create' ? 'Subscription created successfully.' : 'Subscription updated successfully.'));
      goToList(); await fetchSubscriptions();
    } catch (error: unknown) {
      const data = (error as { response?: { data?: { errors?: SubscriptionValidationErrors; message?: string } } }).response?.data;
      if (data?.errors && Object.keys(data.errors).length) setFieldErrors(data.errors);
      else setFormGenError(data?.message ?? t('Something went wrong. Please try again.'));
    } finally { setSaving(false); }
  }, [editingId, fetchSubscriptions, form, goToList, showPageMsg, t]);
  const handleCreate = useCallback((event: React.FormEvent) => save(event, 'create'), [save]);
  const handleUpdate = useCallback((event: React.FormEvent) => {
    if (!editingId) return Promise.resolve();
    return save(event, 'update');
  }, [editingId, save]);
  const handleDelete = useCallback(async () => {
    if (!editingId) return;
    setDeleting(true);
    try {
      await api.delete(`/user-subscriptions/${editingId}`);
      showPageMsg('success', t('Subscription deleted successfully.'));
      goToList(); await fetchSubscriptions();
    } catch { setFormGenError(t('Could not delete subscription. Please try again.')); }
    finally { setDeleting(false); setConfirmDelete(false); }
  }, [editingId, fetchSubscriptions, goToList, showPageMsg, t]);

  return {
    t, subscriptions, loading, errorMsg, activeTab, setActiveTab, search, setSearch,
    sortKey, setSortKey, showSort, setShowSort, view, pageMsg, form, editingId,
    historyId, fieldErrors, formGenError, saving, confirmDelete, setConfirmDelete,
    deleting, history, historySubscription, historyLoading, filtered, fetchSubscriptions,
    updateForm, goToList, openAdd, openEdit, openHistory, handleCreate, handleUpdate,
    handleDelete,
  };
}