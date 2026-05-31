import React from 'react';
import { formatCurrency } from '../../constants/categories';
import { useTranslation } from '../../contexts/TranslationContext';
import { parse } from 'date-fns';

// ─── SVG Gauge Constants ────────────────────────────────────────────────────
const CX         = 100;   // center x
const CY         = 90;    // center y (at the bottom edge so top-half shows)
const R          = 70;    // radius
const SW         = 14;    // stroke width (ring thickness)
const ARC_LEN    = Math.PI * R;  // half-circumference ≈ 219.9
const GAP        = 3;     // gap in px between income & expense arcs
const LX         = CX - R;      // left endpoint x  = 30
const RX         = CX + R;      // right endpoint x = 170
const ARC_PATH   = `M ${LX} ${CY} A ${R} ${R} 0 0 1 ${RX} ${CY}`;

// ─── Semi-Circle Gauge ──────────────────────────────────────────────────────
const GaugeChart = ({ income, expense, net, label }) => {
    const { t } = useTranslation();
    const isPositive = net >= 0;

    const total = income + expense;
    let incomeDash  = 0;
    let expenseDash = 0;
    let expenseOffset = 0;

    if (total > 0) {
        // proportional arc lengths
        const rawIncome  = (income  / total) * ARC_LEN;
        const rawExpense = (expense / total) * ARC_LEN;

        // shrink both sides by GAP/2 so a visual gap appears between arcs
        const bothPresent = income > 0 && expense > 0;
        incomeDash   = bothPresent ? Math.max(0, rawIncome  - GAP / 2) : rawIncome;
        expenseDash  = bothPresent ? Math.max(0, rawExpense - GAP / 2) : rawExpense;
        // expense arc starts AFTER income arc + gap
        expenseOffset = -(rawIncome + (bothPresent ? GAP / 2 : 0));
    } else {
        // no data → show full gray track (handled by bg arc)
    }

    // net label size — shrink to fit
    const netStr = formatCurrency(Math.abs(net));
    const netFontSize = netStr.length > 10 ? 9 : netStr.length > 7 ? 10.5 : 12;

    return (
        <div className="flex-1 flex flex-col items-center">
            {/* Month label */}
            <p className="text-xs font-semibold text-gray-500 mb-1 tracking-wide uppercase text-center">
                {label}
            </p>

            {/* SVG gauge — viewBox crops the bottom half of the circle away */}
            <svg
                viewBox="0 0 200 95"
                className="w-full"
                style={{ maxHeight: 130 }}
                aria-label={`${label} gauge`}
            >
                {/* ── Background track ── */}
                <path
                    d={ARC_PATH}
                    fill="none"
                    stroke="#e9ecef"
                    strokeWidth={SW}
                    strokeLinecap="round"
                />

                {/* ── Income arc (green) — left to income point ── */}
                {incomeDash > 0 && (
                    <path
                        d={ARC_PATH}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth={SW}
                        strokeLinecap="round"
                        strokeDasharray={`${incomeDash} ${ARC_LEN}`}
                        strokeDashoffset={0}
                    />
                )}

                {/* ── Expense arc (orange-red) — income point to right ── */}
                {expenseDash > 0 && (
                    <path
                        d={ARC_PATH}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={SW}
                        strokeLinecap="round"
                        strokeDasharray={`${expenseDash} ${ARC_LEN}`}
                        strokeDashoffset={expenseOffset}
                    />
                )}

                {/* ── Left cap label: Income % ── */}
                {total > 0 && (
                    <text
                        x={LX - 1}
                        y={CY + 10}
                        textAnchor="end"
                        fill="#10b981"
                        fontSize="7.5"
                        fontWeight="700"
                    >
                        {Math.round((income / total) * 100)}%
                    </text>
                )}

                {/* ── Right cap label: Expense % ── */}
                {total > 0 && (
                    <text
                        x={RX + 1}
                        y={CY + 10}
                        textAnchor="start"
                        fill="#f97316"
                        fontSize="7.5"
                        fontWeight="700"
                    >
                        {Math.round((expense / total) * 100)}%
                    </text>
                )}

                {/* ── Center: net balance ── */}
                <text
                    x={CX}
                    y={CY - 24}
                    textAnchor="middle"
                    fill={isPositive ? '#10b981' : '#ef4444'}
                    fontSize={netFontSize}
                    fontWeight="800"
                    letterSpacing="-0.3"
                >
                    {isPositive ? '+' : '-'}{netStr}
                </text>

                {/* ── Center: net label ── */}
                <text
                    x={CX}
                    y={CY - 11}
                    textAnchor="middle"
                    fill="#9ca3af"
                    fontSize="7.5"
                    fontWeight="500"
                >
                    {t('monthlySummary.total')} {isPositive ? '▲' : '▼'}
                </text>
            </svg>

            {/* ── Legend row ── */}
            <div className="w-full flex justify-between items-start mt-1 px-2 gap-1">
                {/* Income legend */}
                <div className="flex flex-col items-start">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                        <span className="text-xs text-gray-500 leading-none">{t('monthlySummary.income')}</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 leading-none pl-3">
                        {formatCurrency(income)}
                    </span>
                </div>

                {/* Expense legend */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-xs text-gray-500 leading-none">{t('monthlySummary.expense')}</span>
                        <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                    </div>
                    <span className="text-xs font-bold text-orange-500 leading-none pr-3">
                        {formatCurrency(expense)}
                    </span>
                </div>
            </div>
        </div>
    );
};

// ─── Month Label Formatter ──────────────────────────────────────────────────
const useFormatMonthLabel = () => {
    const { t, currentLanguage } = useTranslation();

    return (label) => {
        try {
            const date = parse(label, 'MMMM yyyy', new Date());
            const monthIndex = date.getMonth();
            const year       = date.getFullYear();
            const monthKeys  = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
            const translated = t(`balanceChart.month_full_${monthKeys[monthIndex]}`);
            return currentLanguage === 'vi'
                ? `${translated.trim()}, ${year}`
                : `${translated} ${year}`;
        } catch {
            return label;
        }
    };
};

// ─── Main Card ──────────────────────────────────────────────────────────────
const MonthlySummaryCard = ({ monthlySummary }) => {
    if (!monthlySummary) return null;
    const { t } = useTranslation();
    const formatMonthLabel = useFormatMonthLabel();

    const { current, previous } = monthlySummary;

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">
                {t('monthlySummary.title')}
            </h3>

            <div className="flex gap-3 md:gap-6 items-start">
                <GaugeChart
                    income={parseFloat(current.income)  || 0}
                    expense={parseFloat(current.expense) || 0}
                    net={parseFloat(current.net) || 0}
                    label={formatMonthLabel(current.month)}
                />

                {/* Divider */}
                <div className="w-px bg-gray-200 self-stretch mx-0 md:mx-1 mt-6" />

                <GaugeChart
                    income={parseFloat(previous.income)  || 0}
                    expense={parseFloat(previous.expense) || 0}
                    net={parseFloat(previous.net) || 0}
                    label={formatMonthLabel(previous.month)}
                />
            </div>
        </div>
    );
};

export default MonthlySummaryCard;
