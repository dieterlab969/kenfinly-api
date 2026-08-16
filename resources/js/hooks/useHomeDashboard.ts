import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { processImageForUpload, validateImageFile, formatFileSize } from '../utils/imageCompression';

export type HomeTransactionType = 'income' | 'expense';
export type HomeAmount = string | number | null | undefined;
export interface HomeUser { id?: number; name?: string; email?: string }
export interface HomeAccount { id: number; name: string; balance: HomeAmount; currency?: string; icon?: string | null; color?: string | null }
export interface HomeCategory { id: number; name: string; slug?: string | null; icon?: string | null; color?: string | null; type?: HomeTransactionType; children?: HomeCategory[] }
export interface HomeDashboardData {
  monthly_summary?: { current?: { month?: string; income?: HomeAmount; expense?: HomeAmount; net?: HomeAmount }; previous?: { month?: string; income?: HomeAmount; expense?: HomeAmount; net?: HomeAmount } };
  seven_day_expenses?: { date: string; total: HomeAmount }[];
  balance_history?: { date: string; balance: HomeAmount }[];
  recent_transactions?: unknown[];
  accounts?: HomeAccount[];
}

function errorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string });
  const validation = response.response?.data?.errors ? Object.values(response.response.data.errors).flat()[0] : undefined;
  return response.response?.data?.message || validation || response.message || fallback;
}
function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function useHomeDashboard() {
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState<HomeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<HomeUser | null>(() => {
    try { const value = localStorage.getItem('user'); return value ? JSON.parse(value) : null; } catch { return null; }
  });
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState<HomeTransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [accountId, setAccountId] = useState('');
  const [transactionDate, setTransactionDate] = useState(todayKey());
  const [note, setNote] = useState('');
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [accounts, setAccounts] = useState<HomeAccount[]>([]);
  const [formLoading, setFormLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [compressionStatus, setCompressionStatus] = useState('');

  const fetchDashboardData = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError('');
      const response = await api.get('/dashboard');
      setDashboardData(response.data.data ?? null);
    } catch (value) {
      setError(errorMessage(value, t('Could not load dashboard data.')));
    } finally { if (showLoading) setLoading(false); }
  }, [t]);
  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/auth/me');
      const nextUser = response.data.user as HomeUser | undefined;
      if (nextUser) { setUser(nextUser); localStorage.setItem('user', JSON.stringify(nextUser)); }
    } catch (value) { console.error('Failed to fetch user:', value); }
  }, []);
  const loadQuickAddOptions = useCallback(async (type: HomeTransactionType) => {
    try {
      setFormLoading(true); setFormError('');
      const [categoryResponse, accountResponse] = await Promise.all([api.get(`/categories?type=${type}`), api.get('/accounts')]);
      const nextCategories = categoryResponse.data.categories ?? [];
      const nextAccounts = accountResponse.data.accounts ?? [];
      setCategories(nextCategories); setAccounts(nextAccounts);
      setAccountId((current) => current || String(nextAccounts[0]?.id ?? ''));
    } catch (value) {
      setFormError(errorMessage(value, t('Could not load categories or accounts.')));
    } finally { setFormLoading(false); }
  }, [t]);
  useEffect(() => { void fetchDashboardData(); void fetchUser(); }, [fetchDashboardData, fetchUser]);
  useEffect(() => {
    if (showModal) { setCategory(''); void loadQuickAddOptions(transactionType); }
  }, [loadQuickAddOptions, showModal, transactionType]);

  const openQuickAdd = useCallback((type: HomeTransactionType) => {
    setTransactionType(type); setShowModal(true); setAmount(''); setCategory(''); setNote('');
    setTransactionDate(todayKey()); setFormError(''); setReceipt(null); setReceiptPreview(null); setCompressionStatus('');
  }, []);
  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    const validation = validateImageFile(file);
    if (!validation.valid) { setFormError(validation.error ?? t('Invalid file.')); event.target.value = ''; return; }
    try {
      setCompressionStatus(t('Compressing image...')); setFormError('');
      const result = await processImageForUpload(file, () => undefined);
      if (result.wasCompressed) console.log(`Compressed: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${result.compressionRatio}% reduction)`);
      setReceipt(result.file);
      const reader = new FileReader(); reader.onloadend = () => setReceiptPreview(reader.result as string); reader.readAsDataURL(result.file);
    } catch (value) { setFormError(value instanceof Error ? value.message : t('Could not process image.')); event.target.value = ''; }
    finally { setCompressionStatus(''); }
  }, [t]);
  const handleSaveQuickAdd = useCallback(async () => {
    const amountValue = Number(amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) return setFormError(t('Please enter a valid amount.'));
    if (!category) return setFormError(t('Please select a category.'));
    if (!accountId) return setFormError(t('Please select an account.'));
    try {
      setSaving(true); setFormError('');
      const data = new FormData();
      data.append('type', transactionType); data.append('amount', String(amountValue));
      data.append('category_id', String(Number(category))); data.append('account_id', String(Number(accountId)));
      data.append('transaction_date', transactionDate); if (note) data.append('notes', note); if (receipt) data.append('receipt', receipt);
      await api.post('/transactions', data);
      setShowModal(false); setAmount(''); setCategory(''); setNote(''); setReceipt(null); setReceiptPreview(null);
      await fetchDashboardData(false);
    } catch (value) { setFormError(errorMessage(value, t('Could not save transaction.'))); }
    finally { setSaving(false); }
  }, [accountId, amount, category, fetchDashboardData, note, receipt, t, transactionDate, transactionType]);
  return {
    dashboardData, loading, error, user, showModal, setShowModal, transactionType,
    setTransactionType, amount, setAmount, category, setCategory, accountId, setAccountId,
    transactionDate, setTransactionDate, note, setNote, categories, accounts, formLoading,
    saving, formError, receipt, setReceipt, receiptPreview, setReceiptPreview,
    compressionStatus, setCompressionStatus, fetchDashboardData, openQuickAdd,
    handleFileChange, handleSaveQuickAdd,
  };
}