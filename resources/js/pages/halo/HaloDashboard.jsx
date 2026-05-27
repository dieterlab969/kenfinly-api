import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';
import { formatCurrency } from '../../constants/categories';

const SESSION_HOURS = 8;
const SESSION_SECONDS = SESSION_HOURS * 3600;

function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':');
}

function HaloRing({ secondsLeft, state }) {
    const size = 260;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = useMemo(() => {
        if (state === 'idle') return 0;
        if (state === 'completed') return 100;
        return Math.min(100, Math.max(0, ((SESSION_SECONDS - secondsLeft) / SESSION_SECONDS) * 100));
    }, [secondsLeft, state]);

    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
                {/* Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#1E3529"
                    strokeWidth={strokeWidth}
                />
                {/* Progress */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="#22C55E"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        filter: 'drop-shadow(0 0 8px #22C55E) drop-shadow(0 0 16px #16A34A)',
                        transition: 'stroke-dashoffset 1s linear',
                    }}
                />
            </svg>
            {/* Center content */}
            <div className="relative text-center z-10">
                <p className="text-xs font-semibold tracking-widest mb-1" style={{ color: '#4ADE80' }}>
                    THE HALO RING
                </p>
                <p className="text-4xl font-bold tracking-tight text-white leading-none">
                    {formatTime(secondsLeft)}
                </p>
                <p className="text-sm font-medium mt-2" style={{ color: '#86EFAC' }}>
                    {progress.toFixed(0)}%
                </p>
            </div>
        </div>
    );
}

export default function HaloDashboard() {
    const [status, setStatus] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [commitments, setCommitments] = useState([]);
    const timerRef = useRef(null);

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

    useEffect(() => {
        fetchStatus(true);
        fetchCommitments();
    }, [fetchStatus, fetchCommitments]);

    useEffect(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!status || !['in_progress', 'ready'].includes(status.state)) return;

        timerRef.current = setInterval(() => {
            setSecondsLeft(s => {
                if (s <= 1) {
                    fetchStatus(false);
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => clearInterval(timerRef.current);
    }, [status, fetchStatus]);

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

    const state = status?.state || 'idle';
    const streak = status?.current_streak || 0;

    function getDaysLeft(deadline) {
        if (!deadline) return null;
        const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
        return diff > 0 ? diff : 0;
    }

    return (
        <HaloLayout>
            <div className="p-8">
                {/* Header */}
                <h1 className="text-2xl font-bold text-white mb-8">
                    Dashboard - The Discipline Ritual
                </h1>

                {/* Halo Ring area */}
                <div className="flex flex-col items-center mb-8">
                    {loading ? (
                        <div className="w-64 h-64 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : (
                        <HaloRing secondsLeft={secondsLeft} state={state} />
                    )}

                    {/* Streak */}
                    <div className="flex items-center gap-2 mt-5">
                        <span className="text-sm font-semibold tracking-widest" style={{ color: '#86EFAC' }}>
                            STREAK:
                        </span>
                        <span className="text-sm font-bold text-white">{streak} DAYS</span>
                        <Flame size={16} className="text-orange-400" />
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3 mt-6 w-full max-w-xs">
                        {state === 'idle' && (
                            <button
                                onClick={startSession}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl text-sm font-bold tracking-widest transition-all disabled:opacity-60 active:scale-95"
                                style={{ background: '#22C55E', color: '#0B1810', letterSpacing: '0.05em' }}
                            >
                                BẮT ĐẦU NGHI THỨC (HELLO)
                            </button>
                        )}

                        {state === 'in_progress' && (
                            <div
                                className="w-full py-3 rounded-xl text-sm font-bold tracking-widest text-center"
                                style={{ background: 'rgba(34,197,94,0.15)', color: '#4ADE80', border: '1px solid #22C55E' }}
                            >
                                ĐANG DIỄN RA...
                            </div>
                        )}

                        {state === 'ready' && (
                            <button
                                onClick={completeSession}
                                disabled={actionLoading}
                                className="w-full py-3 rounded-xl text-sm font-bold tracking-widest transition-all disabled:opacity-60 active:scale-95"
                                style={{ background: '#22C55E', color: '#0B1810' }}
                            >
                                HOÀN THÀNH (DONE)
                            </button>
                        )}

                        {state === 'completed' && (
                            <div
                                className="w-full py-3 rounded-xl text-sm font-bold tracking-widest text-center"
                                style={{ background: 'rgba(34,197,94,0.1)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                                ✓ HOÀN THÀNH HÔM NAY
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white transition-all hover:bg-white/10"
                                style={{ border: '1px solid #2A3D30' }}
                            >
                                VIEW TODAY'S INSPIRATION
                            </button>
                            {state === 'ready' && (
                                <button
                                    onClick={completeSession}
                                    disabled={actionLoading}
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all hover:bg-white/10 disabled:opacity-60"
                                    style={{ border: '1px solid #2A3D30', color: '#9CA3AF' }}
                                >
                                    DONE
                                </button>
                            )}
                            {state !== 'ready' && (
                                <button
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold transition-all opacity-40"
                                    style={{ border: '1px solid #2A3D30', color: '#9CA3AF' }}
                                    disabled
                                >
                                    DONE
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Commitments */}
                <div>
                    <h2 className="text-xs font-bold tracking-widest mb-4" style={{ color: '#4ADE80' }}>
                        ACTIVE COMMITMENTS
                    </h2>
                    {commitments.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm">
                            No active commitments.{' '}
                            <Link to="/commitments" className="text-green-400 hover:underline">Add one</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-3">
                            {commitments.slice(0, 4).map((c) => {
                                const daysLeft = getDaysLeft(c.deadline);
                                return (
                                    <div
                                        key={c.id}
                                        className="rounded-xl p-4"
                                        style={{ background: '#132218', border: '1px solid #1E3529' }}
                                    >
                                        <p className="text-sm font-semibold text-white truncate mb-1">{c.title}</p>
                                        {daysLeft !== null && (
                                            <p className="text-xs" style={{ color: '#86EFAC' }}>
                                                {daysLeft} days remaining
                                            </p>
                                        )}
                                        {/* Progress bar */}
                                        <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: '#1E3529' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${c.progress_percent}%`, background: '#22C55E' }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </HaloLayout>
    );
}
