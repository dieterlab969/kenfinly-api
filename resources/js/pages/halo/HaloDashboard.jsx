import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, TrendingUp, TrendingDown } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { format, parseISO } from 'date-fns';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';

const SESSION_HOURS   = 8;
const SESSION_SECONDS = SESSION_HOURS * 3600;

const VI_DAYS = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

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

function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

/* ── Window Status Badge ── */
function WindowBadge({ window: win }) {
    if (!win || win.status === 'open_on_time') {
        return (
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4ADE80', letterSpacing: '0.08em', marginBottom: 8 }}>
                ● ON TIME WINDOW OPEN · {win?.open_at ?? '06:00'} – {win?.late_from ?? '08:30'}
            </div>
        );
    }
    if (win.status === 'too_early') {
        return (
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#60A5FA', letterSpacing: '0.08em', marginBottom: 8 }}>
                ◷ CHECK-IN OPENS AT {win.open_at} · TOO EARLY
            </div>
        );
    }
    if (win.status === 'open_late') {
        return (
            <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#FBBF24', letterSpacing: '0.08em', marginBottom: 8 }}>
                ⚠ LATE ENTRY · HALF-DAY ONLY · MAX 50% RING
            </div>
        );
    }
    return null;
}

/* ── Halo Ring SVG ── */
function HaloRing({ secondsLeft, state, maxProgress }) {
    const size        = 220;
    const strokeWidth = 12;
    const radius      = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const cap = maxProgress ?? 100;

    const progress = useMemo(() => {
        if (state === 'idle')      return 0;
        if (state === 'completed') return cap;
        const raw = Math.min(100, Math.max(0, ((SESSION_SECONDS - secondsLeft) / SESSION_SECONDS) * 100));
        return Math.min(cap, raw);
    }, [secondsLeft, state, cap]);

    const offset = circumference - (progress / 100) * circumference;

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1E3529" strokeWidth={strokeWidth} />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="#22C55E" strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ filter: 'drop-shadow(0 0 6px #22C55E)', transition: 'stroke-dashoffset 1s linear' }}
                />
            </svg>
            <div style={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4ADE80', marginBottom: 4 }}>
                    THE HALO RING
                </p>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: 'white', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {formatTime(secondsLeft)}
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#86EFAC', marginTop: 4 }}>
                    {progress.toFixed(0)}%
                </p>
            </div>
        </div>
    );
}

/* ── Halo Semi-Circle Gauge ── */
const HALO_CX = 100, HALO_CY = 88, HALO_R = 68, HALO_SW = 13;
const HALO_ARC_LEN = Math.PI * HALO_R;
const HALO_LX = HALO_CX - HALO_R, HALO_RX = HALO_CX + HALO_R;
const HALO_PATH = `M ${HALO_LX} ${HALO_CY} A ${HALO_R} ${HALO_R} 0 0 1 ${HALO_RX} ${HALO_CY}`;
const GAP = 3;

function HaloGauge({ p }) {
    const income  = parseFloat(p.income  || 0);
    const expense = parseFloat(p.expense || 0);
    const net     = parseFloat(p.net     || 0);
    const total   = income + expense;
    const isPos   = net >= 0;

    let incomeDash = 0, expenseDash = 0, expOff = 0;
    if (total > 0) {
        const both = income > 0 && expense > 0;
        const rawI = (income  / total) * HALO_ARC_LEN;
        const rawE = (expense / total) * HALO_ARC_LEN;
        incomeDash  = both ? Math.max(0, rawI - GAP / 2) : rawI;
        expenseDash = both ? Math.max(0, rawE - GAP / 2) : rawE;
        expOff = -(rawI + (both ? GAP / 2 : 0));
    }

    const netStr = fmtVND(Math.abs(net));
    const fs = netStr.length > 12 ? 7.5 : netStr.length > 9 ? 8.5 : 9.5;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <p style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#86EFAC', letterSpacing: '0.06em', marginBottom: 2, textAlign: 'center' }}>
                {p.month}
            </p>

            <svg viewBox="0 0 200 92" style={{ width: '100%', maxHeight: 130 }} aria-label={p.month}>
                {/* track */}
                <path d={HALO_PATH} fill="none" stroke="#1E3529" strokeWidth={HALO_SW} strokeLinecap="round" />

                {/* income arc — green */}
                {incomeDash > 0 && (
                    <path
                        d={HALO_PATH} fill="none" stroke="#22C55E" strokeWidth={HALO_SW}
                        strokeLinecap="round"
                        strokeDasharray={`${incomeDash} ${HALO_ARC_LEN}`}
                        style={{ filter: 'drop-shadow(0 0 4px #22C55E88)' }}
                    />
                )}

                {/* expense arc — red */}
                {expenseDash > 0 && (
                    <path
                        d={HALO_PATH} fill="none" stroke="#EF4444" strokeWidth={HALO_SW}
                        strokeLinecap="round"
                        strokeDasharray={`${expenseDash} ${HALO_ARC_LEN}`}
                        strokeDashoffset={expOff}
                        style={{ filter: 'drop-shadow(0 0 4px #EF444488)' }}
                    />
                )}

                {/* % labels at caps */}
                {total > 0 && (
                    <>
                        <text x={HALO_LX - 1} y={HALO_CY + 10} textAnchor="end"   fill="#4ADE80" fontSize="7" fontWeight="700">{Math.round((income / total) * 100)}%</text>
                        <text x={HALO_RX + 1} y={HALO_CY + 10} textAnchor="start" fill="#F87171" fontSize="7" fontWeight="700">{Math.round((expense / total) * 100)}%</text>
                    </>
                )}

                {/* center net */}
                <text x={HALO_CX} y={HALO_CY - 22} textAnchor="middle"
                      fill={isPos ? '#4ADE80' : '#F87171'} fontSize={fs} fontWeight="800" letterSpacing="-0.3">
                    {isPos ? '+' : '-'}{netStr}
                </text>
                <text x={HALO_CX} y={HALO_CY - 10} textAnchor="middle" fill="#6B7280" fontSize="7">
                    Net {isPos ? '▲' : '▼'}
                </text>
            </svg>

            {/* legend */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 8px', marginTop: 2 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', flexShrink: 0 }} />
                        <span style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>Income</span>
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#4ADE80', paddingLeft: 11 }}>{fmtVND(income)}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{ fontSize: '0.625rem', color: '#9CA3AF' }}>Expense</span>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
                    </div>
                    <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#F87171', paddingRight: 11 }}>{fmtVND(expense)}</span>
                </div>
            </div>
        </div>
    );
}

/* ── Monthly Summary Widget ── */
function MonthlySummary({ monthly }) {
    if (!monthly) {
        return (
            <div className="monthly-summary-card">
                <p className="monthly-summary-title">Monthly Summary</p>
                <div className="halo-spinner"><div className="halo-spinner-ring" /></div>
            </div>
        );
    }

    return (
        <div className="monthly-summary-card">
            <p className="monthly-summary-title">Monthly Summary</p>
            <div style={{ display: 'flex', gap: 12 }}>
                <HaloGauge p={monthly.current} />
                <div style={{ width: 1, background: '#1E3529', alignSelf: 'stretch', margin: '24px 0 0' }} />
                <HaloGauge p={monthly.previous} />
            </div>
        </div>
    );
}

/* ── Dark Tooltip ── */
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

/* ── Main Component ── */
export default function HaloDashboard() {
    const [status,      setStatus]      = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [loading,     setLoading]     = useState(true);
    const [dashLoading, setDashLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [commitments, setCommitments] = useState([]);
    const [dashData,    setDashData]    = useState(null);
    const timerRef = useRef(null);

    /* ── Data fetching ── */
    const fetchStatus = useCallback(async (showLoading = false) => {
        if (showLoading) setLoading(true);
        try {
            const res = await api.get('/attendance/status');
            const data = res.data.data;
            setStatus(data);
            setSecondsLeft(data.seconds_left || 0);
        } catch (e) {
            console.error(e);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    const fetchCommitments = useCallback(async () => {
        try {
            const res = await api.get('/commitments?status=active&per_page=4');
            setCommitments(res.data.data || []);
        } catch (e) {
            console.error(e);
        }
    }, []);

    const fetchDashboard = useCallback(async () => {
        setDashLoading(true);
        try {
            const res = await api.get('/dashboard');
            setDashData(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setDashLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus(true);
        fetchCommitments();
        fetchDashboard();
    }, [fetchStatus, fetchCommitments, fetchDashboard]);

    /* ── Countdown timer ── */
    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!status || !['in_progress', 'ready'].includes(status.state)) return;

        timerRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) { fetchStatus(false); return 0; }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [status, fetchStatus]);

    /* ── Session actions ── */
    const startSession = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/attendance/start');
            setStatus(res.data.data);
            setSecondsLeft(res.data.data.seconds_left || SESSION_SECONDS);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    const completeSession = async () => {
        setActionLoading(true);
        try {
            const res = await api.post('/attendance/complete', { user_rating: 'normal' });
            setStatus(res.data.data);
            setSecondsLeft(0);
        } catch (e) {
            console.error(e);
        } finally {
            setActionLoading(false);
        }
    };

    /* ── Derived data ── */
    const state       = status?.state || 'idle';
    const streak      = status?.current_streak || 0;
    const maxProgress = status?.max_progress ?? 100;
    const window_     = status?.window ?? null;
    const canCheckIn  = window_?.can_check_in !== false;

    const sevenDayData = useMemo(() => {
        const days = [];
        const now = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = format(d, 'yyyy-MM-dd');
            const found = dashData?.seven_day_expenses?.find(e => e.date === dateStr);
            days.push({ name: VI_DAYS[d.getDay()], expense: found ? parseFloat(found.total) : 0 });
        }
        return days;
    }, [dashData]);

    const balanceData = useMemo(() => {
        if (!dashData?.balance_history) return [];
        return dashData.balance_history.map(item => ({
            date: format(parseISO(item.date), 'MMM yy'),
            balance: parseFloat(item.balance),
        }));
    }, [dashData]);

    const totalBalance = useMemo(() =>
        (dashData?.accounts || []).reduce((s, a) => s + parseFloat(a.balance || 0), 0),
    [dashData]);

    function getDaysLeft(deadline) {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
        return diff > 0 ? diff : 0;
    }

    return (
        <HaloLayout>
            <div className="halo-page">
                <header className="halo-page-header">
                    <h1 className="halo-page-title">Dashboard — The Discipline Ritual</h1>
                </header>

                {/* ════════ Row 1: Halo Ring + Monthly Summary ════════ */}
                <div className="row g-4 mb-4">
                    {/* Halo Ring */}
                    <div className="col-lg-5">
                        <div className="halo-ring-card">
                            {loading ? (
                                <div className="halo-spinner"><div className="halo-spinner-ring" /></div>
                            ) : (
                                <HaloRing secondsLeft={secondsLeft} state={state} maxProgress={maxProgress} />
                            )}

                            {/* Streak */}
                            <div className="halo-streak-row">
                                <span className="halo-streak-label">STREAK:</span>
                                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'white' }}>{streak} DAYS</span>
                                <Flame size={15} style={{ color: '#FB923C' }} />
                            </div>

                            {/* Action buttons */}
                            <div style={{ marginTop: '1.25rem', width: '100%', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                                {/* Window status badge — shown whenever user has no session yet */}
                                {state === 'idle' && !loading && (
                                    <WindowBadge window={window_} />
                                )}

                                {state === 'idle' && (
                                    <button
                                        className="halo-btn halo-btn-primary halo-btn-full"
                                        onClick={startSession}
                                        disabled={actionLoading || !canCheckIn}
                                        style={{ letterSpacing: '0.05em', fontSize: '0.8125rem' }}
                                    >
                                        BẮT ĐẦU NGHI THỨC (HELLO)
                                    </button>
                                )}
                                {state === 'in_progress' && (
                                    <div className="halo-session-in-progress">ĐANG DIỄN RA...</div>
                                )}
                                {state === 'ready' && (
                                    <button
                                        className="halo-btn halo-btn-primary halo-btn-full"
                                        onClick={completeSession}
                                        disabled={actionLoading}
                                    >
                                        HOÀN THÀNH (DONE)
                                    </button>
                                )}
                                {state === 'completed' && (
                                    <div className="halo-session-done">✓ HOÀN THÀNH HÔM NAY</div>
                                )}

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="halo-btn halo-btn-outline" style={{ flex: 1, fontSize: '0.75rem' }}>
                                        VIEW INSPIRATION
                                    </button>
                                    {state === 'ready' ? (
                                        <button
                                            className="halo-btn halo-btn-outline halo-btn-sm"
                                            onClick={completeSession}
                                            disabled={actionLoading}
                                        >
                                            DONE
                                        </button>
                                    ) : (
                                        <button className="halo-btn halo-btn-outline halo-btn-sm" disabled style={{ opacity: 0.35 }}>
                                            DONE
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="col-lg-7">
                        <MonthlySummary monthly={dashData?.monthly_summary} />
                    </div>
                </div>

                {/* ════════ Row 2: 7-Day Expenses + Balance Chart ════════ */}
                <div className="row g-4 mb-4">
                    {/* 7-Day Expenses */}
                    <div className="col-lg-6">
                        <div className="halo-card">
                            <p className="halo-card-title">Expenses — Last 7 Days</p>
                            {dashLoading ? (
                                <div className="halo-spinner" style={{ height: 160 }}><div className="halo-spinner-ring" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height={180}>
                                    <BarChart data={sevenDayData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Bar dataKey="expense" name="Expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Balance Trend */}
                    <div className="col-lg-6">
                        <div className="halo-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                <p className="halo-card-title" style={{ margin: 0 }}>Balance</p>
                                {!dashLoading && (
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '0.6875rem', color: '#6B7280', margin: 0 }}>Total amount owned:</p>
                                        <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: totalBalance >= 0 ? '#4ADE80' : '#F87171', margin: 0 }}>
                                            {fmtVND(totalBalance)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {dashLoading ? (
                                <div className="halo-spinner" style={{ height: 160 }}><div className="halo-spinner-ring" /></div>
                            ) : (
                                <ResponsiveContainer width="100%" height={170}>
                                    <AreaChart data={balanceData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1E3529" />
                                        <XAxis dataKey="date" tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis tickFormatter={fmtShort} tick={{ fill: '#86EFAC', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<DarkTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="balance"
                                            name="Balance"
                                            stroke="#3B82F6"
                                            strokeWidth={2}
                                            fill="url(#balGrad)"
                                            dot={false}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* ════════ Row 3: Active Commitments ════════ */}
                <section>
                    <p className="halo-section-label">ACTIVE COMMITMENTS</p>

                    {commitments.length === 0 ? (
                        <div style={{ background: '#132218', border: '1px solid #1E3529', borderRadius: 12, padding: '1.5rem', textAlign: 'center', color: '#6B7280', fontSize: '0.875rem' }}>
                            No active commitments.{' '}
                            <Link to="/commitments" style={{ color: '#4ADE80' }}>Add one</Link>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {commitments.slice(0, 4).map(c => {
                                const daysLeft = getDaysLeft(c.deadline);
                                return (
                                    <div key={c.id} className="col-sm-6 col-xl-3">
                                        <div className="halo-mini-commitment">
                                            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'white', marginBottom: '0.375rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {c.title}
                                            </p>
                                            {daysLeft !== null && (
                                                <p style={{ fontSize: '0.75rem', color: '#86EFAC', marginBottom: '0.5rem' }}>
                                                    {daysLeft} days remaining
                                                </p>
                                            )}
                                            <div className="halo-progress-track">
                                                <div className="halo-progress-fill" style={{ width: `${c.progress_percent || 0}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </HaloLayout>
    );
}
