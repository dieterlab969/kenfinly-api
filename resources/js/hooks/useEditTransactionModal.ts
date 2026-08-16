import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { processImageForUpload, validateImageFile, formatFileSize } from '../utils/imageCompression';
import type {
  Account,
  Category,
  EditTransactionModalProps,
  Permissions,
  Transaction,
  TransactionFormData,
  UploadProgress,
} from '../components/EditTransactionModal';

const MAX_PHOTOS = 10;
const AMOUNT_LOCK_MINUTES = 15;

function isAmountEditable(createdAt: string | undefined): boolean {
  return !!createdAt && Date.now() - new Date(createdAt).getTime() < AMOUNT_LOCK_MINUTES * 60 * 1000;
}

export function useEditTransactionModal({
  isOpen, onClose, transactionId, onUpdate,
}: EditTransactionModalProps) {
  const { t } = useTranslation();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({ can_edit: false, can_manage_photos: false });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [formData, setFormData] = useState<TransactionFormData>({});
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'history'>('details');
  const [amountLocked, setAmountLocked] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ stage: '', progress: 0 });
  const [photoError, setPhotoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const fetchTransactionDetails = async (): Promise<void> => {
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      const current = response.data.transaction as Transaction;
      setTransaction(current);
      setPermissions(response.data.permissions || { can_edit: true, can_manage_photos: true });
      setAmountLocked(!isAmountEditable(current.created_at));
      setFormData({
        amount: current.amount, category_id: current.category_id, account_id: current.account_id,
        notes: current.notes || '', transaction_date: current.transaction_date,
      });
    } catch (value) {
      setError(t('Failed to load transaction details.'));
      console.error(value);
    }
  };
  const fetchAll = async (): Promise<void> => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTransactionDetails(),
        api.get('/categories').then((response) => setCategories(response.data.categories || [])).catch((value) => console.error('Failed to fetch categories', value)),
        api.get('/accounts').then((response) => setAccounts(response.data.accounts || [])).catch((value) => console.error('Failed to fetch accounts', value)),
      ]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (isOpen && transactionId) {
      setActiveTab('details'); setError(''); setSuccessMsg(''); setPhotoError(''); void fetchAll();
    }
    if (!isOpen) { setTransaction(null); setFormData({}); }
  }, [isOpen, transactionId]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault(); setSaving(true); setError(''); setSuccessMsg('');
    try {
      const payload: Partial<TransactionFormData> = {
        category_id: formData.category_id, account_id: formData.account_id,
        notes: formData.notes, transaction_date: formData.transaction_date,
      };
      if (!amountLocked) payload.amount = formData.amount;
      const response = await api.put(`/transactions/${transactionId}`, payload);
      setTransaction(response.data.transaction); setSuccessMsg(t('Transaction updated successfully.'));
      onUpdate?.(response.data.transaction); window.setTimeout(() => setSuccessMsg(''), 3000);
    } catch (value) {
      const message = (value as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || t('Failed to update transaction.'));
    } finally { setSaving(false); }
  };
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    const currentCount = transaction?.photos?.length || 0;
    const availableSlots = MAX_PHOTOS - currentCount;
    if (availableSlots <= 0) {
      setPhotoError(t('Maximum of {{max}} images allowed. Please delete some before uploading more.', { max: MAX_PHOTOS }));
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    const filesToUpload = files.slice(0, availableSlots);
    setPhotoError(files.length > availableSlots
      ? t('Only {{n}} more image(s) can be uploaded (max {{max}} total). Uploading first {{n}}.', { n: availableSlots, max: MAX_PHOTOS })
      : '');
    setUploadingPhoto(true); setUploadProgress({ stage: 'validating', progress: 0 });
    try {
      for (let index = 0; index < filesToUpload.length; index += 1) {
        const file = filesToUpload[index];
        const validation = validateImageFile(file);
        if (!validation.valid) { setPhotoError(validation.error ?? 'Invalid file.'); continue; }
        const result = await processImageForUpload(file, (progress) => {
          const base = (index / filesToUpload.length) * 90;
          setUploadProgress({ stage: progress.stage, progress: Math.round(base + (progress.progress / 100) * (90 / filesToUpload.length)) });
        });
        if (result.wasCompressed) console.log(`Compressed: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${result.compressionRatio}% reduction)`);
        setUploadProgress({ stage: 'uploading', progress: Math.round(((index + 0.9) / filesToUpload.length) * 100) });
        const data = new FormData(); data.append('photo', result.file);
        await api.post(`/transactions/${transactionId}/photos`, data);
      }
      setUploadProgress({ stage: 'complete', progress: 100 }); await fetchTransactionDetails();
    } catch (value) {
      const response = value as { response?: { data?: { message?: string } }; message?: string };
      setPhotoError(response.response?.data?.message || response.message || t('Upload failed. Please try again.'));
    } finally {
      setUploadingPhoto(false); setUploadProgress({ stage: '', progress: 0 });
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  const handleDeletePhoto = async (photoId: number): Promise<void> => {
    if (!confirm(t('Delete this photo?'))) return;
    try { await api.delete(`/photos/${photoId}`); await fetchTransactionDetails(); }
    catch { setPhotoError(t('Failed to delete photo.')); }
  };
  const handleClose = (): void => { setError(''); setSuccessMsg(''); setPhotoError(''); onClose(); };

  return {
    t, transaction, permissions, loading, saving, error, successMsg, categories, accounts,
    formData, setFormData, activeTab, setActiveTab, amountLocked, uploadingPhoto,
    uploadProgress, photoError, fileInputRef, formRef, handleSave, handlePhotoUpload,
    handleDeletePhoto, handleClose, maxPhotos: MAX_PHOTOS,
  };
}