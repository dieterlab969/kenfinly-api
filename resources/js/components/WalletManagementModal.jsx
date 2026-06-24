import React, { useState, useEffect, useCallback } from 'react';
import {
    X, Plus, Pencil, Trash2, Wallet, CheckCircle,
    AlertCircle, Loader2, ChevronLeft, Save,
} from 'lucide-react';
import api from '../utils/api';
import { useTranslation } from '../contexts/TranslationContext';

// ─── Constants ────────────────────────────────────────────────────────────────

const ICON_OPTIONS = ['💰', '🏦', '💳', '💵', '🪙', '🏧', '💎', '🛍️', '🎯', '🚀'];

const COLOR_OPTIONS = [
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#ef4444', '#f97316', '#f59e0b', '#10b981',
    '#14b8a6', '#06b6d4', '#64748b', '#1e293b',
];

const CURRENCY_OPTIONS = ['USD', 'VND', 'EUR', 'JPY', 'GBP', 'KRW', 'SGD', 'AUD'];

const EMPTY_FORM = { name: '', balance: '', currency: 'USD', icon: '💰', color: '#3b82f6' };

const formatBalance = (amount, currency = 'USD') => {
    const num = parseFloat(String(amount)) || 0;
    if (currency === 'VND') {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(num);
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const FormField = ({ label, error, children }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
);

const ColorSwatch = ({ color, selected, onClick }) => (
    <button
        type="button"
        onClick={() => onClick(color)}
        className={`w-7 h-7 rounded-full transition-all ${selected ? 'ring-2 ring-offset-2 ring-gray-700 scale-110' : 'hover:scale-105'}`}
        style={{ backgroundColor: color }}
        aria-label={color}
    />
);

// ─── Delete Confirmation Dialog ───────────────────────────────────────────────

const DeleteConfirmDialog = ({ wallet, onConfirm, onCancel, deleting }) => (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60" onClick={!deleting ? onCancel : undefined} />
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
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    {deleting ? 'Deleting…' : 'Delete'}
                </button>
            </div>
        </div>
    </div>
);

// ─── Wallet Card ──────────────────────────────────────────────────────────────

const WalletCard = ({ wallet, onEdit, onDelete }) => (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all bg-white">
        <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
            style={{ backgroundColor: wallet.color || '#3b82f6' }}
        >
            {wallet.icon || '💰'}
        </div>
        <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{wallet.name}</p>
            <p className="text-sm font-medium text-gray-600 mt-0.5">
                {formatBalance(wallet.balance, wallet.currency)}
            </p>
            <span className="inline-block text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                {wallet.currency || 'USD'}
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

// ─── Wallet Form (Create / Edit) ──────────────────────────────────────────────

const WalletForm = ({ initial, onSave, onCancel }) => {
    const isEdit = Boolean(initial?.id);
    const [form, setForm] = useState(initial ? {
        name: initial.name || '',
        balance: initial.balance !== undefined ? String(initial.balance) : '',
        currency: initial.currency || 'USD',
        icon: initial.icon || '💰',
        color: initial.color || '#3b82f6',
    } : EMPTY_FORM);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [apiError, setApiError] = useState('');

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));
    const setDirect = (field, value) => setForm(f => ({ ...f, [field]: value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Wallet name is required.';
        else if (form.name.trim().length > 255) e.name = 'Name must be 255 characters or less.';
        if (form.balance === '' || form.balance === undefined) {
            e.balance = 'Balance is required.';
        } else if (isNaN(Number(form.balance))) {
            e.balance = 'Balance must be a number.';
        }
        if (form.currency && form.currency.length > 3) e.currency = 'Currency code must be 3 characters max.';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setSaving(true);
        setApiError('');
        try {
            const payload = {
                name: form.name.trim(),
                balance: Number(form.balance),
                currency: form.currency || 'USD',
                icon: form.icon || '💰',
                color: form.color || '#3b82f6',
            };
            let response;
            if (isEdit) {
                response = await api.put(`/accounts/${initial.id}`, payload);
                onSave(response.data.account, 'updated');
            } else {
                response = await api.post('/accounts', payload);
                onSave(response.data.account, 'created');
            }
        } catch (err) {
            const serverErrors = err.response?.data?.errors;
            if (serverErrors) {
                const mapped = {};
                Object.entries(serverErrors).forEach(([k, msgs]) => { mapped[k] = msgs[0]; });
                setErrors(mapped);
            } else {
                setApiError(err.response?.data?.message || 'An error occurred. Please try again.');
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
                        onChange={set('name')}
                        placeholder="e.g. My Wallet, Savings"
                        maxLength={255}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                            errors.name ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 bg-white'
                        }`}
                    />
                </FormField>

                {/* Balance */}
                <FormField label={isEdit ? 'Balance *' : 'Opening Balance *'} error={errors.balance}>
                    <input
                        type="number"
                        value={form.balance}
                        onChange={set('balance')}
                        placeholder="0"
                        step="any"
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm outline-none transition-colors ${
                            errors.balance ? 'border-red-400 bg-red-50 focus:border-red-500' : 'border-gray-200 focus:border-blue-500 bg-white'
                        }`}
                    />
                </FormField>

                {/* Currency */}
                <FormField label="Currency" error={errors.currency}>
                    <select
                        value={form.currency}
                        onChange={set('currency')}
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
                                onClick={(c) => setDirect('color', c)}
                            />
                        ))}
                    </div>
                </FormField>

                {/* Preview */}
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
                            {formatBalance(form.balance || 0, form.currency)} · {form.currency}
                        </p>
                    </div>
                </div>

                {/* API error */}
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

const WalletManagementModal = ({ isOpen, onClose, onWalletsChanged }) => {
    const { t } = useTranslation();

    // 'list' | 'create' | 'edit'
    const [view, setView] = useState('list');
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingWallet, setEditingWallet] = useState(null);
    const [deletingWallet, setDeletingWallet] = useState(null);
    const [deleteInProgress, setDeleteInProgress] = useState(false);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    const fetchWallets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/accounts');
            setWallets(res.data.accounts || []);
        } catch {
            showToast('error', 'Failed to load wallets. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        if (isOpen) {
            setView('list');
            fetchWallets();
        }
    }, [isOpen, fetchWallets]);

    // Close on Escape
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') {
                if (deletingWallet) { setDeletingWallet(null); return; }
                if (view !== 'list') { setView('list'); return; }
                onClose();
            }
        };
        if (isOpen) window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, view, deletingWallet, onClose]);

    const handleFormSave = (savedWallet, action) => {
        if (action === 'created') {
            setWallets(prev => [...prev, savedWallet]);
            showToast('success', `"${savedWallet.name}" created successfully!`);
        } else {
            setWallets(prev => prev.map(w => w.id === savedWallet.id ? savedWallet : w));
            showToast('success', `"${savedWallet.name}" updated successfully!`);
        }
        setView('list');
        setEditingWallet(null);
        onWalletsChanged?.();
    };

    const handleDeleteConfirm = async () => {
        if (!deletingWallet) return;
        setDeleteInProgress(true);
        try {
            await api.delete(`/accounts/${deletingWallet.id}`);
            setWallets(prev => prev.filter(w => w.id !== deletingWallet.id));
            showToast('success', `"${deletingWallet.name}" deleted successfully!`);
            onWalletsChanged?.();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to delete. Please try again.';
            showToast('error', msg);
        } finally {
            setDeleteInProgress(false);
            setDeletingWallet(null);
        }
    };

    const startEdit = (wallet) => {
        setEditingWallet(wallet);
        setView('edit');
    };

    const goToList = () => {
        setView('list');
        setEditingWallet(null);
    };

    if (!isOpen) return null;

    // ── Header title & back logic per view ────────────────────────────────
    const titles = { list: 'My Wallets', create: 'New Wallet', edit: 'Edit Wallet' };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    onClick={() => { if (!deleteInProgress) onClose(); }}
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
                            <h2 className="text-lg font-bold text-gray-900">{titles[view]}</h2>
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

                    {/* Toast notification */}
                    {toast && (
                        <div className={`flex items-center gap-2 mx-6 mt-4 px-4 py-3 rounded-xl text-sm font-medium flex-shrink-0 ${
                            toast.type === 'success'
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                        }`}>
                            {toast.type === 'success'
                                ? <CheckCircle className="w-4 h-4 flex-shrink-0 text-green-600" />
                                : <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                            }
                            {toast.message}
                        </div>
                    )}

                    {/* Body */}
                    <div className="flex-1 overflow-y-auto">

                        {/* ── LIST VIEW ── */}
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
                                        <p className="text-sm text-gray-400 mb-5">Create your first wallet to start tracking.</p>
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

                        {/* ── CREATE VIEW ── */}
                        {view === 'create' && (
                            <div className="p-6">
                                <WalletForm
                                    initial={null}
                                    onSave={handleFormSave}
                                    onCancel={goToList}
                                />
                            </div>
                        )}

                        {/* ── EDIT VIEW ── */}
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

            {/* Delete Confirmation Dialog (rendered above main modal) */}
            {deletingWallet && (
                <DeleteConfirmDialog
                    wallet={deletingWallet}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeletingWallet(null)}
                    deleting={deleteInProgress}
                />
            )}
        </>
    );
};

export default WalletManagementModal;
