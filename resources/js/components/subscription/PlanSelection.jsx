import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Check } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

export default function PlanSelection({ onSelectPlan, subscriptionsEnabled = true }) {
    const { t } = useTranslation();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/subscription-plans');
                setPlans(response.data);
            } catch (error) {
                console.error('Error fetching plans:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    if (loading) return <div className="p-8 text-center">{t('common.loading') || 'Loading plans...'}</div>;

    const formatPrice = (price, currency) => {
        if (currency === 'VND') {
            return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
        }
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(price);
    };

    return (
        <div className="py-12 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                        {t('payment.pricing_title') || 'Choose the right plan for you'}
                    </h2>
                    <p className="mt-4 text-xl text-gray-600">
                        {t('payment.pricing_subtitle') || 'Unlock premium features and take control of your finances.'}
                    </p>
                </div>
                <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
                    {plans.map((plan) => (
                        <div key={plan.id} className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200 bg-white">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900">
                                    {t(`plan.${(plan.slug || plan.name).toLowerCase().replace(/\s+/g, '_')}.name`) || plan.name}
                                </h3>
                                <p className="mt-4 text-sm text-gray-500">
                                    {t(`plan.${(plan.slug || plan.name).toLowerCase().replace(/\s+/g, '_')}.description`) || plan.description}
                                </p>
                                <p className="mt-8">
                                    <span className="text-4xl font-extrabold text-gray-900">{formatPrice(plan.price, plan.currency || 'VND')}</span>
                                    <span className="text-base font-medium text-gray-500">/{t(`plan.cycle.${plan.billing_cycle}`) || plan.billing_cycle}</span>
                                </p>
                                <button
                                    onClick={() => onSelectPlan(plan)}
                                    className="mt-8 block w-full bg-blue-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-blue-700"
                                >
                                    {subscriptionsEnabled ? (t('payment.select_plan', { plan: t(`plan.${(plan.slug || plan.name).toLowerCase().replace(/\s+/g, '_')}.name`) || plan.name }) || `Select ${plan.name}`) : (t('payment.notify_me') || 'Notify Me')}
                                </button>
                            </div>
                            <div className="pt-6 pb-8 px-6">
                                <h4 className="text-sm font-medium text-gray-900 tracking-wide uppercase">{t('payment.whats_included') || "What's included"}</h4>
                                <ul className="mt-6 space-y-4">
                                    {(plan.features || []).map((feature, idx) => (
                                        <li key={idx} className="flex space-x-3">
                                            <Check className="flex-shrink-0 h-5 w-5 text-green-500" />
                                            <span className="text-sm text-gray-500">
                                                {t(`plan.feature.${feature.toLowerCase().replace(/\s+/g, '_')}`) || feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
