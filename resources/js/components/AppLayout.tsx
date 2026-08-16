import React, { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import BottomNavigation from './BottomNavigation'
import { useQuickAdd } from '../context/QuickAddContext'
import incomeIcon from '../assets/icons/quick-add-plus.png'
import spendingIcon from '../assets/icons/quick-add-minus.png'
import transferIcon from '../assets/icons/quick-add-transfer.png'

// ─── FAB speed-dial menu ──────────────────────────────────────────────────────

interface FabOption {
    label: string
    icon: string
    tone: 'income' | 'spending' | 'transfer'
    bg: string
    action: () => void
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const AppLayout: React.FC = () => {
    const { t } = useTranslation()
    const { triggerQuickAdd } = useQuickAdd()
    const [fabOpen, setFabOpen] = useState(false)

    const handleFabToggle = useCallback(() => setFabOpen(v => !v), [])
    const closeFab        = useCallback(() => setFabOpen(false),    [])

    const FAB_OPTIONS: FabOption[] = [
        {
            label: t('Income'),
            icon: incomeIcon,
            tone: 'income',
            bg: 'linear-gradient(145deg, #6f54ed, #4c31cc)',
            action: () => { closeFab(); triggerQuickAdd('income') },
        },
        {
            label: t('Spending'),
            icon: spendingIcon,
            tone: 'spending',
            bg: 'linear-gradient(145deg, #f45b6a, #dc354d)',
            action: () => { closeFab(); triggerQuickAdd('expense') },
        },
        {
            label: t('Transfer'),
            icon: transferIcon,
            tone: 'transfer',
            bg: 'linear-gradient(145deg, #4d9bf5, #2871d8)',
            action: () => { closeFab(); triggerQuickAdd('transfer') },
        },
    ]

    return (
        <div style={{ position: 'relative', minHeight: '100vh' }}>
            {/* ── Page content ── */}
            <Outlet />

            {/* ── FAB backdrop ── */}
            {fabOpen && (
                <div
                    onClick={closeFab}
                    className="quick-add-backdrop"
                    aria-hidden="true"
                />
            )}

            {/* ── Focused quick-add action tray ── */}
            {fabOpen && (
                <div
                    className="quick-add-tray"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('Quick add')}
                >
                    <div className="quick-add-tray-header">
                        <div>
                            <span className="quick-add-eyebrow">{t('QUICK ACTION')}</span>
                            <h2>{t('What would you like to add?')}</h2>
                        </div>
                        <button type="button" className="quick-add-close" onClick={closeFab} aria-label={t('Close')}>
                            <span aria-hidden="true">×</span>
                        </button>
                    </div>
                    <div className="quick-add-options">
                    {FAB_OPTIONS.map(({ label, icon, tone, bg, action }) => (
                        <div
                            key={label}
                            className={`quick-add-option quick-add-option--${tone}`}
                        >
                            <button
                                onClick={action}
                                className="quick-add-option-button"
                                aria-label={label}
                                style={{ background: bg }}
                            >
                                <img src={icon} alt="" aria-hidden="true" />
                            </button>
                            <span className="quick-add-option-label">{label}</span>
                        </div>
                    ))}
                    </div>
                    <p className="quick-add-hint">{t('Choose an action to continue')}</p>
                </div>
            )}

            {/* ── Persistent bottom navigation ── */}
            <BottomNavigation fabOpen={fabOpen} onFabToggle={handleFabToggle} />

            {/* ── Keyframe for FAB menu entrance ── */}
            <style>{`
                @keyframes bnav_fadeUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(14px); }
                    to   { opacity: 1; transform: translateX(-50%) translateY(0);    }
                }
            `}</style>
        </div>
    )
}

export default AppLayout
