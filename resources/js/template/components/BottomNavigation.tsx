import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, TrendingUp, Plus, BarChart2, FileText } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BottomNavigationProps {
    fabOpen: boolean
    onFabToggle: () => void
}

type NavEntry =
    | { kind: 'link'; to: string; label: string; Icon: React.FC<{ size?: number; strokeWidth?: number }>; disabled?: boolean }
    | { kind: 'center' }

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavEntry[] = [
    { kind: 'link', to: '/Home',      label: 'Home',      Icon: Home,       disabled: false },
    { kind: 'link', to: '/analytics', label: 'Analytics', Icon: TrendingUp, disabled: false },
    { kind: 'center' },
    { kind: 'link', to: '/BarChart',  label: 'Goals',     Icon: BarChart2,  disabled: true  },
    { kind: 'link', to: '/Invoicing', label: 'Reports',   Icon: FileText,   disabled: true  },
]

// ─── Component ────────────────────────────────────────────────────────────────

const BottomNavigation: React.FC<BottomNavigationProps> = ({ fabOpen, onFabToggle }) => {
    const { pathname } = useLocation()
    const { t } = useTranslation()

    return (
        <>
            {/* ── Floating FAB circle (fixed, centered above pill) ── */}
            <div
                className="gol3"
                onClick={onFabToggle}
                role="button"
                aria-label={t('Quick add')}
                aria-expanded={fabOpen}
                style={{
                    cursor: 'pointer',
                    background: 'linear-gradient(145deg, #8B6CF7, #7B51F1)',
                    boxShadow: fabOpen
                        ? '0 0 0 6px rgba(123,81,241,0.18), 0 8px 32px rgba(123,81,241,0.45)'
                        : '0 6px 24px rgba(123,81,241,0.38)',
                    transition: 'box-shadow 0.25s ease',
                }}
            >
                <div className="add-to-cart-icon">
                    <Plus
                        size={28}
                        strokeWidth={2.5}
                        color="#fff"
                        style={{
                            display: 'block',
                            transform: fabOpen ? 'rotate(45deg)' : 'none',
                            transition: 'transform 0.22s ease',
                        }}
                    />
                </div>
            </div>

            {/* ── Nav items ── */}
            <div className="navigation">
                <ul className="listWrap" style={{ alignItems: 'flex-start', margin: 0, padding: 0 }}>
                    {NAV_ITEMS.map((item, i) => {
                        if (item.kind === 'center') {
                            return (
                                <li
                                    key={i}
                                    className="list"
                                    style={{ visibility: 'hidden', width: '80px', textAlign: 'center' }}
                                />
                            )
                        }

                        const isActive = pathname === item.to ||
                            (item.to === '/Home' && (pathname === '/' || pathname === '/Home'))

                        if (item.disabled) {
                            return (
                                <li
                                    key={i}
                                    className="list"
                                    aria-label={t(item.label)}
                                    aria-disabled="true"
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        opacity: 0.32,
                                        pointerEvents: 'none',
                                        userSelect: 'none',
                                    }}
                                >
                                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <span className="icon" style={{ display: 'flex', justifyContent: 'center', color: '#5A5C5E' }}>
                                            <item.Icon size={22} strokeWidth={1.8} />
                                        </span>
                                        <span className="text" />
                                    </span>
                                </li>
                            )
                        }

                        return (
                            <li
                                key={i}
                                className={`list${isActive ? ' active' : ''}`}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                            >
                                <Link
                                    to={item.to}
                                    aria-label={t(item.label)}
                                    aria-current={isActive ? 'page' : undefined}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        textDecoration: 'none',
                                        color: isActive ? '#7B51F1' : '#5A5C5E',
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    <span
                                        className="icon"
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            transform: isActive ? 'translateY(-10px)' : 'none',
                                            transition: 'transform 0.3s ease',
                                        }}
                                    >
                                        <item.Icon
                                            size={22}
                                            strokeWidth={isActive ? 2.2 : 1.8}
                                        />
                                    </span>
                                    {/* Active dot indicator */}
                                    <span
                                        className="text"
                                        style={{
                                            display: 'block',
                                            opacity: isActive ? 1 : 0,
                                        }}
                                    />
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </div>
        </>
    )
}

export default BottomNavigation
