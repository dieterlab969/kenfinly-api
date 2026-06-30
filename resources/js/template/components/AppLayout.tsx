import React, { useState, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { TrendingUp, TrendingDown, ArrowLeftRight } from 'lucide-react'
import BottomNavigation from './BottomNavigation'

// ─── Custom events dispatched to active pages ─────────────────────────────────
// Home.tsx listens for 'kenfinly:quick-add:income' / 'kenfinly:quick-add:expense'
// and 'kenfinly:quick-add:transfer' to open its modals.

function dispatchQuickAdd(type: 'income' | 'expense' | 'transfer') {
    window.dispatchEvent(new CustomEvent(`kenfinly:quick-add:${type}`))
}

// ─── FAB speed-dial menu ──────────────────────────────────────────────────────

interface FabOption {
    label: string
    Icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }>
    bg: string
    shadow: string
    action: () => void
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const AppLayout: React.FC = () => {
    const [fabOpen, setFabOpen] = useState(false)

    const handleFabToggle = useCallback(() => setFabOpen(v => !v), [])
    const closeFab        = useCallback(() => setFabOpen(false),    [])

    const FAB_OPTIONS: FabOption[] = [
        {
            label: 'Thu nhập',
            Icon: TrendingUp,
            bg: 'linear-gradient(145deg, #22c55e, #16a34a)',
            shadow: '0 8px 28px rgba(34,197,94,0.50)',
            action: () => { closeFab(); dispatchQuickAdd('income') },
        },
        {
            label: 'Chi tiêu',
            Icon: TrendingDown,
            bg: 'linear-gradient(145deg, #ef4444, #dc2626)',
            shadow: '0 8px 28px rgba(239,68,68,0.50)',
            action: () => { closeFab(); dispatchQuickAdd('expense') },
        },
        {
            label: 'Chuyển khoản',
            Icon: ArrowLeftRight,
            bg: 'linear-gradient(145deg, #3b82f6, #1d4ed8)',
            shadow: '0 8px 28px rgba(59,130,246,0.50)',
            action: () => { closeFab(); dispatchQuickAdd('transfer') },
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
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 80,
                        background: 'rgba(0,0,0,0.38)',
                        backdropFilter: 'blur(2px)',
                        WebkitBackdropFilter: 'blur(2px)',
                    }}
                />
            )}

            {/* ── FAB speed-dial options ── */}
            {fabOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '112px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        gap: '20px',
                        zIndex: 90,
                        alignItems: 'flex-end',
                        animation: 'bnav_fadeUp 0.2s ease',
                    }}
                >
                    {FAB_OPTIONS.map(({ label, Icon, bg, shadow, action }) => (
                        <div
                            key={label}
                            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                        >
                            <button
                                onClick={action}
                                style={{
                                    width: '58px',
                                    height: '58px',
                                    borderRadius: '50%',
                                    background: bg,
                                    border: 'none',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    boxShadow: shadow,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                aria-label={label}
                            >
                                <Icon size={22} strokeWidth={2} />
                            </button>
                            <span
                                style={{
                                    fontSize: '10px',
                                    color: '#fff',
                                    fontWeight: 600,
                                    textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                    whiteSpace: 'nowrap',
                                    fontFamily: 'Satoshi, Inter, sans-serif',
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
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
