import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../constants/categories';
import {useTranslation} from "@assets/js/contexts/TranslationContext.jsx";

const MonthlySummaryCard = ({ monthlySummary }) => {
    if (!monthlySummary) return null;
    const { t } = useTranslation();

    const { current, previous } = monthlySummary;

    const MonthColumn = ({ data, label }) => {
        const isNegative = data.net < 0;
        return (
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{label}</h4>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                            <span className="text-sm text-gray-600">{t('monthlySummary.income')}</span>
                        </div>
                        <span className="text-sm font-bold text-green-600">
                            {formatCurrency(data.income)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                            <span className="text-sm text-gray-600">{t('monthlySummary.expense')}</span>
                        </div>
                        <span className="text-sm font-bold text-red-600">
                            {formatCurrency(data.expense)}
                        </span>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">{t('monthlySummary.total')}</span>
                            <span className={`text-base font-bold ${isNegative ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(data.net)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('monthlySummary.title')}</h3>
            <div className="flex flex-col md:flex-row gap-6 md:items-stretch">
                <MonthColumn data={current} label={current.month} />
                <div className="hidden md:block w-px bg-gray-200 self-stretch mx-2"></div>
                <MonthColumn data={previous} label={previous.month} />
            </div>
        </div>
    );
};

export default MonthlySummaryCard;
