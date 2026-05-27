import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { TrendingDown, TrendingUp, CheckCircle2, ShoppingBag, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';

function fmtVND(val) {
    const n = Math.round(Number(val || 0));
    return new Intl.NumberFormat('vi-VN').format(n) + ' đ';
}

function fmtShort(val) {
    const n = Number(val || 0);
    const abs = Math.abs(n);
    if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
    if (abs >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
    return String(Math.round(n));
}

const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="halo-tooltip-box">
            <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
            {payload.map(p => (
                <p key={p.dataKey} style={{ color: p.color, margin: 0 }}>
                    {p.name}: {fmtVND(p.value)}
                </p>
            ))}
        </div>
    );
};

/* ══════════════════════════════════════════════════
   ADD INCOME MODAL
══════════════════════════════════════════════════ */
function AddIncomeModal({ categories, accounts, onClose, onCreated }) {
    const [form, setForm] = useState({
        account_id:       '',
        category_id:      '',
        amount:           '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        notes:            '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const incomeCategories = categories.filter(c => c.type === 'income');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.account_id)  { setError('Please select an account.'); return; }
        if (!form.category_id) { setError('Please select a category.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/transactions', { ...form, type: 'income' });
            onCreated();
        } catch (err) {
            const msgs = err.response?.data?.errors;
            setError(msgs ? Object.values(msgs).flat().join(', ') : (err.response?.data?.message || 'Failed to add income.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="halo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Income">
            <div className="halo-modal">
                <div className="halo-modal-header">
                    <h2 className="halo-modal-title" style={{ color: '#4ADE80' }}>
                        <TrendingUp size={18} style={{ marginRight: 6 }} />
                        Add Income
                    </h2>
                    <button className="halo-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="halo-form-error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="inc-account">Account *</label>
                        <select
                            id="inc-account"
                            name="account_id"
                            className="halo-select"
                            value={form.account_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">— Select account —</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({fmtVND(a.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="inc-category">Category *</label>
                        <select
                            id="inc-category"
                            name="category_id"
                            className="halo-select"
                            value={form.category_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">— Select category —</option>
                            {incomeCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="inc-amount">Amount (VND) *</label>
                        <input
                            id="inc-amount"
                            name="amount"
                            type="number"
                            className="halo-input"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="e.g. 1000000"
                            min="1"
                            step="1"
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="inc-date">Date *</label>
                        <input
                            id="inc-date"
                            name="transaction_date"
                            type="date"
                            className="halo-input"
                            value={form.transaction_date}
                            onChange={handleChange}
                            style={{ colorScheme: 'dark' }}
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="inc-notes">Notes</label>
                        <textarea
                            id="inc-notes"
                            name="notes"
                            className="halo-textarea"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Optional note..."
                            rows={3}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <button type="button" className="halo-btn halo-btn-outline" style={{ flex: 1 }} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="halo-btn"
                            style={{ flex: 1, background: '#22C55E', color: '#0B1810' }}
                            disabled={loading}
                        >
                            {loading ? 'Saving…' : 'ADD INCOME'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   ADD EXPENSE MODAL
══════════════════════════════════════════════════ */
function AddExpenseModal({ categories, accounts, onClose, onCreated }) {
    const [form, setForm] = useState({
        account_id:       '',
        category_id:      '',
        amount:           '',
        transaction_date: format(new Date(), 'yyyy-MM-dd'),
        notes:            '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState('');

    const expenseCategories = categories.filter(c => c.type === 'expense');

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.account_id)  { setError('Please select an account.'); return; }
        if (!form.category_id) { setError('Please select a category.'); return; }
        setLoading(true);
        setError('');
        try {
            await api.post('/transactions', { ...form, type: 'expense' });
            onCreated();
        } catch (err) {
            const msgs = err.response?.data?.errors;
            setError(msgs ? Object.values(msgs).flat().join(', ') : (err.response?.data?.message || 'Failed to add expense.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="halo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Expense">
            <div className="halo-modal">
                <div className="halo-modal-header">
                    <h2 className="halo-modal-title" style={{ color: '#F87171' }}>
                        <TrendingDown size={18} style={{ marginRight: 6 }} />
                        Add Expense
                    </h2>
                    <button className="halo-modal-close" onClick={onClose} aria-label="Close">
                        <X size={20} />
                    </button>
                </div>

                {error && <div className="halo-form-error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="exp-account">Account *</label>
                        <select
                            id="exp-account"
                            name="account_id"
                            className="halo-select"
                            value={form.account_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">— Select account —</option>
                            {accounts.map(a => (
                                <option key={a.id} value={a.id}>
                                    {a.name} ({fmtVND(a.balance)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="exp-category">Category *</label>
                        <select
                            id="exp-category"
                            name="category_id"
                            className="halo-select"
                            value={form.category_id}
                            onChange={handleChange}
                            required
                        >
                            <option value="">— Select category —</option>
                            {expenseCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="exp-amount">Amount (VND) *</label>
                        <input
                            id="exp-amount"
                            name="amount"
                            type="number"
                            className="halo-input"
                            value={form.amount}
                            onChange={handleChange}
                            placeholder="e.g. 500000"
                            min="1"
                            step="1"
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="exp-date">Date *</label>
                        <input
                            id="exp-date"
                            name="transaction_date"
                            type="date"
                            className="halo-input"
                            value={form.transaction_date}
                            onChange={handleChange}
                            style={{ colorScheme: 'dark' }}
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="exp-notes">Notes</label>
                        <textarea
                            id="exp-notes"
                            name="notes"
                            className="halo-textarea"
                            value={form.notes}
                            onChange={handleChange}
                            placeholder="Optional note..."
                            rows={3}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <button type="button" className="halo-btn halo-btn-outline" style={{ flex: 1 }} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="halo-btn"
                            style={{ flex: 1, background: '#EF4444', color: 'white' }}
                            disabled={loading}
                        >
                            {loading ? 'Saving…' : 'ADD EXPENSE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */
export default function FinanceOverview() {
    const [dashboardData,    setDashboardData]    = useState(null);
    const [haloTransactions, setHaloTransactions] = useState([]);
    const [categories,       setCategories]       = useState([]);
    const [accounts,         setAccounts]         = useState([]);
    const [loading,          setLoading]          = useState(true);
    const [showAddIncome,    setShowAddIncome]    = useState(false);
    const [showAddExpense,   setShowAddExpense]   = useState(false);

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

    /* Fetch categories + accounts once */
    useEffect(() => {
        api.get('/categories').then(r  => setCategories(r.data.data  || [])).catch(console.error);
        api.get('/accounts').then(r    => setAccounts(r.data.data    || [])).catch(console.error);
    }, []);

    /* ── Derived values ── */
    const totalBalance = useMemo(() =>
        (dashboardData?.accounts || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0),
    [dashboardData]);

    const monthly        = dashboardData?.monthly_summary?.current;
    const monthlyExpense = Math.abs(parseFloat(monthly?.expense || 0));
    const monthlyIncome  = parseFloat(monthly?.income  || 0);

    const haloEarnings = useMemo(() =>
        haloTransactions
            .filter(t => t.type === 'income')
            .reduce((s, t) => s + parseFloat(t.amount_minor || t.amount || 0), 0),
    [haloTransactions]);

    const sevenDayChartData = useMemo(() => {
        const VI_DAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        const today   = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d    = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const dateStr = format(d, 'yyyy-MM-dd');
            const exp  = dashboardData?.seven_day_expenses?.find(x => x.date === dateStr);
            return {
                name:    VI_DAYS[d.getDay()],
                income:  monthlyIncome / 7,
                expense: exp ? parseFloat(exp.total) : 0,
            };
        });
    }, [dashboardData, monthlyIncome]);

    const categoryData = useMemo(() => {
        const cats = {};
        (dashboardData?.recent_transactions || []).forEach(t => {
            if (t.type === 'expense') {
                const name = t.category?.name || 'Other';
                cats[name] = (cats[name] || 0) + parseFloat(t.amount);
            }
        });
        return Object.entries(cats).map(([name, total]) => ({
            name:  name.split('/')[0].trim().slice(0, 9),
            total,
        }));
    }, [dashboardData]);

    const recentTx = dashboardData?.recent_transactions?.slice(0, 6) || [];

    const todayOutcome = useMemo(() => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        return haloTransactions
            .filter(t => (t.created_at || '').slice(0, 10) === todayStr)
            .reduce((s, t) => s + parseFloat(t.amount_minor || t.amount || 0), 0);
    }, [haloTransactions]);

    const handleTransactionCreated = () => {
        setShowAddIncome(false);
        setShowAddExpense(false);
        fetchData();
    };

    return (
        <HaloLayout>
            <div className="halo-page">
                {/* ── Page Header ── */}
                <header className="halo-page-header d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        <h1 className="halo-page-title">Finance — Overview</h1>
                        <p className="halo-page-subtitle">Track income, expenses, and your financial health</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                        <button
                            className="halo-btn halo-btn-income"
                            onClick={() => setShowAddIncome(true)}
                        >
                            <Plus size={15} />
                            Add Income
                        </button>
                        <button
                            className="halo-btn halo-btn-expense"
                            onClick={() => setShowAddExpense(true)}
                        >
                            <Plus size={15} />
                            Add Expense
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="halo-loading-page"><div className="halo-spinner-ring" /></div>
                ) : (
                    <>
                        {/* ── Stat Cards ── */}
                        <div className="row g-3 mb-4">
                            <div className="col-sm-4">
                                <div className="halo-card">
                                    <p className="halo-stat-label">Current Balance</p>
                                    <p className="halo-stat-value" style={{ color: totalBalance >= 0 ? '#4ADE80' : '#F87171' }}>
                                        {fmtVND(totalBalance)}
                                    </p>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="halo-card">
                                    <p className="halo-stat-label">Monthly Income</p>
                                    <p className="halo-stat-value" style={{ color: '#4ADE80' }}>{fmtVND(monthlyIncome)}</p>
                                </div>
                            </div>
                            <div className="col-sm-4">
                                <div className="halo-card-accent">
                                    <p className="halo-stat-label">Halo Earnings</p>
                                    <p className="halo-stat-value">{fmtVND(haloEarnings)}</p>
                                </div>
                            </div>
                        </div>

                        {/* ── Monthly Summary inline ── */}
                        <div className="row g-3 mb-4">
                            {[dashboardData?.monthly_summary?.current, dashboardData?.monthly_summary?.previous]
                                .filter(Boolean)
                                .map((p, i) => {
                                    const net = parseFloat(p.net || 0);
                                    return (
                                        <div key={i} className="col-md-6">
                                            <div className="halo-card">
                                                <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white', marginBottom: '0.625rem' }}>
                                                    {p.month}
                                                </p>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                                        <span style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <TrendingUp size={12} style={{ color: '#4ADE80' }} /> Income:
                                                        </span>
                                                        <span style={{ color: '#4ADE80', fontWeight: 600 }}>{fmtVND(p.income)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                                        <span style={{ color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                            <TrendingDown size={12} style={{ color: '#F87171' }} /> Expense:
                                                        </span>
                                                        <span style={{ color: '#E5E7EB', fontWeight: 500 }}>{fmtVND(p.expense)}</span>
                                                    </div>
                                                    <hr style={{ borderColor: '#1E3529', margin: '0.375rem 0' }} />
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                                                        <span style={{ color: '#E5E7EB', fontWeight: 600 }}>Total:</span>
                                                        <span style={{ color: net >= 0 ? '#4ADE80' : '#F87171', fontWeight: 700 }}>{fmtVND(net)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* ── Charts ── */}
                        <div className="row g-4 mb-4">
                            {/* Income vs Expense */}
                            <div className="col-lg-6">
                                <div className="halo-card">
                                    <p className="halo-card-title">Income vs Expense — Last 7 Days</p>
                                    <ResponsiveContainer width="100%" height={190}>
                                        <AreaChart data={sevenDayChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#22C55E" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor="#6366F1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" />
                                            <XAxis dataKey="name" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                            <Tooltip content={<DarkTooltip />} />
                                            <Area type="monotone" dataKey="income"  name="Income"  stroke="#22C55E" strokeWidth={2} fill="url(#incGrad)" dot={false} />
                                            <Area type="monotone" dataKey="expense" name="Expense" stroke="#6366F1" strokeWidth={2} fill="url(#expGrad)" dot={false} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Spending Categories */}
                            <div className="col-lg-6">
                                <div className="halo-card">
                                    <p className="halo-card-title">Spending Categories</p>
                                    {categoryData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height={190}>
                                            <BarChart data={categoryData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                                <Tooltip content={<DarkTooltip />} />
                                                <Bar dataKey="total" name="Spending" fill="#4ADE80" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80', fontSize: '0.875rem' }}>
                                            No spending data yet
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ── Recent Transactions + Today's Outcome ── */}
                        <div className="row g-4">
                            <div className="col-lg-8">
                                <div className="halo-card h-100">
                                    <p className="halo-section-label">Recent Transactions</p>
                                    {recentTx.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#4ADE80', fontSize: '0.875rem', padding: '1.5rem 0' }}>
                                            No transactions yet. Use the buttons above to add one!
                                        </p>
                                    ) : (
                                        <div>
                                            {recentTx.map(tx => {
                                                const isIncome = tx.type === 'income';
                                                const isHalo   = tx.ledger_type === 'halo';
                                                return (
                                                    <div key={tx.id} className="halo-tx-row">
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <div className={`halo-tx-icon ${isIncome ? 'income' : 'expense'}`}>
                                                                {isIncome
                                                                    ? <CheckCircle2 size={14} style={{ color: '#4ADE80' }} />
                                                                    : <ShoppingBag  size={14} style={{ color: '#818CF8' }} />
                                                                }
                                                            </div>
                                                            <div>
                                                                <p style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'white', margin: 0 }}>
                                                                    {isHalo ? 'Halo Earn' : (tx.category?.name || 'Transaction')}
                                                                </p>
                                                                {isHalo && (
                                                                    <p style={{ fontSize: '0.75rem', color: '#4ADE80', margin: 0 }}>8 Hours</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p style={{ fontSize: '0.8125rem', fontWeight: 700, margin: 0, color: isIncome ? '#4ADE80' : '#F87171' }}>
                                                            {isIncome ? '+' : '−'} {fmtVND(tx.amount)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <div className="halo-outcome-box">
                                    <p className="halo-section-label">Today's Outcome</p>
                                    <p className="halo-outcome-value" style={{ color: todayOutcome >= 0 ? '#4ADE80' : '#F87171' }}>
                                        {todayOutcome >= 0 ? '+' : '−'}
                                        {fmtVND(Math.abs(todayOutcome))}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* ── Add Income Modal ── */}
            {showAddIncome && (
                <AddIncomeModal
                    categories={categories}
                    accounts={accounts}
                    onClose={() => setShowAddIncome(false)}
                    onCreated={handleTransactionCreated}
                />
            )}

            {/* ── Add Expense Modal ── */}
            {showAddExpense && (
                <AddExpenseModal
                    categories={categories}
                    accounts={accounts}
                    onClose={() => setShowAddExpense(false)}
                    onCreated={handleTransactionCreated}
                />
            )}
        </HaloLayout>
    );
}
