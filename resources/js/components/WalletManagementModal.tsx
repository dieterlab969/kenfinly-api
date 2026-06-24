import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Plus, Pencil, Trash2, Wallet, CheckCircle,
    AlertCircle, Loader2, ChevronLeft, Save,
} from 'lucide-react';
import api from '../utils/api';
import { useTranslation } from '../contexts/TranslationContext';

// ─── Domain Types ─────────────────────────────────────────────────────────────

export interface Account {
    id: number;
    name: string;
    balance: number;
    currency: string;
    icon: string;
    color: string;
}

type FormErrors = Partial<Record<keyof Omit<Account, 'id'>, string>>;

type ToastType = 'success' | 'error';

interface Toast {
    type: ToastType;
    message: string;
}

type ModalView = 'list' | 'create' | 'edit';

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_OPTIONS: string[] = ['💰', '🏦', '💳', '💵', '🪙', '🏧', '💎', '🛍️', '🎯', '🚀'];

const COLOR_OPTIONS: string[] = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#ef4444', '#f97316', '#f59e0b', '#10b981',
    '#14b8a6', '#06b6d4', '#64748b', '#1e293b',
];

const CURRENCY_OPTIONS: string[] = ['USD', 'VND', 'EUR', 'JPY', 'GBP', 'KRW', 'SGD', 'AUD'];

type FormState = Omit<Account, 'id'> & { balance: string };

const EMPTY_FORM: FormState = { name: '', balance: '', currency: 'USD', icon: '💰', color: '#3b82f6' };

const formatBalance = (amount: number | string, currency: string = 'USD'): string => {
    const num = parseFloat(String(amount)) || 0;
    if (currency === 'VND') {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
    } catch {
        return `${currency} ${num.toFixed(2)}`;
    }
};

// ─── FormField ────────────────────────────────────────────────────────────────

interface FormFieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({ label, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

// ─── ColorSwatch ──────────────────────────────────────────────────────────────

interface ColorSwatchProps {
    color: string;
    selected: boolean;
    onClick: (color: string) => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, selected, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(color)}
        className={`w-7 h-7 rounded-full transition-all ${selected ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : 'hover:scale-105'}`}
        style={{ backgroundColor: color }}
        aria-label={color}
    />
);

// ─── DeleteConfirmDialog ──────────────────────────────────────────────────────

interface DeleteConfirmDialogProps {
    wallet: Account;
    onConfirm: () => void;
    onCancel: () => void;
    deleting: boolean;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({ wallet, onConfirm, onCancel, deleting }) => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div
            className="absolute inset-0 bg-black/60"
            onClick={!deleting ? onCancel : undefined}
        />
        <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Delete Account</h3>
            <p className="text-sm text-gray-600 text-center mb-1">
                Are you sure you want to delete
            </p>
            <p className="text-sm font-semibold text-gray-900 text-center mb-6">
                "{wallet.icon} {wallet.name}"?
            </p>
            <p className="text-xs text-red-600 text-center mb-6 bg-red-50 rounded-lg p-3">
                ⚠️ This action cannot be undone. Accounts with existing transactions cannot be deleted.
            </p>
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    disabled={deleting}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    onClick={onConfirm}
                    disabled={deleting}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                >
                    {deleting
                        ? <><Loader2 className="w-4 h-4 animate-spin" />Deleting…</>
                        : <><Trash2 className="w-4 h-4" />Delete</>
                    }
                </button>
            </div>
        </div>
    </div>
);

// ─── WalletCard ───────────────────────────────────────────────────────────────

interface WalletCardProps {
    wallet: Account;
    onEdit: (wallet: Account) => void;
    onDelete: (wallet: Account) => void;
}

const WalletCard: React.FC<WalletCardProps> = ({ wallet, onEdit, onDelete }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
            style={{ backgroundColor: wallet.color }}
        >
            {wallet.icon}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{wallet.name}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">
                {formatBalance(wallet.balance, wallet.currency)}
            </p>
            <span className="inline-block text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                {wallet.currency}
            </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
            <button
                onClick={() => onEdit(wallet)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit wallet"
            >
                <Pencil className="w-4 h-4" />
            </button>
            <button
                onClick={() => onDelete(wallet)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete wallet"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    </div>
);

// ─── WalletForm (Create / Edit) ───────────────────────────────────────────────

interface WalletFormProps {
    initial: Account | null;
    onSave: (saved: Account, action: 'created' | 'updated') => void;
    onCancel: () => void;
}

const WalletForm: React.FC<WalletFormProps> = ({ initial, onSave, onCancel }) => {
    const isEdit = initial !== null;

    const [form, setForm] = useState<FormState>(
        initial
            ? {
                  name: initial.name,
                  balance: String(initial.balance),
                  currency: initial.currency,
                  icon: initial.icon,
                  color: initial.color,
              }
            : EMPTY_FORM,
    );
    const [errors, setErrors] = useState<FormErrors>({});
    const [saving, setSaving] = useState<boolean>(false);
    const [apiError, setApiError] = useState<string>('');

    const setField =
        (field: keyof FormState) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
            setForm(prev => ({ ...prev, [field]: e.target.value }));
        };

    const setDirect = (field: keyof FormState, value: string): void => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const validate = (): FormErrors => {
        const e: FormErrors = {};
        if (!form.name.trim()) {
            e.name = 'Wallet name is required.';
        } else if (form.name.trim().length > 255) {
            e.name = 'Name must be 255 characters or less.';
        }
        if (form.balance === '') {
            e.balance = 'Balance is required.';
        } else if (isNaN(Number(form.balance))) {
            e.balance = 'Balance must be a number.';
        }
        if (form.currency && form.currency.length > 3) {
            e.currency = 'Currency code must be 3 characters max.';
        }
        return e;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) {
            setErrors(errs);
            return;
        }

        setSaving(true);
        setApiError('');
        try {
            const payload = {
                name: form.name.trim(),
                balance: Number(form.balance),
                currency: form.currency,
                icon: form.icon,
                color: form.color,
            };

            if (isEdit && initial) {
                const res = await api.put(`/accounts/${initial.id}`, payload);
                onSave(res.data.account as Account, 'updated');
            } else {
                const res = await api.post('/accounts', payload);
                onSave(res.data.account as Account, 'created');
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } };
            const serverErrors = axiosErr.response?.data?.errors;
            if (serverErrors) {
                const mapped: FormErrors = {};
                (Object.entries(serverErrors) as [string, string[]][]).forEach(([k, msgs]) => {
                    if (k in EMPTY_FORM) {
                        (mapped as Record<string, string>)[k] = msgs[0];
                    }
                });
                setErrors(mapped);
            } else {
                setApiError(axiosErr.response?.data?.message ?? 'An error occurred. Please try again.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-5">
                {/* Name */}
                <FormField label="Wallet Name *" error={errors.name}>
                    <input
                        type="text"
                        value={form.name}
                        onChange={setField('name')}
                        placeholder="e.g. My Wallet, Savings"
                        maxLength={255}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                            errors.name
                                ? 'border-red-400 bg-red-50 focus:border-red-500'
                                : 'border-gray-200 focus:border-blue-500 bg-white'
                        }`}
                    />
                </FormField>

                {/* Balance */}
                <FormField label={isEdit ? 'Balance *' : 'Opening Balance *'} error={errors.balance}>
                    <input
                        type="number"
                        value={form.balance}
                        onChange={setField('balance')}
                        placeholder="0"
                        step="any"
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                            errors.balance
                                ? 'border-red-400 bg-red-50 focus:border-red-500'
                                : 'border-gray-200 focus:border-blue-500 bg-white'
                        }`}
                    />
                </FormField>

                {/* Currency */}
                <FormField label="Currency" error={errors.currency}>
                    <select
                        value={form.currency}
                        onChange={setField('currency')}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                    >
                        {CURRENCY_OPTIONS.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </FormField>

                {/* Icon */}
                <FormField label="Icon">
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        {ICON_OPTIONS.map(icon => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setDirect('icon', icon)}
                                className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all ${
                                    form.icon === icon
                                        ? 'bg-blue-100 ring-2 ring-blue-500 scale-110'
                                        : 'bg-white hover:bg-blue-50 border border-gray-200'
                                }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </FormField>

                {/* Color */}
                <FormField label="Color">
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                        {COLOR_OPTIONS.map(color => (
                            <ColorSwatch
                                key={color}
                                color={color}
                                selected={form.color === color}
                                onClick={c => setDirect('color', c)}
                            />
                        ))}
                    </div>
                </FormField>

                {/* Live preview */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm flex-shrink-0"
                        style={{ backgroundColor: form.color }}
                    >
                        {form.icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-800">{form.name || 'Wallet Name'}</p>
                        <p className="text-xs text-gray-500">
                            {formatBalance(form.balance || '0', form.currency)} · {form.currency}
                        </p>
                    </div>
                </div>

                {/* API-level error */}
                {apiError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {apiError}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={saving}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all disabled:opacity-50 shadow-sm"
                >
                    {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />{isEdit ? 'Saving…' : 'Creating…'}</>
                    ) : (
                        <><Save className="w-4 h-4" />{isEdit ? 'Save Changes' : 'Create Wallet'}</>
                    )}
                </button>
            </div>
        </form>
    );
};

// ─── Main Modal ───────────────────────────────────────────────────────────────

interface WalletManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
    onWalletsChanged?: () => void;
}

const VIEW_TITLES: Record<ModalView, string> = {
    list: 'My Wallets',
    create: 'New Wallet',
    edit: 'Edit Wallet',
};

const WalletManagementModal: React.FC<WalletManagementModalProps> = ({
    isOpen,
    onClose,
    onWalletsChanged,
}) => {
    useTranslation();

    const [view, setView] = useState<ModalView>('list');
    const [wallets, setWallets] = useState<Account[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [editingWallet, setEditingWallet] = useState<Account | null>(null);
    const [deletingWallet, setDeletingWallet] = useState<Account | null>(null);
    const [deleteInProgress, setDeleteInProgress] = useState<boolean>(false);
    const [toast, setToast] = useState<Toast | null>(null);

    const showToast = useCallback((type: ToastType, message: string): void => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const fetchWallets = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            const res = await api.get('/accounts');
            setWallets((res.data.accounts ?? []) as Account[]);
        } catch {
            showToast('error', 'Failed to load wallets. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (isOpen) {
            setView('list');
            void fetchWallets();
        }
    }, [isOpen, fetchWallets]);

    // Keyboard: Escape closes sub-views first, then the modal
    useEffect(() => {
        const onKey = (e: KeyboardEvent): void => {
            if (e.key !== 'Escape') return;
            if (deletingWallet) { setDeletingWallet(null); return; }
            if (view !== 'list') { goToList(); return; }
            onClose();
        };
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, view, deletingWallet, onClose]);

    const goToList = (): void => {
        setView('list');
        setEditingWallet(null);
    };

    const handleFormSave = (savedWallet: Account, action: 'created' | 'updated'): void => {
        if (action === 'created') {
            setWallets(prev => [...prev, savedWallet]);
            showToast('success', `"${savedWallet.name}" created successfully!`);
        } else {
            setWallets(prev => prev.map(w => (w.id === savedWallet.id ? savedWallet : w)));
            showToast('success', `"${savedWallet.name}" updated successfully!`);
        }
        goToList();
        onWalletsChanged?.();
    };

    const handleDeleteConfirm = async (): Promise<void> => {
        if (!deletingWallet) return;
        setDeleteInProgress(true);
        try {
            await api.delete(`/accounts/${deletingWallet.id}`);
            setWallets(prev => prev.filter(w => w.id !== deletingWallet.id));
            showToast('success', `"${deletingWallet.name}" deleted successfully!`);
            onWalletsChanged?.();
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } } };
            showToast('error', axiosErr.response?.data?.message ?? 'Failed to delete. Please try again.');
        } finally {
            setDeleteInProgress(false);
            setDeletingWallet(null);
        }
    };

    const startEdit = (wallet: Account): void => {
        setEditingWallet(wallet);
        setView('edit');
    };

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={!deleteInProgress ? onClose : undefined}
                />

                {/* Panel */}
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                        {view !== 'list' && (
                            <button
                                onClick={goToList}
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div className="flex items-center gap-2 flex-1">
                            <Wallet className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-bold text-gray-900">{VIEW_TITLES[view]}</h2>
                        </div>
                        {view === 'list' && (
                            <button
                                onClick={() => setView('create')}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-sm transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                New Account
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Toast */}
                    {toast && (
                        <div
                            className={`flex items-center gap-2 mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0 ${
                                toast.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                            }`}
                        >
                            {toast.type === 'success'
                                ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                                : <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                            }
                            {toast.message}
                        </div>
                    )}

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">

                        {/* LIST */}
                        {view === 'list' && (
                            <div className="p-6">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                    </div>
                                ) : wallets.length === 0 ? (
                                    <div className="text-center py-16">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                            <Wallet className="w-8 h-8 text-blue-400" />
                                        </div>
                                        <p className="text-gray-600 font-medium mb-1">No wallets yet</p>
                                        <p className="text-sm text-gray-400 mb-5">
                                            Create your first wallet to start tracking.
                                        </p>
                                        <button
                                            onClick={() => setView('create')}
                                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-sm transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                            Create Wallet
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {wallets.map(wallet => (
                                            <WalletCard
                                                key={wallet.id}
                                                wallet={wallet}
                                                onEdit={startEdit}
                                                onDelete={setDeletingWallet}
                                            />
                                        ))}
                                        <p className="text-xs text-gray-400 text-center pt-2">
                                            {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CREATE */}
                        {view === 'create' && (
                            <div className="p-6">
                                <WalletForm
                                    initial={null}
                                    onSave={handleFormSave}
                                    onCancel={goToList}
                                />
                            </div>
                        )}

                        {/* EDIT */}
                        {view === 'edit' && editingWallet && (
                            <div className="p-6">
                                <WalletForm
                                    initial={editingWallet}
                                    onSave={handleFormSave}
                                    onCancel={goToList}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete confirmation (layered above modal) */}
            {deletingWallet && (
                <DeleteConfirmDialog
                    wallet={deletingWallet}
                    onConfirm={() => void handleDeleteConfirm()}
                    onCancel={() => setDeletingWallet(null)}
                    deleting={deleteInProgress}
                />
            )}
        </>
    );
};

export default WalletManagementModal;
