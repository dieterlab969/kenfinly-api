import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { formatCurrency } from '../constants/categories';

export interface WalletAccount {
  id: number;
  name: string;
  balance: string | number;
  currency: string;
  icon: string | null;
  color: string | null;
  bank_name?: string | null;
  account_type?: string;
  transactions_count?: number;
}

export interface WalletCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string | null;
}

export interface CreateWalletPayload {
  name: string;
  currency: string;
  initialBalance: number;
  icon: string;
  color: string;
}

export interface UpdateWalletPayload {
  name: string;
  currency: string;
  icon: string;
  color: string;
}

export interface AdjustBalanceForm {
  targetBalance: string;
  categoryId: string;
  notes: string;
}

export interface WalletValidationErrors {
  [field: string]: string[];
}

export interface WalletPageMessage {
  type: 'success' | 'error';
  text: string;
}

export type WalletPageView = 'list' | 'add' | 'edit' | 'adjust';

export const EMPTY_CREATE: CreateWalletPayload = {
  name: '', currency: 'VND', initialBalance: 0, icon: '💰', color: '#00A266',
};
export const EMPTY_EDIT: UpdateWalletPayload = {
  name: '', currency: 'VND', icon: '💰', color: '#00A266',
};
export const EMPTY_ADJUST: AdjustBalanceForm = {
  targetBalance: '', categoryId: '', notes: 'Balance adjustment',
};

export function walletNumber(value: string | number | null | undefined): number {
  const number = typeof value === 'number' ? value : Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function sortAccounts(accounts: WalletAccount[], key: string): WalletAccount[] {
  const sorted = [...accounts];
  switch (key) {
    case 'name_asc': return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name_desc': return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'balance_desc': return sorted.sort((a, b) => walletNumber(b.balance) - walletNumber(a.balance));
    case 'balance_asc': return sorted.sort((a, b) => walletNumber(a.balance) - walletNumber(b.balance));
    case 'txn_desc': return sorted.sort((a, b) => (b.transactions_count ?? 0) - (a.transactions_count ?? 0));
    default: return sorted;
  }
}

export function useWalletManagement() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [categories, setCategories] = useState<WalletCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState('name_asc');
  const [view, setView] = useState<WalletPageView>('list');
  const [pageMsg, setPageMsg] = useState<WalletPageMessage | null>(null);
  const [editingAccount, setEditingAccount] = useState<WalletAccount | null>(null);
  const [adjustingAccount, setAdjustingAccount] = useState<WalletAccount | null>(null);
  const [createForm, setCreateForm] = useState<CreateWalletPayload>(EMPTY_CREATE);
  const [editForm, setEditForm] = useState<UpdateWalletPayload>(EMPTY_EDIT);
  const [adjustForm, setAdjustForm] = useState<AdjustBalanceForm>(EMPTY_ADJUST);
  const [formErrors, setFormErrors] = useState<WalletValidationErrors>({});
  const [formGenError, setFormGenError] = useState('');
  const [saving, setSaving] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustGenError, setAdjustGenError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchAccounts = useCallback(async (): Promise<void> => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await api.get('/accounts');
      setAccounts(response.data.accounts ?? []);
    } catch {
      setErrorMsg('Unable to load accounts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async (): Promise<void> => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data.categories ?? response.data.data ?? []);
    } catch {
      // Categories are only required by the adjust-balance use case.
    }
  }, []);

  useEffect(() => {
    void fetchAccounts();
    void fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  const displayed = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? accounts.filter((account) =>
          account.name.toLowerCase().includes(query) ||
          (account.bank_name ?? '').toLowerCase().includes(query) ||
          (account.account_type ?? '').toLowerCase().includes(query))
      : accounts;
    return sortAccounts(filtered, sortKey);
  }, [accounts, search, sortKey]);

  const totals = useMemo<[string, number][]>(() => {
    const byCurrency: Record<string, number> = {};
    accounts.forEach((account) => {
      const currency = account.currency || 'VND';
      byCurrency[currency] = (byCurrency[currency] ?? 0) + walletNumber(account.balance);
    });
    return Object.entries(byCurrency);
  }, [accounts]);

  const adjustDiff = useMemo(() => {
    if (!adjustingAccount) return 0;
    const target = parseFloat(adjustForm.targetBalance);
    return Number.isFinite(target) ? target - walletNumber(adjustingAccount.balance) : 0;
  }, [adjustingAccount, adjustForm.targetBalance]);

  const relevantCategories = useMemo(
    () => adjustingAccount
      ? categories.filter((category) => category.type === (adjustDiff >= 0 ? 'income' : 'expense'))
      : [],
    [adjustingAccount, adjustDiff, categories],
  );

  const showPageMsg = useCallback((type: WalletPageMessage['type'], text: string): void => {
    setPageMsg({ type, text });
    window.setTimeout(() => setPageMsg(null), 4000);
  }, []);

  const goToList = useCallback((): void => {
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
  }, []);

  const openAdd = useCallback((): void => {
    setEditingAccount(null);
    setCreateForm(EMPTY_CREATE);
    setFormErrors({});
    setFormGenError('');
    setView('add');
  }, []);

  const openEdit = useCallback((account: WalletAccount): void => {
    setEditingAccount(account);
    setEditForm({
      name: account.name, currency: account.currency,
      icon: account.icon ?? '💰', color: account.color ?? '#00A266',
    });
    setFormErrors({});
    setFormGenError('');
    setView('edit');
  }, []);

  const openAdjust = useCallback((account: WalletAccount): void => {
    setAdjustingAccount(account);
    setAdjustForm({
      targetBalance: String(walletNumber(account.balance)),
      categoryId: '', notes: 'Balance adjustment',
    });
    setAdjustGenError('');
    setView('adjust');
  }, []);

  const handleCreate = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      await api.post('/accounts', {
        name: createForm.name, balance: createForm.initialBalance,
        currency: createForm.currency, icon: createForm.icon, color: createForm.color,
      });
      showPageMsg('success', `"${createForm.name}" created successfully.`);
      goToList();
      await fetchAccounts();
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { errors?: WalletValidationErrors; message?: string } } }).response;
      const errors = response?.data?.errors ?? {};
      if (Object.keys(errors).length) setFormErrors(errors);
      else setFormGenError(response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [createForm, fetchAccounts, goToList, showPageMsg]);

  const handleUpdate = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!editingAccount) return;
    setSaving(true);
    setFormErrors({});
    setFormGenError('');
    try {
      await api.put(`/accounts/${editingAccount.id}`, editForm);
      showPageMsg('success', `"${editForm.name}" updated successfully.`);
      goToList();
      await fetchAccounts();
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { errors?: WalletValidationErrors; message?: string } } }).response;
      const errors = response?.data?.errors ?? {};
      if (Object.keys(errors).length) setFormErrors(errors);
      else setFormGenError(response?.data?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [editForm, editingAccount, fetchAccounts, goToList, showPageMsg]);

  const handleAdjust = useCallback(async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!adjustingAccount) return;
    setAdjustGenError('');
    const target = parseFloat(adjustForm.targetBalance);
    const current = walletNumber(adjustingAccount.balance);
    if (!Number.isFinite(target)) return setAdjustGenError('Please enter a valid target balance.');
    if (!adjustForm.categoryId) return setAdjustGenError('Please select a category for the adjustment transaction.');
    const diff = target - current;
    if (Math.abs(diff) < 0.01) {
      return setAdjustGenError('The target balance is the same as the current balance. No adjustment needed.');
    }
    setAdjusting(true);
    try {
      await api.post('/transactions', {
        account_id: adjustingAccount.id,
        category_id: parseInt(adjustForm.categoryId, 10),
        type: diff > 0 ? 'income' : 'expense',
        amount: Math.abs(diff),
        transaction_date: new Date().toISOString().split('T')[0],
        notes: adjustForm.notes || 'Balance adjustment',
      });
      showPageMsg('success', `Balance adjusted from ${formatCurrency(current, adjustingAccount.currency)} → ${formatCurrency(target, adjustingAccount.currency)}.`);
      goToList();
      await fetchAccounts();
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { errors?: WalletValidationErrors; message?: string } } }).response;
      const firstError = Object.values(response?.data?.errors ?? {})[0]?.[0];
      setAdjustGenError(firstError ?? response?.data?.message ?? 'Adjustment failed. Please try again.');
    } finally {
      setAdjusting(false);
    }
  }, [adjustForm, adjustingAccount, fetchAccounts, goToList, showPageMsg]);

  const handleDelete = useCallback(async (id: number): Promise<void> => {
    setDeleting(true);
    setDeleteError('');
    try {
      await api.delete(`/accounts/${id}`);
      setConfirmDeleteId(null);
      await fetchAccounts();
      showPageMsg('success', 'Account deleted successfully.');
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      setDeleteError(response?.data?.message ?? 'Could not delete this account.');
    } finally {
      setDeleting(false);
    }
  }, [fetchAccounts, showPageMsg]);

  return {
    t, accounts, categories, loading, errorMsg, search, setSearch, sortKey, setSortKey,
    view, pageMsg, editingAccount, adjustingAccount, createForm, setCreateForm,
    editForm, setEditForm, adjustForm, setAdjustForm, formErrors, formGenError,
    saving, adjusting, adjustGenError, confirmDeleteId, setConfirmDeleteId, deleting,
    deleteError, setDeleteError, displayed, totals, adjustDiff, relevantCategories, fetchAccounts,
    goToList, openAdd, openEdit, openAdjust, handleCreate, handleUpdate, handleAdjust,
    handleDelete,
  };
}