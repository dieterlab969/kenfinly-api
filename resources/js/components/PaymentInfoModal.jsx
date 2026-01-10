import React, { useState, useEffect } from 'react';
import { X, CreditCard, Calendar, DollarSign, History, Plus, Trash2, Star, AlertCircle, Loader2, CheckCircle, Edit2 } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import api from '../utils/api';

const PaymentInfoModal = ({ isOpen, onClose, onOpenHistory }) => {
    const { t } = useTranslation();
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddMethod, setShowAddMethod] = useState(false);
    const [addingMethod, setAddingMethod] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [editingMethod, setEditingMethod] = useState(null);
    const [updatingMethod, setUpdatingMethod] = useState(false);

    const [newMethod, setNewMethod] = useState({
        type: 'credit_card',
        last_four: '',
        brand: 'visa',
        expiry_month: '',
        expiry_year: '',
        holder_name: '',
        email: '',
        is_default: false,
    });

    const [editForm, setEditForm] = useState({
        expiry_month: '',
        expiry_year: '',
        holder_name: '',
        is_default: false,
    });

    useEffect(() => {
        if (isOpen) {
            fetchPaymentInfo();
        }
    }, [isOpen]);

    const fetchPaymentInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/payments/info');
            if (response.data.success) {
                setPaymentInfo(response.data.data);
            }
        } catch (err) {
            setError(t('payment.fetch_error') || 'Failed to load payment information');
        } finally {
            setLoading(false);
        }
    };

    const handleAddMethod = async (e) => {
        e.preventDefault();
        setAddingMethod(true);
        setError(null);

        try {
            const payload = {
                type: newMethod.type,
                is_default: newMethod.is_default,
            };

            if (newMethod.type === 'credit_card') {
                payload.last_four = newMethod.last_four;
                payload.brand = newMethod.brand;
                payload.expiry_month = newMethod.expiry_month;
                payload.expiry_year = newMethod.expiry_year;
                payload.holder_name = newMethod.holder_name;
            } else {
                payload.email = newMethod.email;
            }

            await api.post('/payments/methods', payload);
            setSuccessMessage(t('payment.method_added') || 'Payment method added successfully');
            setShowAddMethod(false);
            setNewMethod({
                type: 'credit_card',
                last_four: '',
                brand: 'visa',
                expiry_month: '',
                expiry_year: '',
                holder_name: '',
                email: '',
                is_default: false,
            });
            fetchPaymentInfo();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('payment.add_error') || 'Failed to add payment method');
        } finally {
            setAddingMethod(false);
        }
    };

    const handleDeleteMethod = async (id) => {
        if (!confirm(t('payment.confirm_delete') || 'Are you sure you want to delete this payment method?')) {
            return;
        }

        setDeletingId(id);
        setError(null);

        try {
            await api.delete(`/payments/methods/${id}`);
            setSuccessMessage(t('payment.method_deleted') || 'Payment method deleted');
            fetchPaymentInfo();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('payment.delete_error') || 'Failed to delete payment method');
        } finally {
            setDeletingId(null);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            await api.post(`/payments/methods/${id}/default`);
            setSuccessMessage(t('payment.default_updated') || 'Default payment method updated');
            fetchPaymentInfo();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('payment.default_error') || 'Failed to update default method');
        }
    };

    const handleStartEdit = (method) => {
        setEditingMethod(method);
        setEditForm({
            expiry_month: method.expiry_month || '',
            expiry_year: method.expiry_year || '',
            holder_name: method.holder_name || '',
            is_default: method.is_default || false,
        });
        setShowAddMethod(false);
    };

    const handleCancelEdit = () => {
        setEditingMethod(null);
        setEditForm({
            expiry_month: '',
            expiry_year: '',
            holder_name: '',
            is_default: false,
        });
    };

    const handleUpdateMethod = async (e) => {
        e.preventDefault();
        if (!editingMethod) return;

        if (editingMethod.type === 'credit_card') {
            if (!editForm.expiry_month || !editForm.expiry_year) {
                setError(t('payment.expiry_required') || 'Expiry month and year are required');
                return;
            }
        }

        setUpdatingMethod(true);
        setError(null);

        try {
            const payload = {
                is_default: editForm.is_default,
            };
            
            if (editingMethod.type === 'credit_card') {
                payload.expiry_month = editForm.expiry_month;
                payload.expiry_year = editForm.expiry_year;
                payload.holder_name = editForm.holder_name;
            }

            await api.put(`/payments/methods/${editingMethod.id}`, payload);
            setSuccessMessage(t('payment.method_updated') || 'Payment method updated successfully');
            setEditingMethod(null);
            fetchPaymentInfo();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err.response?.data?.message || t('payment.update_error') || 'Failed to update payment method');
        } finally {
            setUpdatingMethod(false);
        }
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    const getBrandIcon = (brand) => {
        const brands = {
            visa: 'VISA',
            mastercard: 'MC',
            amex: 'AMEX',
            discover: 'DISC',
        };
        return brands[brand?.toLowerCase()] || brand?.toUpperCase() || 'CARD';
    };

    const handleClose = () => {
        setShowAddMethod(false);
        setEditingMethod(null);
        setError(null);
        setSuccessMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">
                        {t('payment.title') || 'Payment Information'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : error && !paymentInfo ? (
                        <div className="text-center py-8">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={fetchPaymentInfo}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.try_again') || 'Try Again'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {successMessage && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{successMessage}</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-5 text-white">
                                <h3 className="text-sm font-medium text-blue-100 mb-3">
                                    {t('payment.upcoming_payment') || 'Upcoming Payment'}
                                </h3>
                                {paymentInfo?.upcoming_payment ? (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-5 h-5" />
                                                <span>{new Date(paymentInfo.upcoming_payment.date).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}</span>
                                            </div>
                                            <div className="text-2xl font-bold">
                                                {formatCurrency(paymentInfo.upcoming_payment.amount, paymentInfo.upcoming_payment.currency)}
                                            </div>
                                        </div>
                                        <div className="text-sm text-blue-100">
                                            {t('payment.plan') || 'Plan'}: {paymentInfo.upcoming_payment.plan?.charAt(0).toUpperCase() + paymentInfo.upcoming_payment.plan?.slice(1)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-100">
                                        <DollarSign className="w-5 h-5" />
                                        <span>{t('payment.no_upcoming') || 'No upcoming payments'}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {t('payment.payment_methods') || 'Payment Methods'}
                                    </h3>
                                    <button
                                        onClick={() => setShowAddMethod(!showAddMethod)}
                                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {t('payment.add_method') || 'Add Method'}
                                    </button>
                                </div>

                                {showAddMethod && (
                                    <form onSubmit={handleAddMethod} className="mb-4 p-4 bg-gray-50 rounded-lg border">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('payment.method_type') || 'Payment Type'}
                                                </label>
                                                <select
                                                    value={newMethod.type}
                                                    onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="credit_card">{t('payment.credit_card') || 'Credit Card'}</option>
                                                    <option value="paypal">{t('payment.paypal') || 'PayPal'}</option>
                                                </select>
                                            </div>

                                            {newMethod.type === 'credit_card' ? (
                                                <>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            {t('payment.card_holder') || 'Cardholder Name'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={newMethod.holder_name}
                                                            onChange={(e) => setNewMethod({ ...newMethod, holder_name: e.target.value })}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            required
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('payment.card_brand') || 'Card Brand'}
                                                            </label>
                                                            <select
                                                                value={newMethod.brand}
                                                                onChange={(e) => setNewMethod({ ...newMethod, brand: e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            >
                                                                <option value="visa">Visa</option>
                                                                <option value="mastercard">Mastercard</option>
                                                                <option value="amex">American Express</option>
                                                                <option value="discover">Discover</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('payment.last_four') || 'Last 4 Digits'}
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={newMethod.last_four}
                                                                onChange={(e) => setNewMethod({ ...newMethod, last_four: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                placeholder="1234"
                                                                maxLength={4}
                                                                required
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('payment.expiry_month') || 'Expiry Month'}
                                                            </label>
                                                            <select
                                                                value={newMethod.expiry_month}
                                                                onChange={(e) => setNewMethod({ ...newMethod, expiry_month: e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                required
                                                            >
                                                                <option value="">--</option>
                                                                {Array.from({ length: 12 }, (_, i) => {
                                                                    const month = String(i + 1).padStart(2, '0');
                                                                    return <option key={month} value={month}>{month}</option>;
                                                                })}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                {t('payment.expiry_year') || 'Expiry Year'}
                                                            </label>
                                                            <select
                                                                value={newMethod.expiry_year}
                                                                onChange={(e) => setNewMethod({ ...newMethod, expiry_year: e.target.value })}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                                required
                                                            >
                                                                <option value="">----</option>
                                                                {Array.from({ length: 15 }, (_, i) => {
                                                                    const year = String(new Date().getFullYear() + i);
                                                                    return <option key={year} value={year}>{year}</option>;
                                                                })}
                                                            </select>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('payment.paypal_email') || 'PayPal Email'}
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={newMethod.email}
                                                        onChange={(e) => setNewMethod({ ...newMethod, email: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        required
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="is_default"
                                                    checked={newMethod.is_default}
                                                    onChange={(e) => setNewMethod({ ...newMethod, is_default: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="is_default" className="text-sm text-gray-700">
                                                    {t('payment.set_as_default') || 'Set as default payment method'}
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddMethod(false)}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            >
                                                {t('common.cancel') || 'Cancel'}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={addingMethod}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {addingMethod && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {t('payment.save_method') || 'Save Method'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {editingMethod && (
                                    <form onSubmit={handleUpdateMethod} className="mb-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                            {t('payment.edit_method_title') || 'Edit Payment Method'}
                                        </h4>
                                        <div className="space-y-4">
                                            <div className="p-3 bg-white rounded border">
                                                <span className="text-sm text-gray-600">
                                                    {editingMethod.display_name}
                                                </span>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    {t('payment.card_holder') || 'Cardholder Name'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editForm.holder_name}
                                                    onChange={(e) => setEditForm({ ...editForm, holder_name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('payment.expiry_month') || 'Expiry Month'}
                                                    </label>
                                                    <select
                                                        value={editForm.expiry_month}
                                                        onChange={(e) => setEditForm({ ...editForm, expiry_month: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">--</option>
                                                        {Array.from({ length: 12 }, (_, i) => {
                                                            const month = String(i + 1).padStart(2, '0');
                                                            return <option key={month} value={month}>{month}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        {t('payment.expiry_year') || 'Expiry Year'}
                                                    </label>
                                                    <select
                                                        value={editForm.expiry_year}
                                                        onChange={(e) => setEditForm({ ...editForm, expiry_year: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="">----</option>
                                                        {Array.from({ length: 15 }, (_, i) => {
                                                            const year = String(new Date().getFullYear() + i);
                                                            return <option key={year} value={year}>{year}</option>;
                                                        })}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="edit_is_default"
                                                    checked={editForm.is_default}
                                                    onChange={(e) => setEditForm({ ...editForm, is_default: e.target.checked })}
                                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                                />
                                                <label htmlFor="edit_is_default" className="text-sm text-gray-700">
                                                    {t('payment.set_as_default') || 'Set as default payment method'}
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 mt-4">
                                            <button
                                                type="button"
                                                onClick={handleCancelEdit}
                                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                            >
                                                {t('common.cancel') || 'Cancel'}
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={updatingMethod}
                                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {updatingMethod && <Loader2 className="w-4 h-4 animate-spin" />}
                                                {t('payment.update_method') || 'Update Method'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {paymentInfo?.payment_methods?.length > 0 ? (
                                    <div className="space-y-3">
                                        {paymentInfo.payment_methods.map((method) => (
                                            <div
                                                key={method.id}
                                                className={`flex items-center justify-between p-4 rounded-lg border ${
                                                    method.is_default ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-8 rounded flex items-center justify-center text-xs font-bold ${
                                                        method.type === 'paypal' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {method.type === 'paypal' ? 'PP' : getBrandIcon(method.brand)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-900">
                                                                {method.display_name}
                                                            </span>
                                                            {method.is_default && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                                    <Star className="w-3 h-3 mr-1" />
                                                                    {t('payment.default') || 'Default'}
                                                                </span>
                                                            )}
                                                            {method.is_expired && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                                    {t('payment.expired') || 'Expired'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {method.type === 'credit_card' && method.expiry_month && method.expiry_year && (
                                                            <span className="text-sm text-gray-500">
                                                                {t('payment.expires') || 'Expires'}: {method.expiry_month}/{method.expiry_year}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {method.type === 'credit_card' && (
                                                        <button
                                                            onClick={() => handleStartEdit(method)}
                                                            className="text-gray-500 hover:text-gray-700"
                                                            title={t('payment.edit_method') || 'Edit'}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {!method.is_default && (
                                                        <button
                                                            onClick={() => handleSetDefault(method.id)}
                                                            className="text-blue-600 hover:text-blue-700 text-sm"
                                                            title={t('payment.make_default') || 'Make default'}
                                                        >
                                                            <Star className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteMethod(method.id)}
                                                        disabled={deletingId === method.id}
                                                        className="text-red-500 hover:text-red-600"
                                                        title={t('payment.delete_method') || 'Delete'}
                                                    >
                                                        {deletingId === method.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                                        <CreditCard className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>{t('payment.no_methods') || 'No payment methods saved'}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t">
                                <button
                                    onClick={() => {
                                        handleClose();
                                        onOpenHistory();
                                    }}
                                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <History className="w-5 h-5" />
                                    {t('payment.view_history') || 'View Payment History'}
                                </button>
                            </div>

                            {paymentInfo?.charge_description && (
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <AlertCircle className="w-4 h-4 inline mr-1" />
                                        {paymentInfo.charge_description}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PaymentInfoModal;
