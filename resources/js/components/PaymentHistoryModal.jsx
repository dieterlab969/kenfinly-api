import React, { useState, useEffect } from 'react';
import { X, History, CheckCircle, Clock, XCircle, RefreshCw, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import api from '../utils/api';

const PaymentHistoryModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [payments, setPayments] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (isOpen) {
            fetchPaymentHistory(1);
        }
    }, [isOpen]);

    const fetchPaymentHistory = async (page) => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/payments/history', {
                params: { page, per_page: 10 }
            });
            if (response.data.success) {
                setPayments(response.data.data);
                setPagination(response.data.pagination);
                setCurrentPage(page);
            }
        } catch (err) {
            setError(t('payment.history_error') || 'Failed to load payment history');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount, currency) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'USD',
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'pending':
                return <Clock className="w-5 h-5 text-yellow-500" />;
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />;
            case 'refunded':
                return <RefreshCw className="w-5 h-5 text-blue-500" />;
            default:
                return <Clock className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusLabel = (status) => {
        const labels = {
            completed: t('payment.status_completed') || 'Completed',
            pending: t('payment.status_pending') || 'Pending',
            failed: t('payment.status_failed') || 'Failed',
            refunded: t('payment.status_refunded') || 'Refunded',
        };
        return labels[status] || status;
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'refunded':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentMethodLabel = (method) => {
        const labels = {
            credit_card: t('payment.credit_card') || 'Credit Card',
            paypal: t('payment.paypal') || 'PayPal',
            other: t('payment.other') || 'Other',
        };
        return labels[method] || method;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="w-6 h-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">
                            {t('payment.history_title') || 'Payment History'}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={() => fetchPaymentHistory(currentPage)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.try_again') || 'Try Again'}
                            </button>
                        </div>
                    ) : payments.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-lg">{t('payment.no_history') || 'No payment history found'}</p>
                            <p className="text-sm mt-2">{t('payment.no_history_desc') || 'Your payment transactions will appear here.'}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {payments.map((payment) => (
                                <div
                                    key={payment.id}
                                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            {getStatusIcon(payment.status)}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">
                                                        {payment.subscription?.plan_name
                                                            ? `${payment.subscription.plan_name.charAt(0).toUpperCase()}${payment.subscription.plan_name.slice(1)} Plan`
                                                            : (t('payment.subscription') || 'Subscription')}
                                                    </span>
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                        {getStatusLabel(payment.status)}
                                                    </span>
                                                </div>
                                                <div className="mt-1 text-sm text-gray-500 space-y-1">
                                                    <p>{formatDate(payment.created_at)}</p>
                                                    <p>{getPaymentMethodLabel(payment.payment_method)} via {payment.gateway?.charAt(0).toUpperCase()}{payment.gateway?.slice(1)}</p>
                                                    <p className="text-xs text-gray-400">{t('payment.transaction_id') || 'Transaction'}: {payment.transaction_id}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-lg font-bold ${
                                                payment.status === 'refunded' ? 'text-blue-600' :
                                                payment.status === 'completed' ? 'text-gray-900' : 'text-gray-500'
                                            }`}>
                                                {payment.status === 'refunded' && '-'}
                                                {formatCurrency(payment.amount, payment.currency)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {pagination && pagination.last_page > 1 && (
                    <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                            {t('payment.showing') || 'Showing'} {((pagination.current_page - 1) * pagination.per_page) + 1} - {Math.min(pagination.current_page * pagination.per_page, pagination.total)} {t('payment.of') || 'of'} {pagination.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchPaymentHistory(currentPage - 1)}
                                disabled={currentPage === 1 || loading}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-sm text-gray-600">
                                {currentPage} / {pagination.last_page}
                            </span>
                            <button
                                onClick={() => fetchPaymentHistory(currentPage + 1)}
                                disabled={currentPage === pagination.last_page || loading}
                                className="p-2 rounded-lg border border-gray-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistoryModal;
