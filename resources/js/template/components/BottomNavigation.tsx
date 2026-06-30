import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, Plus, BarChart2, FileText } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BottomNavigationProps {
    fabOpen: boolean
    onFabToggle: () => void
}

type NavEntry =
    | { kind: 'link';     to: string;  Icon: React.FC<{ size?: number; strokeWidth?: number }>; disabled?: boolean }
    | { kind: 'center' }

// ─── Nav config ───────────────────────────────────────────────────────────────

const NAV_ITEMS: NavEntry[] = [
    { kind: 'link', to: '/Home',      Icon: Home,      disabled: false },
    { kind: 'link', to: '/analytics', Icon: TrendingUp, disabled: false },
    { kind: 'center' },
    { kind: 'link', to: '/BarChart',  Icon: BarChart2, disabled: true  },
    { kind: 'link', to: '/Invoicing', Icon: FileText,  disabled: true  },
]

// ─── Component ────────────────────────────────────────────────────────────────

const BottomNavigation: React.FC<BottomNavigationProps> = ({ fabOpen, onFabToggle }) => {
    const { pathname } = useLocation()

    return (
        <>
            {/* ── Curved SVG background + floating FAB circle ── */}
            <div className="bottom-menu-svg-main">
                <div className="bottom-menu-svg">
                    {/* FAB circle */}
                    <div
                        className="gol3"
                        onClick={onFabToggle}
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

                    {/* Curved notch SVG */}
                    <svg
                        className="bottom-menu-svg-design"
                        width="600"
                        height="150"
                        viewBox="0 0 375 104"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <g filter="url(#bnav_blur)">
                            <path
                                d="M188 45.5313C205.673 45.5313 220 31.2045 220 13.5313C220 7.32365 224.732 0.674172 230.917 1.20338L360.364 12.2791C368.642 12.9873 375 19.913 375 28.2208V103.531H0V28.2275C0 19.9169 6.36254 12.9898 14.6432 12.2851L145.074 1.18463C151.266 0.657657 156 7.31698 156 13.5313C156 31.2045 170.327 45.5313 188 45.5313Z"
                                fill="url(#bnav_grad)"
                            />
                        </g>
                        <defs>
                            <filter
                                id="bnav_blur"
                                x="-24" y="-22.8447"
                                width="423" height="150.376"
                                filterUnits="userSpaceOnUse"
                                colorInterpolationFilters="sRGB"
                            >
                                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                                <feGaussianBlur in="BackgroundImageFix" stdDeviation="12" />
                                <feComposite in2="SourceAlpha" operator="in" result="effect1_backgroundBlur" />
                                <feBlend mode="normal" in="SourceGraphic" in2="effect1_backgroundBlur" result="shape" />
                            </filter>
                            <linearGradient
                                id="bnav_grad"
                                x1="187.5" y1="0"
                                x2="188"   y2="103.531"
                                gradientUnits="userSpaceOnUse"
                            >
                                <stop offset="0" stopOpacity="0.24" />
                                <stop offset="1" stopOpacity="0.16" />
                            </linearGradient>
                        </defs>
                    </svg>
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
