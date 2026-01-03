import React, { useState } from 'react';
import axios from 'axios';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

export default function CheckoutForm({ plan, onPaymentSuccess }) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('card');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create temporary subscription
            const subResponse = await axios.post('/api/subscriptions', {
                plan_id: plan.id
            });

            // 2. Process payment
            const paymentResponse = await axios.post('/api/payments/process', {
                subscription_id: subResponse.data.id,
                payment_gateway_id: 1, // Default gateway
                amount: plan.price,
                payment_method: paymentMethod
            });

            if (paymentResponse.data.status === 'completed') {
                onPaymentSuccess(paymentResponse.data);
            } else {
                setError(t('payment.checkout_failed') || 'Payment failed. Please try again.');
            }
        } catch (err) {
            setError(err.response?.data?.message || t('payment.checkout_error') || 'An error occurred during checkout.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden p-6 mt-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <CreditCard className="text-blue-600" /> {t('payment.checkout_title') || 'Checkout'}
            </h2>
            
            <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-100">
                <p className="text-sm text-blue-800 font-semibold uppercase tracking-wider">{t('payment.order_summary') || 'Order Summary'}</p>
                <div className="flex justify-between items-center mt-2">
                    <span className="text-gray-700 font-medium">{plan.name} {t('payment.plan_label') || 'Plan'}</span>
                    <span className="text-xl font-bold text-gray-900">${plan.price}</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">{t('payment.billed_cycle', { cycle: plan.billing_cycle }) || `Billed ${plan.billing_cycle}`}</p>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-md">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">{t('payment.method_label') || 'Payment Method'}</label>
                    <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                        <option value="card">{t('payment.credit_card') || 'Credit / Debit Card'}</option>
                        <option value="paypal">{t('payment.paypal') || 'PayPal'}</option>
                    </select>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? (t('payment.processing') || 'Processing...') : (t('payment.pay_and_subscribe', { amount: `$${plan.price}` }) || `Pay $${plan.price} & Subscribe`)}
                    </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-4">
                    <ShieldCheck size={16} className="text-green-500" />
                    <span>{t('payment.secure_transaction') || 'Secure encrypted transaction'}</span>
                </div>
            </form>
        </div>
    );
}
