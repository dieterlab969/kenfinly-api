import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../../constants/categories';
import { useTranslation } from '../../contexts/TranslationContext';
import { parse, format as dateFnsFormat } from 'date-fns';

const MonthlySummaryCard = ({ monthlySummary }) => {
    if (!monthlySummary) return null;
    const { t, currentLanguage } = useTranslation();

    const { current, previous } = monthlySummary;

    const formatMonthLabel = (label) => {
        try {
            // Assume label is in format "Month YYYY" (e.g., "February 2026")
            const date = parse(label, 'MMMM yyyy', new Date());
            const monthIndex = date.getMonth(); // 0-11
            const year = date.getFullYear();

            const monthKeys = [
                'jan', 'feb', 'mar', 'apr', 'may', 'jun',
                'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
            ];

            const translatedMonth = t(`balanceChart.month_full_${monthKeys[monthIndex]}`);

            return `${translatedMonth} ${year}`;
        } catch (e) {
            return label;
        }
    };

    const MonthColumn = ({ data, label }) => {
        const isNegative = data.net < 0;
        const localizedLabel = formatMonthLabel(label);

        return (
            <div className="flex-1">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">{localizedLabel}</h4>
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
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">{t('monthlySummary.title')}</h3>
            <div className="flex gap-4 md:gap-6 items-stretch">
                <MonthColumn data={current} label={current.month} />
                <div className="w-px bg-gray-200 self-stretch mx-1 md:mx-2"></div>
                <MonthColumn data={previous} label={previous.month} />
            </div>
        </div>
    );
};

export default MonthlySummaryCard;
