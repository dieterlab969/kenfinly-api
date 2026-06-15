import React, { useState, useEffect, useRef } from 'react';
import {
    X, Save, Upload, Trash2, Calendar, DollarSign, Tag,
    FileText, History, Loader2, Lock, AlertCircle, ImageIcon,
    ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import { getCategoryIcon, formatCurrency } from '../constants/categories';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../contexts/TranslationContext';
import { processImageForUpload, validateImageFile, formatFileSize } from '../utils/imageCompression';

const MAX_PHOTOS = 10;
const AMOUNT_LOCK_MINUTES = 15;

const isAmountEditable = (createdAt) => {
    if (!createdAt) return false;
    const createdMs = new Date(createdAt).getTime();
    const nowMs = Date.now();
    return nowMs - createdMs < AMOUNT_LOCK_MINUTES * 60 * 1000;
};

const formatChangeValue = (key, value) => {
    if (key === 'amount') return formatCurrency(value);
    if (key === 'transaction_date') {
        try { return format(parseISO(value), 'MMM dd, yyyy'); } catch { return value; }
    }
    return value || 'N/A';
};

const TABS = ['details', 'images', 'history'];

const EditTransactionModal = ({ isOpen, onClose, transactionId, onUpdate }) => {
    const { t } = useTranslation();

    const [transaction, setTransaction] = useState(null);
    const [permissions, setPermissions] = useState({ can_edit: false, can_manage_photos: false });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState({});
    const [activeTab, setActiveTab] = useState('details');
    const [amountLocked, setAmountLocked] = useState(true);

    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ stage: '', progress: 0 });
    const [photoError, setPhotoError] = useState('');

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen && transactionId) {
            setActiveTab('details');
            setError('');
            setSuccessMsg('');
            setPhotoError('');
            fetchAll();
        }
        if (!isOpen) {
            setTransaction(null);
            setFormData({});
        }
    }, [isOpen, transactionId]);

    const fetchAll = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchTransactionDetails(),
                fetchCategories(),
                fetchAccounts(),
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionDetails = async () => {
        try {
            const response = await api.get(`/transactions/${transactionId}`);
            const tx = response.data.transaction;
            setTransaction(tx);
            setPermissions(response.data.permissions || { can_edit: true, can_manage_photos: true });
            setAmountLocked(!isAmountEditable(tx.created_at));
            setFormData({
                amount: tx.amount,
                category_id: tx.category_id,
                account_id: tx.account_id,
                notes: tx.notes || '',
                transaction_date: tx.transaction_date,
            });
        } catch (err) {
            setError(t('transaction_detail_modal.failed_to_load_transaction_details'));
            console.error(err);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.accounts || []);
        } catch (err) {
            console.error('Failed to fetch accounts', err);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            const payload = {
                category_id: formData.category_id,
                account_id: formData.account_id,
                notes: formData.notes,
                transaction_date: formData.transaction_date,
            };
            if (!amountLocked) {
                payload.amount = formData.amount;
            }
            const response = await api.put(`/transactions/${transactionId}`, payload);
            setTransaction(response.data.transaction);
            setSuccessMsg(t('transactions.transaction_updated_successfully') || 'Transaction updated successfully.');
            if (onUpdate) onUpdate(response.data.transaction);
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('transaction_detail_modal.failed_to_update_transaction'));
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const currentCount = transaction?.photos?.length || 0;
        const availableSlots = MAX_PHOTOS - currentCount;

        if (availableSlots <= 0) {
            setPhotoError(
                t('transactions.photos.max_photos_reached') ||
                `Maximum of ${MAX_PHOTOS} images allowed. Please delete some before uploading more.`
            );
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const filesToUpload = files.slice(0, availableSlots);
        if (files.length > availableSlots) {
            setPhotoError(
                t('transactions.photos.upload_limit_exceeded') ||
                `Only ${availableSlots} more image(s) can be uploaded (max ${MAX_PHOTOS} total). Uploading first ${availableSlots}.`
            );
        } else {
            setPhotoError('');
        }

        setUploadingPhoto(true);
        setUploadProgress({ stage: 'validating', progress: 0 });

        try {
            for (let i = 0; i < filesToUpload.length; i++) {
                const file = filesToUpload[i];

                const validation = validateImageFile(file);
                if (!validation.valid) {
                    setPhotoError(validation.error);
                    continue;
                }

                const result = await processImageForUpload(file, (progress) => {
                    const baseProgress = (i / filesToUpload.length) * 90;
                    const stepProgress = (progress.progress / 100) * (90 / filesToUpload.length);
                    setUploadProgress({ stage: progress.stage, progress: Math.round(baseProgress + stepProgress) });
                });

                if (result.wasCompressed) {
                    console.log(`Compressed: ${formatFileSize(result.originalSize)} → ${formatFileSize(result.compressedSize)} (${result.compressionRatio}% reduction)`);
                }

                setUploadProgress({ stage: 'uploading', progress: Math.round(((i + 0.9) / filesToUpload.length) * 100) });

                const photoData = new FormData();
                photoData.append('photo', result.file);
                await api.post(`/transactions/${transactionId}/photos`, photoData);
            }

            setUploadProgress({ stage: 'complete', progress: 100 });
            await fetchTransactionDetails();
        } catch (err) {
            console.error('Photo upload error:', err);
            setPhotoError(err.response?.data?.message || err.message || t('transactions.photos.error.upload_failed'));
        } finally {
            setUploadingPhoto(false);
            setUploadProgress({ stage: '', progress: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!confirm(t('transactions.photos.delete_photo_confirmation') || 'Delete this photo?')) return;
        try {
            await api.delete(`/photos/${photoId}`);
            await fetchTransactionDetails();
        } catch (err) {
            setPhotoError(t('transactions.photos.delete_photo_error') || 'Failed to delete photo.');
        }
    };

    const handleClose = () => {
        setError('');
        setSuccessMsg('');
        setPhotoError('');
        onClose();
    };

    if (!isOpen) return null;

    const photoCount = transaction?.photos?.length || 0;
    const canUploadMore = photoCount < MAX_PHOTOS;

    const tabLabel = (tab) => {
        if (tab === 'details') return t('transactions.transaction_tab_details') || 'Detailed Info';
        if (tab === 'images') return `${t('transactions.transaction_tab_photos') || 'Images'} (${photoCount})`;
        if (tab === 'history') return t('transaction_detail_modal.history') || 'Transaction History';
        return tab;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center space-x-3">
                        {transaction && (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                                transaction.type === 'income' ? 'bg-green-100' : 'bg-blue-100'
                            }`}>
                                {getCategoryIcon(transaction.category?.slug)}
                            </div>
                        )}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {t('transactions.transaction_edit_title') || 'Edit Transaction'}
                            </h2>
                            {transaction && (
                                <p className="text-sm text-gray-500">
                                    {t(`categories.${transaction.category?.slug}`) || transaction.category?.name}
                                    {' · '}
                                    <span className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Global error / success banners */}
                {error && (
                    <div className="mx-6 mt-3 flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex-shrink-0">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div className="mx-6 mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex-shrink-0">
                        {successMsg}
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200 flex-shrink-0">
                    <div className="flex space-x-0 px-6">
                        {TABS.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                                    activeTab === tab
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-gray-500 border-transparent hover:text-gray-800'
                                }`}
                            >
                                {tabLabel(tab)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading && !transaction ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : !transaction ? null : (
                        <>
                            {/* ─── TAB 1: DETAILED INFO ─── */}
                            {activeTab === 'details' && (
                                <form onSubmit={handleSave} className="p-6 space-y-5">
                                    {/* Amount */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="flex items-center space-x-1.5">
                                                <DollarSign className="w-4 h-4 text-gray-400" />
                                                <span>{t('transactions.transaction_form_amount_label') || 'Amount'}</span>
                                                {amountLocked && (
                                                    <span className="ml-auto flex items-center space-x-1 text-xs text-amber-600 font-normal bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                                        <Lock className="w-3 h-3" />
                                                        <span>{t('transactions.amount_locked_hint') || `Locked after ${AMOUNT_LOCK_MINUTES} min`}</span>
                                                    </span>
                                                )}
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount ?? ''}
                                                onChange={(e) => !amountLocked && setFormData({ ...formData, amount: e.target.value })}
                                                disabled={amountLocked}
                                                className={`w-full px-4 py-2.5 border rounded-lg text-sm transition-colors
                                                    ${amountLocked
                                                        ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'bg-white border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                                    }`}
                                                required
                                                title={amountLocked
                                                    ? (t('transactions.amount_locked_tooltip') || `Amount can only be edited within ${AMOUNT_LOCK_MINUTES} minutes of creation.`)
                                                    : ''}
                                            />
                                            {amountLocked && (
                                                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                        {amountLocked && (
                                            <p className="mt-1 text-xs text-amber-600">
                                                {t('transactions.amount_locked_description') ||
                                                    `This field is read-only because the transaction was created more than ${AMOUNT_LOCK_MINUTES} minutes ago.`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="flex items-center space-x-1.5">
                                                <Tag className="w-4 h-4 text-gray-400" />
                                                <span>{t('transactions.transaction_form_category_label') || 'Category'}</span>
                                            </span>
                                        </label>
                                        <select
                                            value={formData.category_id ?? ''}
                                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {getCategoryIcon(cat.slug)} {t(`categories.${cat.slug}`) || cat.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Account */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="flex items-center space-x-1.5">
                                                <span>{t('transactions.transaction_form_account_label') || 'Account'}</span>
                                            </span>
                                        </label>
                                        <select
                                            value={formData.account_id ?? ''}
                                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        >
                                            {accounts.map((acc) => (
                                                <option key={acc.id} value={acc.id}>
                                                    {acc.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Date */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="flex items-center space-x-1.5">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                <span>{t('transactions.transaction_form_date_label') || 'Date'}</span>
                                            </span>
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.transaction_date ?? ''}
                                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            <span className="flex items-center space-x-1.5">
                                                <FileText className="w-4 h-4 text-gray-400" />
                                                <span>{t('transactions.transaction_form_notes_label') || 'Notes'}</span>
                                            </span>
                                        </label>
                                        <textarea
                                            value={formData.notes ?? ''}
                                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            rows={3}
                                            placeholder={t('transactions.transaction_notes_placeholder') || 'Add a note…'}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                        />
                                    </div>

                                    {/* Actions */}
                                    <div className="flex space-x-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={handleClose}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            {t('common.cancel') || 'Cancel'}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving || !permissions.can_edit}
                                            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {saving ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Save className="w-4 h-4" />
                                            )}
                                            <span>{saving
                                                ? (t('transactions.transaction_saving_state') || 'Saving…')
                                                : (t('transactions.transaction_save_action') || 'Save Changes')
                                            }</span>
                                        </button>
                                    </div>
                                </form>
                            )}

                            {/* ─── TAB 2: IMAGES ─── */}
                            {activeTab === 'images' && (
                                <div className="p-6 space-y-4">
                                    {/* Photo count indicator */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-gray-700">
                                            {t('transactions.photos.count_label') || 'Photos'}:{' '}
                                            <span className={photoCount >= MAX_PHOTOS ? 'text-red-600 font-bold' : 'text-blue-600 font-bold'}>
                                                {photoCount}
                                            </span>
                                            <span className="text-gray-400"> / {MAX_PHOTOS}</span>
                                        </span>
                                        {photoCount >= MAX_PHOTOS && (
                                            <span className="flex items-center space-x-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>{t('transactions.photos.max_reached_badge') || 'Maximum reached'}</span>
                                            </span>
                                        )}
                                    </div>

                                    {photoError && (
                                        <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                            <span>{photoError}</span>
                                        </div>
                                    )}

                                    {/* Upload zone */}
                                    {permissions.can_manage_photos && (
                                        <div className="space-y-2">
                                            <label
                                                className={`flex flex-col items-center justify-center space-y-2 px-4 py-6 border-2 border-dashed rounded-xl transition-colors
                                                    ${!canUploadMore || uploadingPhoto
                                                        ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                                                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                                                    }`}
                                            >
                                                {uploadingPhoto ? (
                                                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                ) : canUploadMore ? (
                                                    <Upload className="w-6 h-6 text-gray-400" />
                                                ) : (
                                                    <Lock className="w-6 h-6 text-gray-400" />
                                                )}

                                                <div className="text-center">
                                                    <span className="text-sm text-gray-600 font-medium">
                                                        {uploadingPhoto
                                                            ? (uploadProgress.stage === 'compressing'
                                                                ? (t('transactions.photos.compressing') || 'Compressing…')
                                                                : uploadProgress.stage === 'uploading'
                                                                    ? (t('transactions.photos.uploading') || 'Uploading…')
                                                                    : (t('transactions.transaction_uploading_state') || 'Processing…'))
                                                            : canUploadMore
                                                                ? (t('transactions.transaction_upload_photo_action') || 'Click to upload photos')
                                                                : (t('transactions.photos.max_photos_reached') || `Maximum of ${MAX_PHOTOS} photos reached`)
                                                        }
                                                    </span>
                                                    {!uploadingPhoto && canUploadMore && (
                                                        <p className="text-xs text-gray-400 mt-1">
                                                            {t('transactions.photos.size_hint') || 'JPEG, PNG, GIF, WebP · max 10 MB'}
                                                            {' · '}
                                                            {MAX_PHOTOS - photoCount} {t('transactions.photos.slots_remaining') || 'slot(s) remaining'}
                                                        </p>
                                                    )}
                                                </div>

                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                    multiple
                                                    onChange={handlePhotoUpload}
                                                    className="hidden"
                                                    disabled={!canUploadMore || uploadingPhoto}
                                                />
                                            </label>

                                            {/* Progress bar */}
                                            {uploadingPhoto && (
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                                        style={{ width: `${uploadProgress.progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Photo gallery */}
                                    {transaction.photos && transaction.photos.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {transaction.photos.map((photo) => (
                                                <div key={photo.id} className="relative group rounded-lg overflow-hidden border border-gray-200">
                                                    <img
                                                        src={`/storage/${photo.file_path}`}
                                                        alt={photo.original_filename}
                                                        className="w-full h-36 object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                                        {permissions.can_manage_photos && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(photo.id)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                                title={t('transactions.photos.delete_photo') || 'Delete photo'}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="px-2 py-1.5 bg-white">
                                                        <p className="text-xs text-gray-600 truncate">{photo.original_filename}</p>
                                                        <p className="text-xs text-gray-400">{(photo.file_size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-12 text-gray-400">
                                            <ImageIcon className="w-12 h-12 mb-3 opacity-40" />
                                            <p className="text-sm">{t('transaction_detail_modal.no_photos_uploaded_yet') || 'No photos uploaded yet.'}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── TAB 3: TRANSACTION HISTORY ─── */}
                            {activeTab === 'history' && (
                                <div className="p-6 space-y-4">
                                    {transaction.change_logs && transaction.change_logs.length > 0 ? (
                                        <div className="space-y-3">
                                            {transaction.change_logs.map((log) => (
                                                <div key={log.id} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                                                    <div className="flex items-start space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                            <History className="w-4 h-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between flex-wrap gap-1">
                                                                <span className="font-medium text-gray-900 text-sm">
                                                                    {log.action === 'created' && (t('transactions.transaction_history_created') || 'Created')}
                                                                    {log.action === 'updated' && (t('transactions.transaction_history_updated') || 'Updated')}
                                                                    {log.action === 'deleted' && (t('transactions.transaction_history_deleted') || 'Deleted')}
                                                                    {log.action === 'photo_added' && (t('transactions.transaction_history_photo_added') || 'Photo Added')}
                                                                    {log.action === 'photo_removed' && (t('transactions.transaction_history_photo_removed') || 'Photo Removed')}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {format(parseISO(log.created_at), 'MMM dd, yyyy h:mm a')}
                                                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {t('transactions.transaction_history_by') || 'By'}{' '}
                                                                <span className="font-medium text-gray-700">
                                                                    {log.user?.name || (t('transactions.transaction_history_unknown_user') || 'Unknown')}
                                                                </span>
                                                            </p>

                                                            {/* Field diffs */}
                                                            {log.changes?.diff && Object.keys(log.changes.diff).length > 0 && (
                                                                <div className="mt-2 space-y-1">
                                                                    {Object.entries(log.changes.diff).map(([key, change]) => (
                                                                        <div key={key} className="flex items-center flex-wrap gap-1 text-xs">
                                                                            <span className="font-medium text-gray-600 capitalize">
                                                                                {key.replace(/_/g, ' ')}:
                                                                            </span>
                                                                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded line-through">
                                                                                {formatChangeValue(key, change.from)}
                                                                            </span>
                                                                            <ChevronRight className="w-3 h-3 text-gray-400" />
                                                                            <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                                                                                {formatChangeValue(key, change.to)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Photo filename */}
                                                            {log.changes?.filename && (
                                                                <p className="mt-1.5 text-xs text-gray-500">
                                                                    📎 {log.changes.filename}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-12 text-gray-400">
                                            <History className="w-12 h-12 mb-3 opacity-40" />
                                            <p className="text-sm">{t('transaction_detail_modal.no_history_available') || 'No history available.'}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EditTransactionModal;
