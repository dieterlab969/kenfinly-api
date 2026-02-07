import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../../constants/categories';
import {useTranslation} from "@assets/js/contexts/TranslationContext.jsx";

const BalanceTrendChart = ({ balanceHistory, totalBalance }) => {

    const { t } = useTranslation();

    if (!balanceHistory || balanceHistory.length === 0) {
        return null;
    }

    const chartData = balanceHistory.map(item => ({
        date: format(parseISO(item.date), 'MMM yyyy'),
        balance: parseFloat(item.balance),
        fullDate: format(parseISO(item.date), 'MMMM yyyy'),
    }));

    const minBalance = Math.min(...chartData.map(d => d.balance));
    const maxBalance = Math.max(...chartData.map(d => d.balance));
    const padding = (maxBalance - minBalance) * 0.1;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">{t('balanceChart.title')}</h3>
                <div className="text-right">
                    <div className="text-xs text-gray-500">{t('balanceChart.totalAmountOwned')}</div>
                    <div className={`text-xl font-bold ${totalBalance < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        domain={[minBalance - padding, maxBalance + padding]}
                        tickFormatter={(value) => {
                            const absValue = Math.abs(value);
                            const sign = value < 0 ? '-' : '';
                            if (absValue >= 1000000) {
                                return `${sign}${(absValue / 1000000).toFixed(0)}M`;
                            }
                            if (absValue >= 1000) {
                                return `${sign}${(absValue / 1000).toFixed(0)}k`;
                            }
                            return `${sign}${absValue.toFixed(0)}`;
                        }}
                    />
                    <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        labelFormatter={(label, payload) => {
                            if (payload && payload.length > 0) {
                                return payload[0].payload.fullDate;
                            }
                            return label;
                        }}
                        contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px'
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#balanceGradient)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default BalanceTrendChart;
