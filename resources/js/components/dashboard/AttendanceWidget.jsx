import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flame, Play, Skull, Timer, XCircle, Zap } from 'lucide-react';
import api from '../../utils/api';
import { formatCurrency } from '../../constants/categories';

const formatDuration = (totalSeconds) => {
    const seconds = Math.max(0, Number(totalSeconds || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    return [hours, minutes, remainingSeconds]
        .map((value) => String(value).padStart(2, '0'))
        .join(':');
};

const AttendanceWidget = ({ onRewardCreated }) => {
    const [status, setStatus] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedRating, setSelectedRating] = useState('normal');

    const fetchStatus = useCallback(async (showLoading = false) => {
        try {
            if (showLoading) {
                setLoading(true);
            }
            const response = await api.get('/attendance/status');
            setStatus(response.data.data);
            setSecondsLeft(response.data.data.seconds_left || 0);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to load Halo status.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus(true);
    }, [fetchStatus]);

    useEffect(() => {
        if (!status || !['in_progress', 'ready'].includes(status.state)) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setSecondsLeft((current) => {
                if (current <= 1) {
                    fetchStatus(false);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => window.clearInterval(timer);
    }, [fetchStatus, status]);

    const startSession = async () => {
        setActionLoading(true);
        try {
            const response = await api.post('/attendance/start');
            setStatus(response.data.data);
            setSecondsLeft(response.data.data.seconds_left || 0);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Unable to start Halo.');
        } finally {
            setActionLoading(false);
        }
    };

    const completeSession = async () => {
        setActionLoading(true);
        try {
            const response = await api.post('/attendance/complete', {
                user_rating: selectedRating,
            });
            setStatus(response.data.data);
            setSecondsLeft(response.data.data.seconds_left || 0);
            setError('');
            onRewardCreated?.();
        } catch (err) {
            const validationMessage = err.response?.data?.errors?.attendance?.[0];
            setError(validationMessage || err.response?.data?.message || 'Unable to complete Halo.');
        } finally {
            setActionLoading(false);
        }
    };

    const killSession = async () => {
        setActionLoading(true);
        try {
            const response = await api.post('/attendance/kill');
            setStatus(response.data.data);
            setSecondsLeft(response.data.data.seconds_left || 0);
            setError('');
        } catch (err) {
            const validationMessage = err.response?.data?.errors?.attendance?.[0];
            setError(validationMessage || err.response?.data?.message || 'Unable to kill Halo.');
        } finally {
            setActionLoading(false);
        }
    };

    const maxProgress = status?.max_progress ?? 100;

    const progress = useMemo(() => {
        const sessionSeconds = 8 * 60 * 60;
        const raw = Math.min(100, Math.max(0, ((sessionSeconds - secondsLeft) / sessionSeconds) * 100));
        return Math.min(maxProgress, raw);
    }, [secondsLeft, maxProgress]);

    const state = status?.state || 'idle';
    const attendance = status?.attendance;

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                <div className="h-28 animate-pulse rounded-xl bg-gray-100" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 mb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-semibold text-indigo-700">
                        <Flame className="h-4 w-4" />
                        <span>Halo Discipline</span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
                        <div className="text-3xl font-bold tracking-normal text-gray-950">
                            {state === 'idle' ? 'Ready' : formatDuration(secondsLeft)}
                        </div>
                        <div className="pb-1 text-sm text-gray-600">
                            Streak {status?.current_streak || 0} / Best {status?.longest_streak || 0}
                        </div>
                    </div>
                    {attendance?.quote_text && (
                        <p className="mt-2 max-w-3xl text-sm text-gray-600">{attendance.quote_text}</p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {state === 'idle' && (() => {
                        const win = status?.window;
                        const canCheckIn = win?.can_check_in !== false;
                        const isTooEarly = win?.status === 'too_early';
                        const isLate     = win?.status === 'open_late';
                        return (
                            <div className="flex flex-col items-end gap-1">
                                {isTooEarly && (
                                    <span className="text-xs font-semibold text-blue-500">
                                        ◷ Opens at {win.open_at}
                                    </span>
                                )}
                                {isLate && (
                                    <span className="text-xs font-semibold text-amber-500">
                                        ⚠ Late entry — half-day only
                                    </span>
                                )}
                                <button
                                    onClick={startSession}
                                    disabled={actionLoading || !canCheckIn}
                                    className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <Play className="h-4 w-4" />
                                    Hello
                                </button>
                            </div>
                        );
                    })()}

                    {state === 'in_progress' && (
                        <>
                            <button
                                disabled
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-500"
                            >
                                <Timer className="h-4 w-4" />
                                Done
                            </button>
                            <button
                                onClick={killSession}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Skull className="h-4 w-4" />
                                Kill
                            </button>
                        </>
                    )}

                    {state === 'ready' && (
                        <>
                            <select
                                value={selectedRating}
                                onChange={(event) => setSelectedRating(event.target.value)}
                                className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700"
                            >
                                <option value="excellent">Excellent</option>
                                <option value="normal">Normal</option>
                                <option value="laggy">Laggy</option>
                            </select>
                            <button
                                onClick={completeSession}
                                disabled={actionLoading}
                                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <CheckCircle2 className="h-4 w-4" />
                                Done
                            </button>
                        </>
                    )}

                    {state === 'completed' && (
                        <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                            <Zap className="h-4 w-4" />
                            +{formatCurrency(attendance?.earned_amount || 0)}
                        </div>
                    )}

                    {state === 'killed' && (
                        <div className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700">
                            <XCircle className="h-4 w-4" />
                            Killed
                        </div>
                    )}
                </div>
            </div>

            {state !== 'idle' && (
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-600 to-emerald-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            )}

            {error && (
                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                </div>
            )}
        </div>
    );
};

export default AttendanceWidget;
