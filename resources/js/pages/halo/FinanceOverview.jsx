import React, { useCallback, useEffect, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingDown, TrendingUp, Zap, CheckCircle2, ShoppingBag } from 'lucide-react';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';
import { format, parseISO } from 'date-fns';

function fmtVND(val) {
    const n = Math.abs(Number(val || 0));
    if (n >= 1_000_000) return `VND ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `VND ${(n / 1_000).toFixed(0)}K`;
    return `VND ${n.toLocaleString()}`;
}

function fmtShort(val) {
    const n = Number(val || 0);
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return String(n);
}

function StatCard({ label, value, sparkColor, positive }) {
    return (
        <div
            className="rounded-2xl p-5 flex flex-col gap-2"
            style={{ background: '#132218', border: '1px solid #1E3529' }}
        >
            <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4ADE80' }}>
                {label}
            </p>
            <p className="text-2xl font-bold text-white leading-none">{value}</p>
        </div>
    );
}

const CustomTooltipDark = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div
            className="rounded-xl px-4 py-3 text-sm shadow-xl"
            style={{ background: '#1A2E1E', border: '1px solid #2A3D30', color: '#fff' }}
        >
            <p className="font-semibold mb-1">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {fmtVND(p.value)}
                </p>
            ))}
        </div>
    );
};

export default function FinanceOverview() {
    const [dashboardData, setDashboardData] = useState(null);
    const [haloTransactions, setHaloTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [dashRes, haloRes] = await Promise.all([
                api.get('/dashboard'),
                api.get('/halo/transactions?per_page=10').catch(() => ({ data: { data: [] } })),
            ]);
            setDashboardData(dashRes.data.data);
            setHaloTransactions(haloRes.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalBalance = dashboardData?.accounts?.reduce(
        (sum, a) => sum + parseFloat(a.balance), 0
    ) || 0;

    const monthly = dashboardData?.monthly_summary;
    const monthlyExpense = Math.abs(parseFloat(monthly?.expense || 0));
    const monthlyIncome = parseFloat(monthly?.income || 0);

    const haloEarnings = haloTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount_minor || t.amount || 0), 0);

    // Income vs Expense chart (last 7 days)
    const incomeExpenseData = (() => {
        const days = [];
        const today = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            const label = months[d.getMonth()];
            const dateStr = format(d, 'yyyy-MM-dd');
            const exp = dashboardData?.seven_day_expenses?.find(x => x.date === dateStr);
            days.push({
                name: label,
                income: monthlyIncome / 7,
                expense: exp ? parseFloat(exp.total) : 0,
            });
        }
        return days;
    })();

    // Spending categories
    const categoryData = (() => {
        const cats = {};
        dashboardData?.recent_transactions?.forEach(t => {
            if (t.type === 'expense') {
                const name = t.category?.name || 'Other';
                cats[name] = (cats[name] || 0) + parseFloat(t.amount);
            }
        });
        return Object.entries(cats).map(([name, total]) => ({ name: name.split('/')[0].trim().slice(0, 9), total }));
    })();

    // Halo outcome today
    const todayOutcome = haloTransactions
        .filter(t => {
            const d = t.created_at ? t.created_at.slice(0, 10) : '';
            return d === format(new Date(), 'yyyy-MM-dd');
        })
        .reduce((sum, t) => sum + parseFloat(t.amount_minor || t.amount || 0), 0);

    const recentTx = dashboardData?.recent_transactions?.slice(0, 5) || [];

    return (
        <HaloLayout>
            <div className="p-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white">Finance - Overview</h1>
                    <p className="text-sm mt-1" style={{ color: '#4ADE80' }}>
                        Unlocked after "HELLO" is pressed
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Stat Cards */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <StatCard label="Current Balance" value={fmtVND(totalBalance)} />
                            <StatCard label="Monthly Expense" value={fmtVND(monthlyExpense)} />
                            <div
                                className="rounded-2xl p-5 flex flex-col gap-2"
                                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.4)' }}
                            >
                                <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#4ADE80' }}>
                                    Halo Earnings
                                </p>
                                <p className="text-2xl font-bold text-white leading-none">{fmtVND(haloEarnings)}</p>
                            </div>
                        </div>

                        {/* Charts row */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {/* Income vs Expense */}
                            <div
                                className="rounded-2xl p-5"
                                style={{ background: '#132218', border: '1px solid #1E3529' }}
                            >
                                <h3 className="text-sm font-semibold text-white mb-4">Income vs Expense</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <AreaChart data={incomeExpenseData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" />
                                        <XAxis dataKey="name" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<CustomTooltipDark />} />
                                        <Area type="monotone" dataKey="income" name="Income" stroke="#22C55E" strokeWidth={2} fill="url(#incGrad)" dot={false} />
                                        <Area type="monotone" dataKey="expense" name="Expense" stroke="#6366F1" strokeWidth={2} fill="url(#expGrad)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Spending Categories */}
                            <div
                                className="rounded-2xl p-5"
                                style={{ background: '#132218', border: '1px solid #1E3529' }}
                            >
                                <h3 className="text-sm font-semibold text-white mb-4">Spending Categories</h3>
                                {categoryData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={180}>
                                        <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<CustomTooltipDark />} />
                                            <Bar dataKey="total" name="Spending" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-40 text-sm" style={{ color: '#4ADE80' }}>
                                        No spending data yet
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Recent Transactions + Today's Outcome */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Transactions */}
                            <div
                                className="col-span-2 rounded-2xl p-5"
                                style={{ background: '#132218', border: '1px solid #1E3529' }}
                            >
                                <h3 className="text-sm font-semibold text-white mb-4 tracking-widest uppercase">
                                    Recent Transactions
                                </h3>
                                <div className="space-y-3">
                                    {recentTx.length === 0 && (
                                        <p className="text-sm text-center py-4" style={{ color: '#4ADE80' }}>No transactions yet</p>
                                    )}
                                    {recentTx.map((tx) => {
                                        const isIncome = tx.type === 'income';
                                        const isHalo = tx.ledger_type === 'halo';
                                        return (
                                            <div key={tx.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                                                        style={{ background: isIncome ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.2)' }}
                                                    >
                                                        {isIncome ? (
                                                            <CheckCircle2 size={14} className="text-green-400" />
                                                        ) : (
                                                            <ShoppingBag size={14} className="text-indigo-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-medium text-white leading-none">
                                                            {isHalo ? 'Halo Earn' : tx.category?.name || 'Transaction'}
                                                        </p>
                                                        {isHalo && (
                                                            <p className="text-xs mt-0.5" style={{ color: '#4ADE80' }}>8 Hours</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p
                                                        className="text-xs font-bold"
                                                        style={{ color: isIncome ? '#4ADE80' : '#F87171' }}
                                                    >
                                                        {isIncome ? '+' : '-'} VND {Number(tx.amount).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Today's Outcome */}
                            <div
                                className="rounded-2xl p-5 flex flex-col"
                                style={{ background: '#132218', border: '1px solid #1E3529' }}
                            >
                                <h3 className="text-xs font-bold tracking-widest uppercase mb-3 text-white">
                                    Today's Outcome
                                </h3>
                                <div className="flex-1 flex items-center justify-center">
                                    <p
                                        className="text-2xl font-bold text-center"
                                        style={{ color: todayOutcome >= 0 ? '#4ADE80' : '#F87171' }}
                                    >
                                        {todayOutcome >= 0 ? '+' : '-'}
                                        {fmtVND(Math.abs(todayOutcome))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </HaloLayout>
    );
}
