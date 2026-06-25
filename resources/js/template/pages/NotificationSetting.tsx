import React, { useCallback, useEffect, useState } from 'react';
import BackBtn from '../components/BackBtn.tsx';
import api from '../../utils/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotifSettings {
    notify_new_transaction:   boolean;
    notify_budget_alert:      boolean;
    notify_large_transaction: boolean;
    notify_savings_milestone: boolean;
    notify_account_invite:    boolean;
    notify_subscription:      boolean;
    notify_weekly_summary:    boolean;
}

type ToggleKey = keyof NotifSettings;

// ---------------------------------------------------------------------------
// Static config — ordered sections shown in the UI
// ---------------------------------------------------------------------------

interface Section {
    group:       string;
    key:         ToggleKey;
    id:          string;
    label:       string;
    description: string;
    isLast?:     boolean;
}

const SECTIONS: Section[] = [
    // Financial activity
    {
        group:       'Financial Activity',
        key:         'notify_new_transaction',
        id:          'notif-new-tx',
        label:       'New transaction recorded',
        description: 'Notified whenever a transaction is added to one of your accounts.',
    },
    {
        group:       'Financial Activity',
        key:         'notify_budget_alert',
        id:          'notif-budget',
        label:       'Budget threshold alert',
        description: 'Warned when your spending is approaching or has exceeded a budget limit.',
    },
    {
        group:       'Financial Activity',
        key:         'notify_large_transaction',
        id:          'notif-large-tx',
        label:       'Large transaction detected',
        description: 'Alerted when an unusually large or suspicious transaction is recorded.',
    },
    // Savings & goals
    {
        group:       'Savings & Goals',
        key:         'notify_savings_milestone',
        id:          'notif-savings',
        label:       'Saving habit milestone',
        description: 'Celebrated when a saving habit streak or savings goal milestone is reached.',
    },
    // Collaboration
    {
        group:       'Collaboration',
        key:         'notify_account_invite',
        id:          'notif-invite',
        label:       'Account collaboration invite',
        description: 'Notified when another user invites you to collaborate on a shared account.',
    },
    // Account & subscription
    {
        group:       'Account & Subscription',
        key:         'notify_subscription',
        id:          'notif-subscription',
        label:       'Subscription renewal reminder',
        description: 'Reminded before your subscription renews or after a payment is confirmed.',
    },
    // Digest
    {
        group:       'Digest',
        key:         'notify_weekly_summary',
        id:          'notif-weekly',
        label:       'Weekly spending summary',
        description: 'Receive a weekly email digest summarising your income, spending, and trends.',
        isLast:      true,
    },
];

// Group labels rendered as dividers between sections
const GROUP_ORDER = [
    'Financial Activity',
    'Savings & Goals',
    'Collaboration',
    'Account & Subscription',
    'Digest',
];

// ---------------------------------------------------------------------------
// Defaults (used as fallback while fetching)
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: NotifSettings = {
    notify_new_transaction:   true,
    notify_budget_alert:      true,
    notify_large_transaction: true,
    notify_savings_milestone: true,
    notify_account_invite:    true,
    notify_subscription:      true,
    notify_weekly_summary:    false,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NotificationSetting: React.FC = () => {
    const [settings, setSettings] = useState<NotifSettings>(DEFAULT_SETTINGS);
    const [loading,  setLoading]  = useState(true);
    const [saving,   setSaving]   = useState(false);
    const [toast,    setToast]    = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    // ── Toast helper ────────────────────────────────────────────────────────
    const showToast = (type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Fetch on mount ──────────────────────────────────────────────────────
    useEffect(() => {
        api.get('/user/notification-settings')
            .then(res => {
                const d = res.data.data;
                setSettings({
                    notify_new_transaction:   d.notify_new_transaction,
                    notify_budget_alert:      d.notify_budget_alert,
                    notify_large_transaction: d.notify_large_transaction,
                    notify_savings_milestone: d.notify_savings_milestone,
                    notify_account_invite:    d.notify_account_invite,
                    notify_subscription:      d.notify_subscription,
                    notify_weekly_summary:    d.notify_weekly_summary,
                });
            })
            .catch(() => showToast('error', 'Could not load settings. Using defaults.'))
            .finally(() => setLoading(false));
    }, []);

    // ── Toggle handler — auto-saves immediately ─────────────────────────────
    const handleToggle = useCallback(
        async (key: ToggleKey) => {
            const updated: NotifSettings = { ...settings, [key]: !settings[key] };
            setSettings(updated);   // optimistic update
            setSaving(true);
            try {
                await api.put('/user/notification-settings', updated);
                showToast('success', 'Settings saved.');
            } catch {
                setSettings(settings);  // revert on failure
                showToast('error', 'Failed to save. Please try again.');
            } finally {
                setSaving(false);
            }
        },
        [settings],
    );

    // ── Render helpers ──────────────────────────────────────────────────────
    const renderToggle = (section: Section) => (
        <div
            key={section.key}
            className={`notification-option-wrap${section.isLast ? ' border-0' : ''}`}
        >
            <div className="notification-option-wrapper">
                <div className="notification-option-name" style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, marginBottom: 2 }}>
                        {section.label}
                    </p>
                    <p style={{ fontFamily: 'Satoshi, sans-serif', fontSize: 12, color: '#6c757d', marginBottom: 0 }}>
                        {section.description}
                    </p>
                </div>
                <div className="notification-option-switch">
                    <label
                        className="switch"
                        htmlFor={section.id}
                        style={{ opacity: saving ? 0.6 : 1 }}
                    >
                        <input
                            type="checkbox"
                            id={section.id}
                            checked={settings[section.key]}
                            onChange={() => handleToggle(section.key)}
                            disabled={saving}
                        />
                        <span className="slider" />
                    </label>
                </div>
            </div>
        </div>
    );

    const renderGroupedSections = () =>
        GROUP_ORDER.map(group => {
            const items = SECTIONS.filter(s => s.group === group);
            return (
                <div key={group} className="mt-16">
                    <p style={{
                        fontFamily:   'Satoshi, sans-serif',
                        fontWeight:   700,
                        fontSize:     11,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color:         '#7B51F1',
                        marginBottom:  6,
                    }}>
                        {group}
                    </p>
                    {items.map(renderToggle)}
                </div>
            );
        });

    // ── Main render ─────────────────────────────────────────────────────────
    return (
        <div>
            <div className="site-content">
                <div className="verify-number-main">

                    <div className="verify-number-top">
                        <div className="container">
                            <div className="verify-number-top-content">
                                <div className="back-btn">
                                    <BackBtn />
                                </div>
                                <div className="header-title">
                                    <p style={{ fontFamily: 'Satoshi, sans-serif' }}>Notification Settings</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="verify-number-bottom" id="notification-setting">
                        <div className="verify-number-bottom-wrap">
                            <div className="verify-number-content">
                                <h1 className="d-none">Notification Settings</h1>

                                {/* Toast */}
                                {toast && (
                                    <div
                                        className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} py-2 px-3 mb-3`}
                                        style={{ borderRadius: 12, fontSize: 13, fontFamily: 'Satoshi, sans-serif' }}
                                    >
                                        {toast.msg}
                                    </div>
                                )}

                                <div className="notification-setting">
                                    <p
                                        className="notify-txt"
                                        style={{ fontFamily: 'Satoshi, sans-serif', color: '#6c757d' }}
                                    >
                                        Choose which financial events trigger a notification.
                                    </p>

                                    {loading ? (
                                        <div className="d-flex justify-content-center align-items-center py-5">
                                            <div
                                                className="spinner-border"
                                                role="status"
                                                style={{ color: '#7B51F1', width: 32, height: 32 }}
                                            >
                                                <span className="visually-hidden">Loading…</span>
                                            </div>
                                        </div>
                                    ) : (
                                        renderGroupedSections()
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default NotificationSetting;
