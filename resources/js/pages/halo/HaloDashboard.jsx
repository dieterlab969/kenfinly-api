import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    AreaChart, Area, CartesianGrid,
} from 'recharts';

import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/TranslationContext';
import { formatCurrency } from '../../constants/categories';
import HaloLayout from '../../components/halo/HaloLayout';
import AddTransactionModal from '../../components/AddTransactionModal';

/* ──────────────────────────────────────────────────────────────
   HELPERS
────────────────────────────────────────────────────────────── */
const pad2 = (n) => String(Math.max(0, n)).padStart(2, '0');

const formatDuration = (totalSeconds) => {
    const s = Math.max(0, Number(totalSeconds || 0));
    return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
};

const DAY_SHORT_VI = { Mon: 'T2', Tue: 'T3', Wed: 'T4', Thu: 'T5', Fri: 'T6', Sat: 'T7', Sun: 'CN' };

/* ──────────────────────────────────────────────────────────────
   RING GAUGE  — full-circle SVG for the ritual card
────────────────────────────────────────────────────────────── */
const RingGauge = ({ progressPct, isActive }) => {
    const R   = 80;
    const cx  = 100;
    const cy  = 100;
    const circ = 2 * Math.PI * R; // ~502.65
    const offset = circ * (1 - Math.min(progressPct / 100, 1));

    return (
        <svg
            viewBox="0 0 200 200"
            className={`halo-ritual-card__ring-svg ${isActive ? 'halo-ring--active' : ''}`}
            aria-hidden="true"
        >
            <defs>
                <filter id="ring-glow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
            </defs>

            {/* Background track */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#1e2d1e" strokeWidth="14" />

            {/* Progress arc */}
            <circle
                cx={cx} cy={cy} r={R}
                fill="none"
                stroke="url(#ring-grad)"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
                filter={isActive ? 'url(#ring-glow)' : undefined}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
        </svg>
    );
};

/* ──────────────────────────────────────────────────────────────
   HALO GAUGE (semi-circle) — for monthly summary
────────────────────────────────────────────────────────────── */
const HaloGauge = ({ income = 0, expense = 0 }) => {
    const R       = 55;
    const cx      = 80;
    const cy      = 75;
    const halfC   = Math.PI * R;        // ~172.8
    const fullC   = 2 * Math.PI * R;    // ~345.6

    const ratio      = income > 0 ? Math.min(expense / income, 1) : 0;
    const overBudget = income > 0 && expense > income;
    const expLen     = ratio * halfC;

    // rotate(180,cx,cy) → arc starts at LEFT, sweeps clockwise through TOP to RIGHT
    const rot = `rotate(180, ${cx}, ${cy})`;

    return (
        <svg viewBox="0 0 160 90" width="100%" aria-hidden="true">
            {/* Track */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#252d45" strokeWidth="13"
                strokeDasharray={`${halfC} ${fullC}`} transform={rot} />
            {/* Income (full green base) */}
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#22c55e" strokeWidth="9"
                strokeDasharray={`${halfC} ${fullC}`} transform={rot}
                strokeLinecap="round" opacity="0.85" />
            {/* Expense overlay */}
            {income > 0 && expLen > 0 && (
                <circle cx={cx} cy={cy} r={R} fill="none"
                    stroke={overBudget ? '#ef4444' : '#f97316'}
                    strokeWidth="6"
                    strokeDasharray={`${expLen} ${fullC}`} transform={rot}
                    strokeLinecap="round" />
            )}
        </svg>
    );
};

/* ──────────────────────────────────────────────────────────────
   HALO RITUAL CARD  — Invisible Design (single circular button)
────────────────────────────────────────────────────────────── */
const HaloRitualCard = ({ onRewardCreated }) => {
    const { currentLanguage } = useTranslation();
    const isVi = currentLanguage?.code === 'vi';

    // startTime: unix timestamp (seconds) returned by the server on session start/status
    // duration:  total seconds allocated for this session (28800 pre-noon / ≤14400 post-noon)
    const [startTime,     setStartTime]     = useState(null);
    const [duration,      setDuration]      = useState(8 * 3600);
    const [secondsLeft,   setSecondsLeft]   = useState(8 * 3600);
    const [isActive,      setIsActive]      = useState(false);
    const [isDone,        setIsDone]        = useState(false);
    const [loading,       setLoading]       = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Apply server response to local state — single source of truth.
    const applySession = useCallback((d) => {
        if (d.state === 'in_progress') {
            const elapsed = Math.floor(Date.now() / 1000) - d.start_time;
            const left    = Math.max(0, d.duration - elapsed);
            setStartTime(d.start_time);
            setDuration(d.duration);
            setSecondsLeft(left);
            setIsActive(true);
            setIsDone(false);
        } else if (d.state === 'completed' || d.state === 'ready') {
            setIsActive(false);
            setIsDone(true);
            setSecondsLeft(0);
            if (d.state === 'completed') onRewardCreated?.();
        } else {
            // idle or killed — reset to default display
            const def = d.duration || 8 * 3600;
            setIsActive(false);
            setIsDone(false);
            setDuration(def);
            setSecondsLeft(def);
        }
    }, [onRewardCreated]);

    const fetchStatus = useCallback(async () => {
        try {
            setLoading(true);
            const r = await api.get('/attendance/status');
            applySession(r.data.data);
        } catch (err) {
            console.error('Halo status error', err);
        } finally {
            setLoading(false);
        }
    }, [applySession]);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    // Independent client-side countdown — zero API calls per tick.
    useEffect(() => {
        if (!isActive || startTime === null) return;

        const tick = () => {
            const elapsed = Math.floor(Date.now() / 1000) - startTime;
            const left    = Math.max(0, duration - elapsed);
            setSecondsLeft(left);
            if (left === 0) {
                setIsActive(false);
                setIsDone(true);
            }
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [isActive, startTime, duration]);

    const handlePress = async () => {
        if (isActive || isDone || actionLoading) return;
        setActionLoading(true);
        try {
            const r = await api.post('/attendance/start');
            applySession(r.data.data);
        } catch (err) {
            console.error('Halo start error', err);
        } finally {
            setActionLoading(false);
        }
    };

    const progressPct = useMemo(() => {
        if (isDone)    return 100;
        if (!isActive) return 0;
        return Math.min(100, Math.max(0, ((duration - secondsLeft) / duration) * 100));
    }, [isActive, isDone, secondsLeft, duration]);

    const todayStr = new Date().toLocaleDateString(isVi ? 'vi-VN' : 'en-US', {
        weekday: 'short', day: 'numeric', month: 'long',
    });

    if (loading) {
        return (
            <div className="halo-ritual-card">
                <div className="halo-ritual-card__loading">
                    <div className="halo-ritual-card__spinner" />
                </div>
            </div>
        );
    }

    const btnClass = [
        'halo-btn',
        isActive ? 'halo-btn--active' : '',
        isDone   ? 'halo-btn--done'   : '',
    ].filter(Boolean).join(' ');

    return (
        <div className="halo-ritual-card">
            <div className="halo-ritual-card__date">{todayStr}</div>

            <div className="halo-ritual-card__ring-wrap">
                <RingGauge progressPct={progressPct} isActive={isActive || isDone} />
                <div className="halo-ritual-card__ring-center">
                    <button
                        className={btnClass}
                        onClick={handlePress}
                        disabled={isActive || isDone || actionLoading}
                        aria-label={isVi ? 'Bắt đầu Halo' : 'Start Halo'}
                    >
                        {actionLoading ? '…' : 'Halo'}
                    </button>
                </div>
            </div>

            <div className="halo-ritual-card__timer">
                {formatDuration(secondsLeft)}
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────
   MONTHLY SUMMARY  (two arc gauges side-by-side)
────────────────────────────────────────────────────────────── */
const HaloMonthlySummary = ({ monthlySummary }) => {
    const { t, currentLanguage } = useTranslation();
    const isVi = currentLanguage?.code === 'vi';

    if (!monthlySummary?.current) return null;

    const { current, previous } = monthlySummary;

    const formatMonthLabel = (label) => {
        if (!label) return '';
        try {
            const [monthName, year] = label.split(' ');
            const monthMap = {
                January: isVi ? 'Tháng 1' : 'Jan', February: isVi ? 'Tháng 2' : 'Feb',
                March:   isVi ? 'Tháng 3' : 'Mar', April:    isVi ? 'Tháng 4' : 'Apr',
                May:     isVi ? 'Tháng 5' : 'May', June:     isVi ? 'Tháng 6' : 'Jun',
                July:    isVi ? 'Tháng 7' : 'Jul', August:   isVi ? 'Tháng 8' : 'Aug',
                September: isVi ? 'Tháng 9' : 'Sep', October: isVi ? 'Tháng 10' : 'Oct',
                November: isVi ? 'Tháng 11' : 'Nov', December: isVi ? 'Tháng 12' : 'Dec',
            };
            return `${monthMap[monthName] || monthName} ${year}`;
        } catch { return label; }
    };

    const MonthArcCol = ({ data, label }) => {
        const net = (data.income || 0) - (data.expense || 0);
        const isPos = net >= 0;

        const compactCurrency = (v) => {
            const abs = Math.abs(v);
            if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
            if (abs >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
            return formatCurrency(v);
        };

        return (
            <div className="summary-arc-col">
                <div className="summary-arc-col__month">{formatMonthLabel(label)}</div>

                <div className="summary-arc-col__gauge">
                    <HaloGauge income={data.income || 0} expense={data.expense || 0} />
                    <div className="summary-arc-col__net">
                        <div className="summary-arc-col__net-label">{isVi ? 'Còn lại' : 'Net'}</div>
                        <div className="summary-arc-col__net-value"
                            style={{ color: isPos ? '#22c55e' : '#ef4444' }}>
                            {compactCurrency(net)}
                        </div>
                    </div>
                </div>

                <div className="summary-arc-col__legend">
                    <span className="summary-arc-col__legend-item">
                        <span className="summary-arc-col__legend-dot" style={{ background: '#22c55e' }} />
                        {isVi ? 'Thu' : 'Income'}
                    </span>
                    <span className="summary-arc-col__legend-item">
                        <span className="summary-arc-col__legend-dot" style={{ background: '#f97316' }} />
                        {isVi ? 'Chi' : 'Expense'}
                    </span>
                </div>

                <div className="summary-arc-col__values">
                    <div className="summary-arc-col__value-item">
                        <div className="summary-arc-col__value-label">{isVi ? 'Thu nhập' : 'Income'}</div>
                        <div className="summary-arc-col__value-amount" style={{ color: '#22c55e' }}>
                            {compactCurrency(data.income || 0)}
                        </div>
                    </div>
                    <div className="summary-arc-col__value-item">
                        <div className="summary-arc-col__value-label">{isVi ? 'Chi tiêu' : 'Expense'}</div>
                        <div className="summary-arc-col__value-amount" style={{ color: '#ef4444' }}>
                            {compactCurrency(data.expense || 0)}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="summary-arc-container">
            <div className="halo-card">
                <div className="halo-card__title">
                    {isVi ? 'Tóm Tắt Tháng' : 'Monthly Summary'}
                </div>
                <div className="summary-arc-grid">
                    <MonthArcCol data={current}  label={current.month}  />
                    <div style={{ width: 1, background: 'var(--color-border)', flexShrink: 0, margin: '0 6px' }} />
                    <MonthArcCol data={previous} label={previous.month} />
                </div>
            </div>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────
   INSIGHTS  (Expenses – Last 7 Days)  — rendered exactly ONCE
────────────────────────────────────────────────────────────── */
const HaloInsights = ({ sevenDayExpenses, activeCommitmentsCount = 0 }) => {
    const { currentLanguage } = useTranslation();
    const isVi = currentLanguage?.code === 'vi';

    const chartData = useMemo(() => {
        const today = new Date();
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toISOString().split('T')[0];
            const dayEn = format(d, 'EEE');
            const found = sevenDayExpenses?.find(x => x.date === dateStr);
            return {
                day:    isVi ? (DAY_SHORT_VI[dayEn] || dayEn) : dayEn,
                amount: found ? parseFloat(found.total) : 0,
            };
        });
    }, [sevenDayExpenses, isVi]);

    const tickFmt = (v) => {
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
        if (v >= 1_000)     return `${(v / 1_000).toFixed(0)}k`;
        return v;
    };

    return (
        <div className="insights-section halo-card">
            <div className="insights-section__header">
                <span className="insights-section__title">
                    {isVi ? 'Chi tiêu – 7 Ngày Qua' : 'Expenses – Last 7 Days'}
                </span>
                {activeCommitmentsCount > 0 && (
                    <span className="insights-section__badge">
                        {isVi ? 'CAM KẾT ĐANG HOẠT ĐỘNG' : 'ACTIVE COMMITMENTS'}
                    </span>
                )}
            </div>

            <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }}
                        axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                        axisLine={false} tickLine={false} tickFormatter={tickFmt} width={36} />
                    <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(v) => [formatCurrency(v), isVi ? 'Chi tiêu' : 'Expense']}
                        contentStyle={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 10,
                            color: 'var(--color-text)',
                            fontSize: 12,
                        }}
                    />
                    <Bar dataKey="amount" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────
   BALANCE CHART
────────────────────────────────────────────────────────────── */
const HaloBalanceChart = ({ balanceHistory, totalBalance }) => {
    const { currentLanguage } = useTranslation();
    const isVi = currentLanguage?.code === 'vi';

    if (!balanceHistory?.length) return null;

    const chartData = balanceHistory.map(item => ({
        date:    format(parseISO(item.date), 'MMM yy'),
        balance: parseFloat(item.balance),
    }));

    const minB  = Math.min(...chartData.map(d => d.balance));
    const maxB  = Math.max(...chartData.map(d => d.balance));
    const pad   = (maxB - minB) * 0.12 || 1;
    const isNeg = totalBalance < 0;

    const tickFmt = (v) => {
        const a = Math.abs(v);
        const s = v < 0 ? '-' : '';
        if (a >= 1_000_000) return `${s}${(a / 1_000_000).toFixed(0)}M`;
        if (a >= 1_000)     return `${s}${(a / 1_000).toFixed(0)}k`;
        return `${s}${a}`;
    };

    return (
        <div className="balance-chart halo-card">
            <div className="balance-chart__header">
                <span className="balance-chart__title">
                    {isVi ? 'Số Dư' : 'Balance'}
                </span>
                <div className="balance-chart__total">
                    <div className="balance-chart__total-label">
                        {isVi ? 'Tổng tài sản' : 'Total Owned'}
                    </div>
                    <div className="balance-chart__total-value" style={{ color: isNeg ? '#ef4444' : '#22c55e' }}>
                        {formatCurrency(totalBalance)}
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={isNeg ? '#ef4444' : '#22c55e'} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={isNeg ? '#ef4444' : '#22c55e'} stopOpacity={0}    />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                        axisLine={false} tickLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }}
                        axisLine={false} tickLine={false} domain={[minB - pad, maxB + pad]}
                        tickFormatter={tickFmt} width={42} />
                    <Tooltip
                        formatter={(v) => [formatCurrency(v), isVi ? 'Số dư' : 'Balance']}
                        contentStyle={{
                            background: 'var(--color-surface-2)',
                            border: '1px solid var(--color-border)',
                            borderRadius: 10,
                            color: 'var(--color-text)',
                            fontSize: 12,
                        }}
                    />
                    <Area type="monotone" dataKey="balance"
                        stroke={isNeg ? '#ef4444' : '#22c55e'}
                        strokeWidth={2} fill="url(#balGrad)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────
   HALO DASHBOARD  (page root)
────────────────────────────────────────────────────────────── */
const HaloDashboard = () => {
    const { user } = useAuth();
    const { currentLanguage } = useTranslation();

    const [dashData,   setDashData]   = useState(null);
    const [loading,    setLoading]    = useState(true);
    const [showModal,  setShowModal]  = useState(false);
    const [modalType,  setModalType]  = useState('expense');

    const fetchDash = useCallback(async (showLoad = true) => {
        try {
            if (showLoad) setLoading(true);
            const r = await api.get('/dashboard');
            setDashData(r.data.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchDash(); }, [fetchDash]);

    const openModal = (type) => { setModalType(type); setShowModal(true); };

    const totalBalance = useMemo(() =>
        dashData?.accounts?.reduce((s, a) => s + parseFloat(a.balance), 0) || 0,
        [dashData]
    );

    const handleTransactionAdded = () => fetchDash(false);

    if (loading) {
        return (
            <HaloLayout onFabExpense={() => openModal('expense')} onFabIncome={() => openModal('income')}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        border: '3px solid #22c55e', borderTopColor: 'transparent',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
            </HaloLayout>
        );
    }

    return (
        <HaloLayout onFabExpense={() => openModal('expense')} onFabIncome={() => openModal('income')}>

            {/* 1. Halo Ritual Card */}
            <HaloRitualCard onRewardCreated={() => fetchDash(false)} />

            {/* 2. Monthly Summary Arcs */}
            <HaloMonthlySummary monthlySummary={dashData?.monthly_summary} />

            {/* 3. Expenses – Last 7 Days (rendered ONCE) */}
            <HaloInsights
                sevenDayExpenses={dashData?.seven_day_expenses}
                activeCommitmentsCount={0}
            />

            {/* 4. Balance chart */}
            <HaloBalanceChart
                balanceHistory={dashData?.balance_history}
                totalBalance={totalBalance}
            />

            {/* Transaction modal (shared by FAB and future flows) */}
            <AddTransactionModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSuccess={handleTransactionAdded}
                defaultType={modalType}
            />

            {/* Spinner keyframe (inline for safety) */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </HaloLayout>
    );
};

export default HaloDashboard;
