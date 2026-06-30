import React, { useState, useEffect, useRef } from 'react';
import {
    Upload, Trash2,
    History, Loader2, Lock, AlertCircle, ImageIcon,
    ChevronRight
} from 'lucide-react';
import api from '../utils/api';
import { getCategoryIcon, formatCurrency } from '../constants/categories';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '../contexts/TranslationContext';
import { processImageForUpload, validateImageFile, formatFileSize } from '../utils/imageCompression';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

export interface TransactionCategory {
    id: number;
    name: string;
    slug: string;
}

export interface TransactionAccount {
    id: number;
    name: string;
}

export interface TransactionPhoto {
    id: number;
    file_path: string;
    original_filename: string;
    file_size: number;
}

export interface ChangeLogDiffEntry {
    from: string | number;
    to: string | number;
}

export interface ChangeLogChanges {
    diff?: Record<string, ChangeLogDiffEntry>;
    filename?: string;
}

export type ChangeLogAction =
    | 'created'
    | 'updated'
    | 'deleted'
    | 'photo_added'
    | 'photo_removed';

export interface ChangeLog {
    id: number;
    action: ChangeLogAction;
    created_at: string;
    user?: { name: string };
    changes?: ChangeLogChanges;
}

export interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    category_id: number;
    account_id: number;
    notes: string | null;
    transaction_date: string;
    created_at: string;
    category?: TransactionCategory;
    account?: TransactionAccount;
    photos?: TransactionPhoto[];
    change_logs?: ChangeLog[];
}

export interface Permissions {
    can_edit: boolean;
    can_manage_photos: boolean;
}

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface Account {
    id: number;
    name: string;
}

export interface TransactionFormData {
    amount?: number | string;
    category_id?: number | string;
    account_id?: number | string;
    notes?: string;
    transaction_date?: string;
}

export interface UploadProgress {
    stage: string;
    progress: number;
    quality?: number;
}

export type TabId = 'details' | 'images' | 'history';

// ─────────────────────────────────────────────────────────────────────────────
// Component props
// ─────────────────────────────────────────────────────────────────────────────

export interface EditTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transactionId: number | null;
    onUpdate?: (transaction: Transaction) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const MAX_PHOTOS: number = 10;
const AMOUNT_LOCK_MINUTES: number = 15;
const TABS: TabId[] = ['details', 'images', 'history'];

// ─────────────────────────────────────────────────────────────────────────────
// Design tokens (mirroring Add form's S object)
// ─────────────────────────────────────────────────────────────────────────────

const MS = {
    fieldWrap: { marginBottom: '16px' } as React.CSSProperties,
    fieldLabel: {
        fontSize: '13px', color: '#6b7280', display: 'block',
        marginBottom: '8px', fontWeight: 600,
    } as React.CSSProperties,
    inputBase: {
        width: '100%',
        border: '1.5px solid #e5e7eb',
        borderRadius: '14px',
        padding: '13px 16px',
        fontSize: '14px',
        color: '#121212',
        outline: 'none',
        background: '#fff',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
    } as React.CSSProperties,
    inputLocked: {
        width: '100%',
        border: '1.5px solid #e5e7eb',
        borderRadius: '14px',
        padding: '13px 16px',
        fontSize: '14px',
        color: '#9ca3af',
        outline: 'none',
        background: '#f9fafb',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        cursor: 'not-allowed',
    } as React.CSSProperties,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

const isAmountEditable = (createdAt: string | undefined): boolean => {
    if (!createdAt) return false;
    const createdMs: number = new Date(createdAt).getTime();
    const nowMs: number = Date.now();
    return nowMs - createdMs < AMOUNT_LOCK_MINUTES * 60 * 1000;
};

const formatChangeValue = (key: string, value: string | number): string => {
    if (key === 'amount') return formatCurrency(value);
    if (key === 'transaction_date') {
        try { return format(parseISO(String(value)), 'MMM dd, yyyy'); } catch { return String(value); }
    }
    return value != null ? String(value) : 'N/A';
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
    isOpen,
    onClose,
    transactionId,
    onUpdate,
}) => {
    const { t } = useTranslation();

    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [permissions, setPermissions] = useState<Permissions>({ can_edit: false, can_manage_photos: false });
    const [loading, setLoading] = useState<boolean>(false);
    const [saving, setSaving] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [successMsg, setSuccessMsg] = useState<string>('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [formData, setFormData] = useState<TransactionFormData>({});
    const [activeTab, setActiveTab] = useState<TabId>('details');
    const [amountLocked, setAmountLocked] = useState<boolean>(true);

    const [uploadingPhoto, setUploadingPhoto] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ stage: '', progress: 0 });
    const [photoError, setPhotoError] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

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

    const fetchAll = async (): Promise<void> => {
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

    const fetchTransactionDetails = async (): Promise<void> => {
        try {
            const response = await api.get(`/transactions/${transactionId}`);
            const tx: Transaction = response.data.transaction;
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

    const fetchCategories = async (): Promise<void> => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories || []);
        } catch (err) {
            console.error('Failed to fetch categories', err);
        }
    };

    const fetchAccounts = async (): Promise<void> => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.accounts || []);
        } catch (err) {
            console.error('Failed to fetch accounts', err);
        }
    };

    const handleSave = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMsg('');
        try {
            const payload: Partial<TransactionFormData> = {
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
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            setError(axiosErr.response?.data?.message || t('transaction_detail_modal.failed_to_update_transaction'));
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const files: File[] = Array.from(e.target.files ?? []);
        if (!files.length) return;

        const currentCount: number = transaction?.photos?.length || 0;
        const availableSlots: number = MAX_PHOTOS - currentCount;

        if (availableSlots <= 0) {
            setPhotoError(
                t('transactions.photos.max_photos_reached') ||
                `Maximum of ${MAX_PHOTOS} images allowed. Please delete some before uploading more.`
            );
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const filesToUpload: File[] = files.slice(0, availableSlots);
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
                const file: File = filesToUpload[i];

                const validation: { valid: boolean; error?: string } = validateImageFile(file);
                if (!validation.valid) {
                    setPhotoError(validation.error ?? 'Invalid file.');
                    continue;
                }

                const result = await processImageForUpload(file, (progress: UploadProgress) => {
                    const baseProgress: number = (i / filesToUpload.length) * 90;
                    const stepProgress: number = (progress.progress / 100) * (90 / filesToUpload.length);
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
        } catch (err: unknown) {
            console.error('Photo upload error:', err);
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            setPhotoError(axiosErr.response?.data?.message || axiosErr.message || t('transactions.photos.error.upload_failed'));
        } finally {
            setUploadingPhoto(false);
            setUploadProgress({ stage: '', progress: 0 });
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDeletePhoto = async (photoId: number): Promise<void> => {
        if (!confirm(t('transactions.photos.delete_photo_confirmation') || 'Delete this photo?')) return;
        try {
            await api.delete(`/photos/${photoId}`);
            await fetchTransactionDetails();
        } catch (err) {
            setPhotoError(t('transactions.photos.delete_photo_error') || 'Failed to delete photo.');
        }
    };

    const handleClose = (): void => {
        setError('');
        setSuccessMsg('');
        setPhotoError('');
        onClose();
    };

    if (!isOpen) return null;

    const photoCount: number = transaction?.photos?.length || 0;
    const canUploadMore: boolean = photoCount < MAX_PHOTOS;

    const transactionAccent: string = transaction?.type === 'income' ? '#22c55e' : '#ef4444';
    const transactionLabel: string = transaction?.type === 'income' ? 'THU NHẬP' : 'CHI TIÊU';

    const tabLabel = (tab: TabId): string => {
        if (tab === 'details') return t('transactions.transaction_tab_details') || 'Chi tiết';
        if (tab === 'images') return `${t('transactions.transaction_tab_photos') || 'Ảnh'} (${photoCount})`;
        if (tab === 'history') return t('transaction_detail_modal.history') || 'Lịch sử';
        return tab;
    };

    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 200,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            }}
            onClick={e => { if (e.currentTarget === e.target) handleClose(); }}
        >
            <div style={{
                background: '#fff', borderRadius: '24px 24px 0 0',
                maxHeight: '92vh', overflowY: 'auto',
                boxShadow: '0 -8px 48px rgba(0,0,0,0.25)',
            }}>

                {/* ── Sticky header ────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px 14px', borderBottom: '1px solid #f1f5f9',
                    position: 'sticky', top: 0, background: '#fff', zIndex: 1,
                }}>
                    <button
                        onClick={handleClose}
                        style={{
                            background: 'none', border: 'none', color: '#6b7280',
                            fontSize: '14px', fontWeight: 600, cursor: 'pointer', padding: '4px 8px',
                        }}
                    >
                        Hủy
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>SỬA GIAO DỊCH</p>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: transaction ? transactionAccent : '#7B51F1', letterSpacing: '0.5px' }}>
                            {transaction ? transactionLabel : '…'}
                        </p>
                    </div>

                    <button
                        onClick={() => {
                            if (activeTab === 'details') {
                                formRef.current?.requestSubmit();
                            }
                        }}
                        disabled={saving || (activeTab === 'details' && !permissions.can_edit)}
                        style={{
                            background: (saving || activeTab !== 'details') ? '#a78bfa' : '#7B51F1',
                            border: 'none', color: '#fff',
                            padding: '8px 18px', borderRadius: '20px',
                            fontSize: '14px', fontWeight: 700,
                            cursor: (saving || activeTab !== 'details') ? 'not-allowed' : 'pointer',
                            opacity: activeTab !== 'details' ? 0.4 : 1,
                            transition: 'opacity 0.2s, background 0.2s',
                        }}
                    >
                        {saving
                            ? (t('transactions.transaction_saving_state') || 'Đang lưu...')
                            : (t('transactions.transaction_save_action') || 'Lưu')}
                    </button>
                </div>

                {/* ── Transaction summary strip ─────────────────────────────── */}
                {transaction && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 20px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9',
                    }}>
                        <div style={{
                            width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
                            background: transaction.type === 'income' ? '#dcfce7' : '#fee2e2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px',
                        }}>
                            {getCategoryIcon(transaction.category?.slug)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, marginBottom: '2px' }}>
                                {t(`categories.${transaction.category?.slug}`) || transaction.category?.name || '—'}
                            </p>
                            <p style={{ fontSize: '16px', fontWeight: 800, color: transactionAccent }}>
                                {transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}
                            </p>
                        </div>
                        {amountLocked && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                background: '#fffbeb', border: '1px solid #fde68a',
                                borderRadius: '20px', padding: '4px 10px',
                            }}>
                                <Lock style={{ width: '11px', height: '11px', color: '#d97706' }} />
                                <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>
                                    {t('transactions.amount_locked_hint') || `Khoá sau ${AMOUNT_LOCK_MINUTES} phút`}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Global error / success banners ────────────────────────── */}
                {error && (
                    <div style={{
                        margin: '12px 20px 0',
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        background: '#fef2f2', border: '1px solid #fecaca',
                        borderRadius: '12px', padding: '10px 12px',
                        fontSize: '13px', color: '#b91c1c', fontWeight: 600,
                    }}>
                        <AlertCircle style={{ width: '15px', height: '15px', flexShrink: 0, marginTop: '1px' }} />
                        <span>{error}</span>
                    </div>
                )}
                {successMsg && (
                    <div style={{
                        margin: '12px 20px 0',
                        background: '#f0fdf4', border: '1px solid #bbf7d0',
                        borderRadius: '12px', padding: '10px 12px',
                        fontSize: '13px', color: '#15803d', fontWeight: 600,
                    }}>
                        {successMsg}
                    </div>
                )}

                {/* ── Tabs ─────────────────────────────────────────────────── */}
                <div style={{
                    display: 'flex', borderBottom: '1px solid #f1f5f9',
                    padding: '0 20px', gap: '0',
                }}>
                    {TABS.map((tab: TabId) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1, background: 'none', border: 'none',
                                padding: '12px 4px', fontSize: '13px', fontWeight: 600,
                                cursor: 'pointer',
                                color: activeTab === tab ? '#7B51F1' : '#9ca3af',
                                borderBottom: `2px solid ${activeTab === tab ? '#7B51F1' : 'transparent'}`,
                                marginBottom: '-1px',
                                transition: 'color 0.15s, border-color 0.15s',
                            }}
                        >
                            {tabLabel(tab)}
                        </button>
                    ))}
                </div>

                {/* ── Body ─────────────────────────────────────────────────── */}
                <div>
                    {loading && !transaction ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                border: '4px solid #ddd6fe', borderTopColor: '#7B51F1',
                                borderRadius: '50%', animation: 'spin 0.9s linear infinite',
                            }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                        </div>
                    ) : !transaction ? null : (
                        <>
                            {/* ─── TAB 1: DETAILS ─── */}
                            {activeTab === 'details' && (
                                <form ref={formRef} onSubmit={handleSave} style={{ padding: '20px' }}>

                                    {/* Amount */}
                                    <div style={MS.fieldWrap}>
                                        <label style={MS.fieldLabel}>
                                            {t('transactions.transaction_form_amount_label') || 'Số tiền'}
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.amount ?? ''}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                    !amountLocked && setFormData({ ...formData, amount: e.target.value })
                                                }
                                                disabled={amountLocked}
                                                required
                                                style={amountLocked ? MS.inputLocked : MS.inputBase}
                                                title={amountLocked
                                                    ? (t('transactions.amount_locked_tooltip') || `Amount can only be edited within ${AMOUNT_LOCK_MINUTES} minutes of creation.`)
                                                    : ''}
                                            />
                                            {amountLocked && (
                                                <Lock style={{
                                                    position: 'absolute', right: '14px', top: '50%',
                                                    transform: 'translateY(-50%)',
                                                    width: '14px', height: '14px', color: '#9ca3af',
                                                }} />
                                            )}
                                        </div>
                                        {amountLocked && (
                                            <p style={{ marginTop: '6px', fontSize: '12px', color: '#d97706' }}>
                                                {t('transactions.amount_locked_description') ||
                                                    `Trường này chỉ đọc vì giao dịch được tạo hơn ${AMOUNT_LOCK_MINUTES} phút trước.`}
                                            </p>
                                        )}
                                    </div>

                                    {/* Category */}
                                    <div style={MS.fieldWrap}>
                                        <label style={MS.fieldLabel}>
                                            {t('transactions.transaction_form_category_label') || 'Hạng mục'}
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={formData.category_id ?? ''}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                    setFormData({ ...formData, category_id: e.target.value })
                                                }
                                                required
                                                style={{ ...MS.inputBase, appearance: 'none', paddingRight: '36px' }}
                                            >
                                                {categories.map((cat: Category) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {getCategoryIcon(cat.slug)} {t(`categories.${cat.slug}`) || cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <span style={{
                                                position: 'absolute', right: '14px', top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                                            }}>▾</span>
                                        </div>
                                    </div>

                                    {/* Account */}
                                    <div style={MS.fieldWrap}>
                                        <label style={MS.fieldLabel}>
                                            {t('transactions.transaction_form_account_label') || 'Tài khoản'}
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <select
                                                value={formData.account_id ?? ''}
                                                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                                    setFormData({ ...formData, account_id: e.target.value })
                                                }
                                                required
                                                style={{ ...MS.inputBase, appearance: 'none', paddingRight: '36px' }}
                                            >
                                                {accounts.map((acc: Account) => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <span style={{
                                                position: 'absolute', right: '14px', top: '50%',
                                                transform: 'translateY(-50%)',
                                                pointerEvents: 'none', fontSize: '12px', color: '#9ca3af',
                                            }}>▾</span>
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div style={MS.fieldWrap}>
                                        <label style={MS.fieldLabel}>
                                            {t('transactions.transaction_form_date_label') || 'Ngày'}
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.transaction_date ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                                setFormData({ ...formData, transaction_date: e.target.value })
                                            }
                                            required
                                            style={MS.inputBase}
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div style={MS.fieldWrap}>
                                        <label style={MS.fieldLabel}>
                                            {t('transactions.transaction_form_notes_label') || 'Ghi chú'}
                                        </label>
                                        <textarea
                                            value={formData.notes ?? ''}
                                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                                setFormData({ ...formData, notes: e.target.value })
                                            }
                                            rows={3}
                                            placeholder={t('transactions.transaction_notes_placeholder') || 'Thêm ghi chú…'}
                                            style={{ ...MS.inputBase, resize: 'none', lineHeight: '1.5' }}
                                        />
                                    </div>

                                    {/* Hidden submit — triggered by header Save button */}
                                    <button type="submit" style={{ display: 'none' }} aria-hidden />
                                </form>
                            )}

                            {/* ─── TAB 2: IMAGES ─── */}
                            {activeTab === 'images' && (
                                <div style={{ padding: '20px' }}>

                                    {/* Count indicator */}
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        marginBottom: '16px',
                                    }}>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#6b7280' }}>
                                            {t('transactions.photos.count_label') || 'Ảnh'}:{' '}
                                            <span style={{ color: photoCount >= MAX_PHOTOS ? '#ef4444' : '#7B51F1', fontWeight: 800 }}>
                                                {photoCount}
                                            </span>
                                            <span style={{ color: '#9ca3af' }}> / {MAX_PHOTOS}</span>
                                        </span>
                                        {photoCount >= MAX_PHOTOS && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '4px',
                                                background: '#fef2f2', border: '1px solid #fecaca',
                                                borderRadius: '20px', padding: '4px 10px',
                                            }}>
                                                <AlertCircle style={{ width: '11px', height: '11px', color: '#ef4444' }} />
                                                <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>
                                                    {t('transactions.photos.max_reached_badge') || 'Đã đạt giới hạn'}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {photoError && (
                                        <div style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                                            background: '#fffbeb', border: '1px solid #fde68a',
                                            borderRadius: '12px', padding: '10px 12px',
                                            fontSize: '13px', color: '#92400e', fontWeight: 500,
                                            marginBottom: '16px',
                                        }}>
                                            <AlertCircle style={{ width: '14px', height: '14px', flexShrink: 0, marginTop: '1px' }} />
                                            <span>{photoError}</span>
                                        </div>
                                    )}

                                    {/* Upload zone */}
                                    {permissions.can_manage_photos && (
                                        <div style={{ marginBottom: '16px' }}>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                                multiple
                                                onChange={handlePhotoUpload}
                                                disabled={!canUploadMore || uploadingPhoto}
                                                style={{ display: 'none' }}
                                                id="edit-photo-upload"
                                            />
                                            <label
                                                htmlFor="edit-photo-upload"
                                                style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', justifyContent: 'center',
                                                    gap: '8px', padding: '24px 16px',
                                                    border: `2px dashed ${!canUploadMore || uploadingPhoto ? '#e5e7eb' : '#7B51F1'}`,
                                                    borderRadius: '14px',
                                                    background: !canUploadMore || uploadingPhoto ? '#f9fafb' : '#f5f3ff',
                                                    cursor: !canUploadMore || uploadingPhoto ? 'not-allowed' : 'pointer',
                                                    opacity: !canUploadMore ? 0.55 : 1,
                                                    transition: 'border-color 0.2s, background 0.2s',
                                                }}
                                            >
                                                {uploadingPhoto ? (
                                                    <div style={{
                                                        width: '24px', height: '24px',
                                                        border: '3px solid #ddd6fe', borderTopColor: '#7B51F1',
                                                        borderRadius: '50%', animation: 'spin 0.9s linear infinite',
                                                    }} />
                                                ) : canUploadMore ? (
                                                    <Upload style={{ width: '22px', height: '22px', color: '#7B51F1' }} />
                                                ) : (
                                                    <Lock style={{ width: '22px', height: '22px', color: '#9ca3af' }} />
                                                )}
                                                <span style={{ fontSize: '13px', fontWeight: 600, color: uploadingPhoto ? '#7B51F1' : canUploadMore ? '#4b5563' : '#9ca3af' }}>
                                                    {uploadingPhoto
                                                        ? (uploadProgress.stage === 'compressing'
                                                            ? (t('transactions.photos.compressing') || 'Đang nén…')
                                                            : uploadProgress.stage === 'uploading'
                                                                ? (t('transactions.photos.uploading') || 'Đang tải lên…')
                                                                : (t('transactions.transaction_uploading_state') || 'Đang xử lý…'))
                                                        : canUploadMore
                                                            ? (t('transactions.transaction_upload_photo_action') || 'Nhấn để tải ảnh lên')
                                                            : (t('transactions.photos.max_photos_reached') || `Đã đạt tối đa ${MAX_PHOTOS} ảnh`)
                                                    }
                                                </span>
                                                {!uploadingPhoto && canUploadMore && (
                                                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                        JPEG, PNG, WebP · tối đa 10 MB · còn {MAX_PHOTOS - photoCount} ô
                                                    </span>
                                                )}
                                            </label>

                                            {/* Progress bar */}
                                            {uploadingPhoto && (
                                                <div style={{
                                                    width: '100%', height: '4px', background: '#ede9fe',
                                                    borderRadius: '4px', overflow: 'hidden', marginTop: '8px',
                                                }}>
                                                    <div style={{
                                                        height: '100%', background: '#7B51F1',
                                                        borderRadius: '4px',
                                                        width: `${uploadProgress.progress}%`,
                                                        transition: 'width 0.3s ease',
                                                    }} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Photo gallery */}
                                    {transaction.photos && transaction.photos.length > 0 ? (
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
                                            gap: '10px',
                                        }}>
                                            {transaction.photos.map((photo: TransactionPhoto) => (
                                                <div
                                                    key={photo.id}
                                                    style={{
                                                        position: 'relative', borderRadius: '12px',
                                                        overflow: 'hidden', border: '1.5px solid #e5e7eb',
                                                    }}
                                                    className="group"
                                                >
                                                    <img
                                                        src={`/storage/${photo.file_path}`}
                                                        alt={photo.original_filename}
                                                        style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
                                                    />
                                                    {permissions.can_manage_photos && (
                                                        <button
                                                            onClick={() => handleDeletePhoto(photo.id)}
                                                            style={{
                                                                position: 'absolute', top: '6px', right: '6px',
                                                                background: '#ef4444', border: 'none',
                                                                color: '#fff', borderRadius: '8px',
                                                                padding: '4px', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center',
                                                            }}
                                                            title={t('transactions.photos.delete_photo') || 'Xóa ảnh'}
                                                        >
                                                            <Trash2 style={{ width: '13px', height: '13px' }} />
                                                        </button>
                                                    )}
                                                    <div style={{ padding: '6px 8px', background: '#fff' }}>
                                                        <p style={{ fontSize: '11px', color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {photo.original_filename}
                                                        </p>
                                                        <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                            {(photo.file_size / 1024).toFixed(1)} KB
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', color: '#9ca3af' }}>
                                            <ImageIcon style={{ width: '44px', height: '44px', opacity: 0.35, marginBottom: '10px' }} />
                                            <p style={{ fontSize: '13px' }}>
                                                {t('transaction_detail_modal.no_photos_uploaded_yet') || 'Chưa có ảnh nào.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ─── TAB 3: HISTORY ─── */}
                            {activeTab === 'history' && (
                                <div style={{ padding: '20px' }}>
                                    {transaction.change_logs && transaction.change_logs.length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            {transaction.change_logs.map((log: ChangeLog) => (
                                                <div
                                                    key={log.id}
                                                    style={{
                                                        background: '#f8fafc', border: '1px solid #f1f5f9',
                                                        borderRadius: '14px', padding: '14px',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                        <div style={{
                                                            width: '32px', height: '32px', borderRadius: '50%',
                                                            background: '#ede9fe', display: 'flex',
                                                            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                                        }}>
                                                            <History style={{ width: '15px', height: '15px', color: '#7B51F1' }} />
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px', marginBottom: '2px' }}>
                                                                <span style={{ fontSize: '13px', fontWeight: 700, color: '#121212' }}>
                                                                    {log.action === 'created' && (t('transactions.transaction_history_created') || 'Tạo mới')}
                                                                    {log.action === 'updated' && (t('transactions.transaction_history_updated') || 'Cập nhật')}
                                                                    {log.action === 'deleted' && (t('transactions.transaction_history_deleted') || 'Xóa')}
                                                                    {log.action === 'photo_added' && (t('transactions.transaction_history_photo_added') || 'Thêm ảnh')}
                                                                    {log.action === 'photo_removed' && (t('transactions.transaction_history_photo_removed') || 'Xóa ảnh')}
                                                                </span>
                                                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                                                                    {format(parseISO(log.created_at), 'MMM dd, yyyy h:mm a')}
                                                                </span>
                                                            </div>
                                                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '6px' }}>
                                                                {t('transactions.transaction_history_by') || 'Bởi'}{' '}
                                                                <span style={{ fontWeight: 700, color: '#374151' }}>
                                                                    {log.user?.name || (t('transactions.transaction_history_unknown_user') || 'Không rõ')}
                                                                </span>
                                                            </p>

                                                            {/* Field diffs */}
                                                            {log.changes?.diff && Object.keys(log.changes.diff).length > 0 && (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {Object.entries(log.changes.diff).map(([key, change]: [string, ChangeLogDiffEntry]) => (
                                                                        <div key={key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px', fontSize: '12px' }}>
                                                                            <span style={{ fontWeight: 600, color: '#6b7280', textTransform: 'capitalize' }}>
                                                                                {key.replace(/_/g, ' ')}:
                                                                            </span>
                                                                            <span style={{ padding: '2px 6px', background: '#fee2e2', color: '#b91c1c', borderRadius: '4px', textDecoration: 'line-through' }}>
                                                                                {formatChangeValue(key, change.from)}
                                                                            </span>
                                                                            <ChevronRight style={{ width: '12px', height: '12px', color: '#9ca3af' }} />
                                                                            <span style={{ padding: '2px 6px', background: '#dcfce7', color: '#15803d', borderRadius: '4px' }}>
                                                                                {formatChangeValue(key, change.to)}
                                                                            </span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Photo filename */}
                                                            {log.changes?.filename && (
                                                                <p style={{ marginTop: '6px', fontSize: '12px', color: '#6b7280' }}>
                                                                    📎 {log.changes.filename}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', color: '#9ca3af' }}>
                                            <History style={{ width: '44px', height: '44px', opacity: 0.35, marginBottom: '10px' }} />
                                            <p style={{ fontSize: '13px' }}>
                                                {t('transaction_detail_modal.no_history_available') || 'Chưa có lịch sử.'}
                                            </p>
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
