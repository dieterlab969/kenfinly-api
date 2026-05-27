import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Flame } from 'lucide-react';
import HaloLayout from '../../components/halo/HaloLayout';
import api from '../../utils/api';

function fmtVND(val) {
    const n = Math.abs(Number(val || 0));
    return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' đ';
}

function getDaysLeft(deadline) {
    if (!deadline) return null;
    const diff = Math.ceil((new Date(deadline) - new Date()) / 86400000);
    return diff > 0 ? diff : 0;
}

function getTimeLabel(deadline) {
    const days = getDaysLeft(deadline);
    if (days === null) return '';
    const months = Math.round(days / 30);
    if (months >= 12) return `${Math.round(months / 12)} years`;
    if (months > 1)   return `${months} months`;
    return `${days} days`;
}

/* ── Commitment Card ── */
function CommitmentCard({ commitment, onUpdateProgress, onViewDetail }) {
    const daysLeft = getDaysLeft(commitment.deadline);
    const label    = getTimeLabel(commitment.deadline);
    const progress = commitment.progress_percent || 0;
    const hasImage = !!commitment.image_url;

    const progressColor = {
        active:    '#22C55E',
        completed: '#4ADE80',
        killed:    '#EF4444',
    }[commitment.status] || '#22C55E';

    return (
        <article className="halo-commitment-card">
            <div className="halo-commitment-image">
                {hasImage && (
                    <img src={commitment.image_url} alt={commitment.title} />
                )}
                <div className="halo-commitment-overlay" />

                {daysLeft !== null && daysLeft <= 30 && commitment.status === 'active' && (
                    <span
                        className="halo-badge halo-badge-danger"
                        style={{ position: 'absolute', top: 10, left: 10 }}
                    >
                        {daysLeft} DAYS LEFT
                    </span>
                )}
                {commitment.status === 'completed' && (
                    <span
                        className="halo-badge halo-badge-success"
                        style={{ position: 'absolute', top: 10, right: 10 }}
                    >
                        ✓ DONE
                    </span>
                )}
                {commitment.status === 'killed' && (
                    <span
                        className="halo-badge halo-badge-danger"
                        style={{ position: 'absolute', top: 10, right: 10 }}
                    >
                        KILLED
                    </span>
                )}
            </div>

            <div className="halo-commitment-body">
                <p className="halo-commitment-title">{commitment.title}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#86EFAC' }}>
                    <span>GOAL: {fmtVND(commitment.goal_amount_minor)}</span>
                    {label && <span>{label}</span>}
                </div>

                <div className="halo-progress-track">
                    <div className="halo-progress-fill" style={{ width: `${progress}%`, background: progressColor }} />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                    <button
                        className="halo-btn halo-btn-outline halo-btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => onViewDetail(commitment)}
                    >
                        VIEW DETAIL
                    </button>
                    {commitment.status === 'active' && (
                        <button
                            className="halo-btn halo-btn-primary halo-btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => onUpdateProgress(commitment)}
                        >
                            UPDATE
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}

/* ── Add Commitment Modal ── */
function AddCommitmentModal({ onClose, onCreated }) {
    const [form, setForm]     = useState({ title: '', goal_amount: '', deadline: '' });
    const [image, setImage]   = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError]   = useState('');
    const fileRef             = useRef();

    const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('title',       form.title);
            fd.append('goal_amount', form.goal_amount);
            if (form.deadline) fd.append('deadline', form.deadline);
            if (image)         fd.append('image',    image);

            const res = await api.post('/commitments', fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            onCreated(res.data.data);
            onClose();
        } catch (err) {
            const msgs = err.response?.data?.errors;
            setError(msgs ? Object.values(msgs).flat().join(', ') : 'Failed to create commitment.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="halo-modal-backdrop" role="dialog" aria-modal="true" aria-label="Add Commitment">
            <div className="halo-modal">
                <div className="halo-modal-header">
                    <h2 className="halo-modal-title">Add New Promise</h2>
                    <button className="halo-modal-close" onClick={onClose} aria-label="Close"><X size={20} /></button>
                </div>

                {error && <div className="halo-form-error">{error}</div>}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="com-title">Title *</label>
                        <input
                            id="com-title"
                            name="title"
                            type="text"
                            className="halo-input"
                            value={form.title}
                            onChange={handleChange}
                            placeholder="e.g. New Laptop"
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="com-amount">Goal Amount (VND) *</label>
                        <input
                            id="com-amount"
                            name="goal_amount"
                            type="number"
                            className="halo-input"
                            value={form.goal_amount}
                            onChange={handleChange}
                            placeholder="35000000"
                            min="1"
                            required
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label" htmlFor="com-deadline">Deadline</label>
                        <input
                            id="com-deadline"
                            name="deadline"
                            type="date"
                            className="halo-input"
                            value={form.deadline}
                            onChange={handleChange}
                            style={{ colorScheme: 'dark' }}
                        />
                    </div>

                    <div className="halo-form-group">
                        <label className="halo-form-label">Cover Image</label>
                        <div
                            style={{
                                border: '2px dashed #2A3D30',
                                borderRadius: 10,
                                padding: '1rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s',
                            }}
                            onClick={() => fileRef.current?.click()}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#22C55E'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = '#2A3D30'}
                        >
                            {image
                                ? <span style={{ fontSize: '0.875rem', color: '#4ADE80' }}>{image.name}</span>
                                : <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Click to upload image</span>
                            }
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => setImage(e.target.files?.[0] || null)}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.625rem' }}>
                        <button type="button" className="halo-btn halo-btn-outline" style={{ flex: 1 }} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="halo-btn halo-btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? 'Creating…' : 'CREATE PROMISE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

/* ── Detail Modal ── */
function DetailModal({ commitment, onClose }) {
    const daysLeft = getDaysLeft(commitment.deadline);

    return (
        <div className="halo-modal-backdrop" role="dialog" aria-modal="true">
            <div className="halo-modal" style={{ padding: 0, overflow: 'hidden' }}>
                {commitment.image_url && (
                    <img
                        src={commitment.image_url}
                        alt={commitment.title}
                        style={{ width: '100%', height: 180, objectFit: 'cover' }}
                    />
                )}
                <div style={{ padding: '1.5rem' }}>
                    <div className="halo-modal-header">
                        <h2 className="halo-modal-title">{commitment.title}</h2>
                        <button className="halo-modal-close" onClick={onClose}><X size={20} /></button>
                    </div>

                    <dl style={{ fontSize: '0.875rem', color: '#86EFAC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <dt>Goal:</dt>
                            <dd style={{ margin: 0 }}>{fmtVND(commitment.goal_amount_minor)}</dd>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                            <dt>Current:</dt>
                            <dd style={{ margin: 0 }}>{fmtVND(commitment.current_amount_minor)} ({commitment.progress_percent}%)</dd>
                        </div>
                        {daysLeft !== null && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                                <dt>Days left:</dt>
                                <dd style={{ margin: 0 }}>{daysLeft}</dd>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <dt>Status:</dt>
                            <dd style={{ margin: 0, textTransform: 'capitalize' }}>{commitment.status}</dd>
                        </div>
                    </dl>

                    <div className="halo-progress-track" style={{ marginTop: '0.875rem', height: 8 }}>
                        <div className="halo-progress-fill" style={{ width: `${commitment.progress_percent}%` }} />
                    </div>

                    <button
                        className="halo-btn halo-btn-outline halo-btn-full"
                        style={{ marginTop: '1rem', width: '100%' }}
                        onClick={onClose}
                    >
                        CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Component ── */
export default function CommitmentsPage() {
    const [commitments,   setCommitments]   = useState([]);
    const [loading,       setLoading]       = useState(true);
    const [showAdd,       setShowAdd]       = useState(false);
    const [detailItem,    setDetailItem]    = useState(null);
    const [updateItem,    setUpdateItem]    = useState(null);
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

    const handleCreated = newItem => setCommitments(prev => [newItem, ...prev]);

    const handleConfirmComplete = async e => {
        e.preventDefault();
        if (!updateItem) return;
        setUpdateLoading(true);
        try {
            await api.post(`/commitments/${updateItem.id}/complete`);
            await fetchCommitments();
            setUpdateItem(null);
        } catch (err) {
            console.error(err);
        } finally {
            setUpdateLoading(false);
        }
    };

    const activeCommitments = commitments.filter(c => c.status === 'active');
    const todayCommitment   = activeCommitments[0] || null;

    return (
        <HaloLayout>
            <div className="halo-page">
                {/* Header */}
                <header className="halo-page-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                    <h1 className="halo-page-title">Promises — My Commitments</h1>
                    <button
                        className="halo-btn halo-btn-primary"
                        onClick={() => setShowAdd(true)}
                    >
                        <Plus size={16} />
                        ADD NEW PROMISE
                    </button>
                </header>

                {loading ? (
                    <div className="halo-loading-page"><div className="halo-spinner-ring" /></div>
                ) : (
                    <>
                        {/* Today's Promise Banner */}
                        {todayCommitment && (
                            <div className="halo-promise-banner mb-4">
                                <Flame size={22} style={{ color: '#FB923C', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p className="halo-section-label" style={{ margin: '0 0 0.25rem 0' }}>LỜI HỨA CỦA HÔM NAY</p>
                                    <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'white', margin: '0 0 0.25rem 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {todayCommitment.title}
                                    </p>
                                    <p style={{ fontSize: '0.75rem', color: '#86EFAC', margin: 0 }}>
                                        {todayCommitment.progress_percent}% completed · {fmtVND(todayCommitment.goal_amount_minor)} goal
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Commitments Grid */}
                        {commitments.length === 0 ? (
                            <div className="halo-empty">
                                <div className="halo-empty-icon">🎯</div>
                                <p className="halo-empty-title">No commitments yet</p>
                                <p className="halo-empty-text">Create your first promise to get started</p>
                                <button
                                    className="halo-btn halo-btn-primary"
                                    onClick={() => setShowAdd(true)}
                                >
                                    ADD NEW PROMISE
                                </button>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {commitments.map(c => (
                                    <div key={c.id} className="col-sm-6 col-xl-4">
                                        <CommitmentCard
                                            commitment={c}
                                            onViewDetail={setDetailItem}
                                            onUpdateProgress={setUpdateItem}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Modals ── */}
            {showAdd && (
                <AddCommitmentModal
                    onClose={() => setShowAdd(false)}
                    onCreated={handleCreated}
                />
            )}

            {detailItem && (
                <DetailModal
                    commitment={detailItem}
                    onClose={() => setDetailItem(null)}
                />
            )}

            {updateItem && (
                <div className="halo-modal-backdrop" role="dialog" aria-modal="true">
                    <div className="halo-modal" style={{ maxWidth: 380 }}>
                        <div className="halo-modal-header">
                            <h2 className="halo-modal-title">Mark as Completed</h2>
                            <button className="halo-modal-close" onClick={() => setUpdateItem(null)}><X size={18} /></button>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: '#86EFAC', marginBottom: '1.25rem' }}>
                            Are you sure you want to mark{' '}
                            <strong style={{ color: 'white' }}>"{updateItem.title}"</strong>{' '}
                            as completed?
                        </p>
                        <form onSubmit={handleConfirmComplete} style={{ display: 'flex', gap: '0.625rem' }}>
                            <button
                                type="button"
                                className="halo-btn halo-btn-outline"
                                style={{ flex: 1 }}
                                onClick={() => setUpdateItem(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="halo-btn halo-btn-primary"
                                style={{ flex: 1 }}
                                disabled={updateLoading}
                            >
                                {updateLoading ? 'Saving…' : 'CONFIRM'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </HaloLayout>
    );
}
