import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from '../../contexts/TranslationContext'
import { useAuth } from '../../contexts/AuthContext'
import {
    LayoutDashboard,
    TrendingUp,
    Wallet,
    BookMarked,
    Settings,
    Search,
    Plus,
    TrendingDown,
    ArrowLeftRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavItem {
    key: string
    labelEn: string
    labelVi: string
    icon: React.ComponentType<{ size?: number; className?: string }>
    to: string
}

interface HaloLayoutProps {
    children: React.ReactNode
    onFabExpense?: () => void
    onFabIncome?:  () => void
    onFabTransfer?: () => void
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
    { key: 'dashboard', labelEn: 'Dashboard', labelVi: 'Tổng Quan', icon: LayoutDashboard, to: '/halo' },
    { key: 'finance',   labelEn: 'Finance',   labelVi: 'Tài Chính',  icon: TrendingUp,      to: '/halo/finance' },
    { key: 'wallet',    labelEn: 'Wallet',    labelVi: 'Ví Tiền',    icon: Wallet,          to: '/halo/wallet' },
    { key: 'promises',  labelEn: 'Promises',  labelVi: 'Cam Kết',    icon: BookMarked,      to: '/halo/promises' },
    { key: 'settings',  labelEn: 'Settings',  labelVi: 'Cài Đặt',   icon: Settings,        to: '/halo/settings' },
]

type FabOption = 'income' | 'expense' | 'transfer'

// ─── Component ────────────────────────────────────────────────────────────────

const HaloLayout: React.FC<HaloLayoutProps> = ({
    children,
    onFabExpense,
    onFabIncome,
    onFabTransfer,
}) => {
    const { currentLanguage, changeLanguage, languages } = useTranslation()
    const { user } = useAuth()
    const location = useLocation()

    const [fabOpen, setFabOpen] = useState(false)

    const isVi     = currentLanguage?.code === 'vi'
    const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()

    const handleLangToggle = (code: string) => {
        const lang = languages?.find((l: { code: string }) => l.code === code)
        if (lang) changeLanguage(lang.id, lang.code)
    }

    const handleFabOption = (type: FabOption) => {
        setFabOpen(false)
        if (type === 'expense'  && onFabExpense)  onFabExpense()
        if (type === 'income'   && onFabIncome)   onFabIncome()
        if (type === 'transfer' && onFabTransfer) onFabTransfer()
    }

    return (
        <div className="halo-page">
            {/* ── Mobile top bar ── */}
            <header className="halo-topbar">
                <div className="halo-topbar__brand">
                    <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="14" stroke="#22c55e" strokeWidth="2.5" fill="none"/>
                        <circle cx="16" cy="16" r="8"  stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.5"/>
                    </svg>
                    <span className="halo-topbar__brand-text">KENFINLY</span>
                </div>

                <div className="halo-topbar__actions">
                    {/* Language toggle */}
                    <div className="halo-lang-toggle" role="group" aria-label="Language">
                        <button
                            className={`halo-lang-toggle__btn ${!isVi ? 'halo-lang-toggle__btn--active' : ''}`}
                            onClick={() => handleLangToggle('en')}
                        >
                            EN
                        </button>
                        <button
                            className={`halo-lang-toggle__btn ${isVi ? 'halo-lang-toggle__btn--active' : ''}`}
                            onClick={() => handleLangToggle('vi')}
                        >
                            VN
                        </button>
                    </div>

                    {/* Search */}
                    <button className="halo-topbar__icon-btn" aria-label="Search">
                        <Search size={16} />
                    </button>

                    {/* Avatar */}
                    <div className="halo-topbar__avatar" title={user?.name || 'User'}>
                        {initials}
                    </div>
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="halo-content">
                {children}
            </main>

            {/* ── FAB picker backdrop ── */}
            {fabOpen && (
                <div
                    className="fab-picker-backdrop fab-picker-backdrop--visible"
                    onClick={() => setFabOpen(false)}
                />
            )}

            {/* ── FAB picker menu ── */}
            {fabOpen && (
                <div className="fab-picker-menu">
                    <button
                        className="fab-picker-option fab-picker-option--income"
                        onClick={() => handleFabOption('income')}
                    >
                        <span className="fab-picker-option__icon">
                            <TrendingUp size={18} />
                        </span>
                        {isVi ? 'Thêm Thu Nhập' : 'Add Income'}
                    </button>
                    <button
                        className="fab-picker-option fab-picker-option--expense"
                        onClick={() => handleFabOption('expense')}
                    >
                        <span className="fab-picker-option__icon">
                            <TrendingDown size={18} />
                        </span>
                        {isVi ? 'Thêm Chi Tiêu' : 'Add Expense'}
                    </button>
                    <button
                        className="fab-picker-option fab-picker-option--transfer"
                        onClick={() => handleFabOption('transfer')}
                    >
                        <span className="fab-picker-option__icon">
                            <ArrowLeftRight size={18} />
                        </span>
                        {isVi ? 'Chuyển Tiền' : 'Transfer Money'}
                    </button>
                </div>
            )}

            {/* ── Floating Action Button ── */}
            <button
                className={`floating-action-btn ${fabOpen ? 'floating-action-btn--open' : ''}`}
                onClick={() => setFabOpen(v => !v)}
                aria-label={isVi ? 'Thêm giao dịch' : 'Add transaction'}
            >
                <Plus size={26} />
            </button>

            {/* ── Bottom Navigation ── */}
            <nav className="halo-bottom-nav" aria-label="Main navigation">
                <ul className="halo-bottom-nav__list">
                    {NAV_ITEMS.map(({ key, labelEn, labelVi, icon: Icon, to }) => {
                        const active = location.pathname === to ||
                            (to === '/halo' && location.pathname === '/halo')
                        return (
                            <li key={key} className="halo-bottom-nav__item">
                                <Link
                                    to={to}
                                    className={`halo-bottom-nav__link ${active ? 'halo-bottom-nav__link--active' : ''}`}
                                >
                                    <Icon size={22} className="halo-bottom-nav__icon" />
                                    <span>{isVi ? labelVi : labelEn}</span>
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </div>
    )
}

export default HaloLayout
