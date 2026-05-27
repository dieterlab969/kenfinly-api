import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Flame } from 'lucide-react';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';

function fmtVND(val) {
    const n = Math.abs(Number(val || 0));
    if (n >= 1_000_000) return `VND ${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
    if (n >= 1_000) return `VND ${(n / 1_000).toFixed(0)}K`;
    return `VND ${n.toLocaleString()}`;
}

function getDaysLeft(deadline) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    return diff > 0 ? diff : 0;
}

function getDeadlineLabel(deadline) {
    if (!deadline) return '';
    const days = getDaysLeft(deadline);
    if (days === null) return '';
    const totalMonths = Math.round(days / 30);
    if (totalMonths >= 12) return `${Math.round(totalMonths / 12)} years`;
    if (totalMonths > 1) return `${totalMonths} months`;
    return `${days} days`;
}

function CommitmentCard({ commitment, onUpdateProgress, onViewDetail }) {
    const daysLeft = getDaysLeft(commitment.deadline);
    const label = getDeadlineLabel(commitment.deadline);
    const progress = commitment.progress_percent || 0;
    const hasImage = !!commitment.image_url;

    const statusColors = {
        active: '#22C55E',
        completed: '#4ADE80',
        killed: '#EF4444',
    };

    return (
        <div
            className="rounded-2xl overflow-hidden relative flex flex-col"
            style={{ background: '#132218', border: '1px solid #1E3529', minHeight: 200 }}
        >
            {/* Image or gradient */}
            <div className="relative h-32 overflow-hidden">
                {hasImage ? (
                    <img
                        src={commitment.image_url}
                        alt={commitment.title}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="w-full h-full"
                        style={{
                            background: 'linear-gradient(135deg, #1A3020 0%, #0F2018 100%)',
                        }}
                    />
                )}
                {/* Overlay gradient */}
                <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to bottom, transparent 40%, rgba(10,24,15,0.9))' }}
                />
                {/* Days left badge */}
                {daysLeft !== null && daysLeft <= 30 && commitment.status === 'active' && (
                    <div
                        className="absolute top-3 left-3 px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}
                    >
                        {daysLeft} DAYS LEFT
                    </div>
                )}
                {commitment.status === 'completed' && (
                    <div
                        className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(34,197,94,0.85)', color: '#0B1810' }}
                    >
                        ✓ DONE
                    </div>
                )}
                {commitment.status === 'killed' && (
                    <div
                        className="absolute top-3 right-3 px-2 py-1 rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(239,68,68,0.85)', color: 'white' }}
                    >
                        KILLED
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-2 flex-1">
                <p className="text-sm font-bold text-white leading-snug">{commitment.title}</p>

                <div className="flex items-center justify-between text-xs" style={{ color: '#86EFAC' }}>
                    <span>GOAL: {fmtVND(commitment.goal_amount_minor)}</span>
                    {label && <span>{label}</span>}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1E3529' }}>
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, background: statusColors[commitment.status] || '#22C55E' }}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={() => onViewDetail(commitment)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:bg-white/10"
                        style={{ border: '1px solid #2A3D30' }}
                    >
                        VIEW DETAIL
                    </button>
                    {commitment.status === 'active' && (
                        <button
                            onClick={() => onUpdateProgress(commitment)}
                            className="flex-1 py-1.5 rounded-lg text-xs font-bold transition-all"
                            style={{ background: '#22C55E', color: '#0B1810' }}
                        >
                            UPDATE PROGRESS
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function AddCommitmentModal({ onClose, onCreated }) {
    const [form, setForm] = useState({ title: '', goal_amount: '', deadline: '' });
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('title', form.title);
            fd.append('goal_amount', form.goal_amount);
            if (form.deadline) fd.append('deadline', form.deadline);
            if (image) fd.append('image', image);

            const res = await api.post('/commitments', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onCreated(res.data.data);
            onClose();
        } catch (err) {
            const msgs = err.response?.data?.errors;
            setError(msgs ? Object.values(msgs).flat().join(', ') : 'Failed to create commitment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div
                className="w-full max-w-md rounded-2xl p-6"
                style={{ background: '#132218', border: '1px solid #1E3529' }}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-white">Add New Promise</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg text-sm text-red-400" style={{ background: 'rgba(239,68,68,0.1)' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4ADE80' }}>Title *</label>
                        <input
                            type="text"
                            required
                            value={form.title}
                            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-green-500"
                            style={{ background: '#0B1810', border: '1px solid #2A3D30' }}
                            placeholder="e.g. Laptop Purchase"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4ADE80' }}>Goal Amount (VND) *</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={form.goal_amount}
                            onChange={e => setForm(f => ({ ...f, goal_amount: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-green-500"
                            style={{ background: '#0B1810', border: '1px solid #2A3D30' }}
                            placeholder="35000000"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4ADE80' }}>Deadline</label>
                        <input
                            type="date"
                            value={form.deadline}
                            onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-green-500"
                            style={{ background: '#0B1810', border: '1px solid #2A3D30', colorScheme: 'dark' }}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4ADE80' }}>Cover Image</label>
                        <div
                            className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer hover:border-green-500 transition-colors"
                            style={{ borderColor: '#2A3D30' }}
                            onClick={() => fileRef.current?.click()}
                        >
                            {image ? (
                                <p className="text-sm text-green-400">{image.name}</p>
                            ) : (
                                <p className="text-sm text-gray-500">Click to upload image</p>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={e => setImage(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-60 active:scale-95"
                        style={{ background: '#22C55E', color: '#0B1810' }}
                    >
                        {loading ? 'Creating...' : 'CREATE PROMISE'}
                    </button>
                </form>
            </div>
        </div>
    );
}

function DetailModal({ commitment, onClose }) {
    const daysLeft = getDaysLeft(commitment.deadline);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: '#132218', border: '1px solid #1E3529' }}
            >
                {commitment.image_url && (
                    <img src={commitment.image_url} alt={commitment.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-white">{commitment.title}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
                    </div>
                    <div className="space-y-2 text-sm" style={{ color: '#86EFAC' }}>
                        <p>Goal: {fmtVND(commitment.goal_amount_minor)}</p>
                        <p>Current: {fmtVND(commitment.current_amount_minor)} ({commitment.progress_percent}%)</p>
                        {daysLeft !== null && <p>Days left: {daysLeft}</p>}
                        <p>Status: <span className="capitalize">{commitment.status}</span></p>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden mt-2" style={{ background: '#1E3529' }}>
                        <div
                            className="h-full rounded-full"
                            style={{ width: `${commitment.progress_percent}%`, background: '#22C55E' }}
                        />
                    </div>
                    <button
                        onClick={onClose}
                        className="w-full mt-2 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all"
                        style={{ border: '1px solid #2A3D30' }}
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CommitmentsPage() {
    const [commitments, setCommitments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [updateItem, setUpdateItem] = useState(null);
    const [updateAmount, setUpdateAmount] = useState('');
    const [updateLoading, setUpdateLoading] = useState(false);

    const fetchCommitments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/commitments?per_page=20');
            setCommitments(res.data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCommitments(); }, [fetchCommitments]);

    const handleCreated = (newItem) => {
        setCommitments(prev => [newItem, ...prev]);
    };

    const handleUpdateProgress = async (e) => {
        e.preventDefault();
        if (!updateItem) return;
        setUpdateLoading(true);
        try {
            await api.post(`/commitments/${updateItem.id}/complete`);
            await fetchCommitments();
            setUpdateItem(null);
            setUpdateAmount('');
        } catch (err) {
            console.error(err);
        } finally {
            setUpdateLoading(false);
        }
    };

    const activeCommitments = commitments.filter(c => c.status === 'active');
    const todayCommitment = activeCommitments[0] || null;

    return (
        <HaloLayout>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Promises - My Commitments</h1>
                    <button
                        onClick={() => setShowAdd(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
                        style={{ background: '#22C55E', color: '#0B1810' }}
                    >
                        <Plus size={16} />
                        ADD NEW PROMISE
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Commitment Grid */}
                        {commitments.length === 0 ? (
                            <div
                                className="rounded-2xl p-12 text-center"
                                style={{ background: '#132218', border: '1px solid #1E3529' }}
                            >
                                <p className="text-3xl mb-3">🎯</p>
                                <p className="text-white font-semibold mb-1">No commitments yet</p>
                                <p className="text-sm mb-4" style={{ color: '#86EFAC' }}>
                                    Create your first promise to get started
                                </p>
                                <button
                                    onClick={() => setShowAdd(true)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold"
                                    style={{ background: '#22C55E', color: '#0B1810' }}
                                >
                                    ADD NEW PROMISE
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-4">
                                {commitments.map((c) => (
                                    <CommitmentCard
                                        key={c.id}
                                        commitment={c}
                                        onViewDetail={setDetailItem}
                                        onUpdateProgress={setUpdateItem}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Today's Promise section */}
                        {todayCommitment && (
                            <div
                                className="mt-6 rounded-2xl p-5 flex items-center gap-4"
                                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
                            >
                                <Flame size={24} className="text-orange-400 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold tracking-widest mb-1" style={{ color: '#4ADE80' }}>
                                        LỜI HỨA CỦA HÔM NAY
                                    </p>
                                    <p className="text-sm font-semibold text-white truncate">{todayCommitment.title}</p>
                                    <p className="text-xs mt-0.5" style={{ color: '#86EFAC' }}>
                                        {todayCommitment.progress_percent}% completed · {fmtVND(todayCommitment.goal_amount_minor)} goal
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showAdd && (
                <AddCommitmentModal onClose={() => setShowAdd(false)} onCreated={handleCreated} />
            )}

            {detailItem && (
                <DetailModal commitment={detailItem} onClose={() => setDetailItem(null)} />
            )}

            {updateItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div
                        className="w-full max-w-sm rounded-2xl p-6"
                        style={{ background: '#132218', border: '1px solid #1E3529' }}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-white">Mark as Completed</h2>
                            <button onClick={() => setUpdateItem(null)} className="text-gray-400 hover:text-white">
                                <X size={18} />
                            </button>
                        </div>
                        <p className="text-sm mb-4" style={{ color: '#86EFAC' }}>
                            Are you sure you want to mark "<strong className="text-white">{updateItem.title}</strong>" as completed?
                        </p>
                        <form onSubmit={handleUpdateProgress} className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setUpdateItem(null)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all"
                                style={{ border: '1px solid #2A3D30' }}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={updateLoading}
                                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-60"
                                style={{ background: '#22C55E', color: '#0B1810' }}
                            >
                                {updateLoading ? 'Saving...' : 'CONFIRM'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </HaloLayout>
    );
}
