import React, { useState, useCallback, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, TrendingUp, TrendingDown, Heart, Settings,
    User, LogOut, X, Plus, Wallet,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../css/halo.css';

/* ── Sidebar nav items (desktop) ── */
const NAV_ITEMS = [
    { to: '/halo-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/finance',        icon: TrendingUp,      label: 'Finance'   },
    { to: '/commitments',    icon: Heart,           label: 'Promises'  },
];

/* ── Bottom nav items (mobile) ── */
const BOTTOM_NAV = [
    { to: '/halo-dashboard',       icon: LayoutDashboard, en: 'Dashboard', vi: 'Bảng' },
    { to: '/finance',              icon: TrendingUp,      en: 'Finance',   vi: 'Tài chính' },
    { to: '/commitments',          icon: Heart,           en: 'Promises',  vi: 'Cam kết' },
    { to: '/saving-habit-tracker', icon: Wallet,          en: 'Habits',    vi: 'Thói quen' },
];

const TODAY = format(new Date(), 'yyyy-MM-dd');
const emptyForm = () => ({ account_id: '', category_id: '', amount: '', transaction_date: TODAY, notes: '' });

export default function HaloLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    /* ── Sidebar ── */
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const closeSidebar = () => setSidebarOpen(false);

    /* ── Language toggle ── */
    const [lang, setLang] = useState(() => localStorage.getItem('halo_lang') || 'en');
    const toggleLang = useCallback((next) => {
        setLang(next);
        localStorage.setItem('halo_lang', next);
    }, []);

    /* ── FAB state ── */
    const [fabOpen,      setFabOpen]      = useState(false);
    const [fabMode,      setFabMode]      = useState(null); // 'income' | 'expense'
    const [fabForm,      setFabForm]      = useState(emptyForm());
    const [fabLoading,   setFabLoading]   = useState(false);
    const [fabError,     setFabError]     = useState('');
    const [fabSuccess,   setFabSuccess]   = useState('');
    const [fabCats,      setFabCats]      = useState([]);
    const [fabAccounts,  setFabAccounts]  = useState([]);
    const [fabDataReady, setFabDataReady] = useState(false);

    /* Lazy-load categories + accounts on first FAB open */
    useEffect(() => {
        if (!fabOpen || fabDataReady) return;
        Promise.all([api.get('/categories'), api.get('/accounts')])
            .then(([cr, ar]) => {
                setFabCats(cr.data.data     || []);
                setFabAccounts(ar.data.data || []);
                setFabDataReady(true);
            })
            .catch(console.error);
    }, [fabOpen, fabDataReady]);

    const openFab   = () => setFabOpen(v => !v);
    const closeFab  = () => { setFabOpen(false); };

    const selectMode = (mode) => {
        setFabMode(mode);
        setFabOpen(false);
        setFabForm(emptyForm());
        setFabError('');
        setFabSuccess('');
    };

    const closeModal = () => {
        setFabMode(null);
        setFabError('');
        setFabSuccess('');
    };

    const handleFabSubmit = async (e) => {
        e.preventDefault();
        if (!fabForm.account_id)  { setFabError(lang === 'vi' ? 'Vui lòng chọn tài khoản.' : 'Please select an account.'); return; }
        if (!fabForm.category_id) { setFabError(lang === 'vi' ? 'Vui lòng chọn danh mục.'  : 'Please select a category.'); return; }
        if (!fabForm.amount)      { setFabError(lang === 'vi' ? 'Vui lòng nhập số tiền.'    : 'Please enter an amount.'); return; }
        setFabLoading(true);
        setFabError('');
        try {
            await api.post('/transactions', { ...fabForm, type: fabMode });
            setFabSuccess(fabMode === 'income'
                ? (lang === 'vi' ? 'Đã thêm thu nhập!' : 'Income added!')
                : (lang === 'vi' ? 'Đã thêm chi tiêu!' : 'Expense added!'));
            setTimeout(closeModal, 1400);
        } catch (err) {
            const msgs = err.response?.data?.errors;
            setFabError(msgs
                ? Object.values(msgs).flat().join(', ')
                : (err.response?.data?.message || 'Failed to save.'));
        } finally {
            setFabLoading(false);
        }
    };

    const filteredCats = fabCats.filter(c => c.type === fabMode);

    /* ── Auth ── */
    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <>
            <div className="halo-sidebar-logo">
                <img src="/images/logo-white-text.png" alt="Kenfinly" />
            </div>
            <nav className="halo-sidebar-nav">
                {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `halo-nav-link${isActive ? ' active' : ''}`}
                        onClick={closeSidebar}
                    >
                        {({ isActive }) => (
                            <>
                                <Icon size={16} style={{ color: isActive ? 'var(--halo-accent-light)' : undefined }} />
                                {label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>
            <div className="halo-sidebar-bottom">
                <button className="halo-nav-link w-100"
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'default', opacity: 0.5 }}>
                    <Settings size={16} /> Settings
                </button>
                <button className="halo-nav-link w-100"
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'default', opacity: 0.5 }}>
                    <User size={16} /> Profile
                </button>
                <div className="halo-user-row">
                    <div className="halo-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#D1D5DB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name || 'User'}
                    </span>
                    <button onClick={handleLogout} title="Logout"
                        style={{ background: 'none', border: 'none', padding: '0.2rem', cursor: 'pointer' }}>
                        <LogOut size={14} style={{ color: '#9CA3AF' }} />
                    </button>
                </div>
            </div>
        </>
    );

    /* ── FAB form fields ── */
    const fabField = (key, val) => setFabForm(f => ({ ...f, [key]: val }));

    return (
        <div className="halo-layout">
            {/* Mobile overlay */}
            <div
                className={`halo-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />

            {/* Desktop sidebar */}
            <aside className={`halo-sidebar${sidebarOpen ? ' open' : ''}`}>
                <SidebarContent />
            </aside>

            {/* Main content */}
            <main className="halo-main">
                {/* ── Mobile top bar ── */}
                <header className="halo-topbar">
                    <button
                        className="halo-hamburger"
                        onClick={() => setSidebarOpen(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {sidebarOpen
                            ? <X size={22} style={{ color: 'var(--halo-accent-light)' }} />
                            : <><span /><span /><span /></>}
                    </button>

                    <img src="/images/logo-white-text.png" alt="Kenfinly"
                        style={{ height: 20, objectFit: 'contain' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {/* Language toggle */}
                        <div className="halo-lang-toggle" role="group" aria-label="Language switcher">
                            <button
                                className={lang === 'en' ? 'active' : ''}
                                onClick={() => toggleLang('en')}
                                aria-pressed={lang === 'en'}
                            >EN</button>
                            <button
                                className={lang === 'vi' ? 'active' : ''}
                                onClick={() => toggleLang('vi')}
                                aria-pressed={lang === 'vi'}
                            >VN</button>
                        </div>
                        {/* Avatar */}
                        <div className="halo-avatar" style={{ width: 28, height: 28, fontSize: '0.6875rem' }}>
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>

                {children}
            </main>

            {/* ════════════════════════════════════
                MOBILE-ONLY: Bottom Navigation Bar
            ════════════════════════════════════ */}
            <nav className="halo-bottom-nav" aria-label="Main navigation">
                {BOTTOM_NAV.map(({ to, icon: Icon, en, vi }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) => `halo-bottom-nav-item${isActive ? ' active' : ''}`}
                    >
                        <Icon size={18} />
                        <span className="halo-bottom-nav-label">{lang === 'vi' ? vi : en}</span>
                    </NavLink>
                ))}
                <button className="halo-bottom-nav-item" style={{ opacity: 0.38, cursor: 'default' }} disabled aria-label="Settings">
                    <Settings size={18} />
                    <span className="halo-bottom-nav-label">{lang === 'vi' ? 'Cài đặt' : 'Settings'}</span>
                </button>
            </nav>

            {/* ════════════════════════════════════
                MOBILE-ONLY: FAB picker backdrop
            ════════════════════════════════════ */}
            <div
                className={`fab-picker-backdrop${fabOpen ? ' open' : ''}`}
                onClick={closeFab}
                aria-hidden="true"
            />

            {/* FAB picker options */}
            <div className={`fab-picker-menu${fabOpen ? ' open' : ''}`} role="menu">
                <button
                    className="fab-picker-option expense"
                    onClick={() => selectMode('expense')}
                    role="menuitem"
                >
                    <TrendingDown size={14} />
                    {lang === 'vi' ? 'Thêm Chi Tiêu' : 'Add Expense'}
                </button>
                <button
                    className="fab-picker-option income"
                    onClick={() => selectMode('income')}
                    role="menuitem"
                >
                    <TrendingUp size={14} />
                    {lang === 'vi' ? 'Thêm Thu Nhập' : 'Add Income'}
                </button>
            </div>

            {/* FAB button */}
            <button
                className={`floating-action-btn${fabOpen ? ' open' : ''}`}
                onClick={openFab}
                aria-label={fabOpen ? 'Close menu' : 'Add transaction'}
                aria-expanded={fabOpen}
                aria-haspopup="menu"
            >
                <Plus size={24} />
            </button>

            {/* ════════════════════════════════════
                Transaction Modal (Income | Expense)
            ════════════════════════════════════ */}
            {fabMode && (
                <div
                    className="halo-modal-backdrop"
                    role="dialog"
                    aria-modal="true"
                    aria-label={fabMode === 'income' ? 'Add Income' : 'Add Expense'}
                >
                    <div className="halo-modal">
                        <div className="halo-modal-header">
                            <h2 className="halo-modal-title"
                                style={{ color: fabMode === 'income' ? '#4ADE80' : '#F87171' }}>
                                {fabMode === 'income'
                                    ? <TrendingUp  size={18} style={{ marginRight: 6 }} />
                                    : <TrendingDown size={18} style={{ marginRight: 6 }} />}
                                {fabMode === 'income'
                                    ? (lang === 'vi' ? 'Thêm Thu Nhập' : 'Add Income')
                                    : (lang === 'vi' ? 'Thêm Chi Tiêu' : 'Add Expense')}
                            </h2>
                            <button className="halo-modal-close" onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        {fabError && <div className="halo-form-error">{fabError}</div>}
                        {fabSuccess && (
                            <div style={{
                                background: 'rgba(34,197,94,0.12)',
                                border: '1px solid rgba(34,197,94,0.4)',
                                borderRadius: 8, padding: '0.625rem 0.875rem',
                                fontSize: '0.8125rem', color: '#4ADE80', marginBottom: '1rem',
                            }}>
                                {fabSuccess}
                            </div>
                        )}

                        <form onSubmit={handleFabSubmit} noValidate>
                            {/* Account */}
                            <div className="halo-form-group">
                                <label className="halo-form-label" htmlFor="fab-account">
                                    {lang === 'vi' ? 'Tài khoản' : 'Account'} *
                                </label>
                                <select id="fab-account" className="halo-select"
                                    value={fabForm.account_id} required
                                    onChange={e => fabField('account_id', e.target.value)}>
                                    <option value="">— {lang === 'vi' ? 'Chọn tài khoản' : 'Select account'} —</option>
                                    {fabAccounts.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Category */}
                            <div className="halo-form-group">
                                <label className="halo-form-label" htmlFor="fab-category">
                                    {lang === 'vi' ? 'Danh mục' : 'Category'} *
                                </label>
                                <select id="fab-category" className="halo-select"
                                    value={fabForm.category_id} required
                                    onChange={e => fabField('category_id', e.target.value)}>
                                    <option value="">— {lang === 'vi' ? 'Chọn danh mục' : 'Select category'} —</option>
                                    {filteredCats.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div className="halo-form-group">
                                <label className="halo-form-label" htmlFor="fab-amount">
                                    {lang === 'vi' ? 'Số tiền (VND)' : 'Amount (VND)'} *
                                </label>
                                <input id="fab-amount" type="number" className="halo-input"
                                    value={fabForm.amount} min="1" step="1" required
                                    placeholder="e.g. 500000"
                                    onChange={e => fabField('amount', e.target.value)} />
                            </div>

                            {/* Date */}
                            <div className="halo-form-group">
                                <label className="halo-form-label" htmlFor="fab-date">
                                    {lang === 'vi' ? 'Ngày' : 'Date'} *
                                </label>
                                <input id="fab-date" type="date" className="halo-input"
                                    value={fabForm.transaction_date} required
                                    style={{ colorScheme: 'dark' }}
                                    onChange={e => fabField('transaction_date', e.target.value)} />
                            </div>

                            {/* Notes */}
                            <div className="halo-form-group">
                                <label className="halo-form-label" htmlFor="fab-notes">
                                    {lang === 'vi' ? 'Ghi chú' : 'Notes'}
                                </label>
                                <textarea id="fab-notes" className="halo-textarea" rows={2}
                                    value={fabForm.notes}
                                    placeholder={lang === 'vi' ? 'Ghi chú tùy chọn...' : 'Optional note...'}
                                    onChange={e => fabField('notes', e.target.value)} />
                            </div>

                            <div style={{ display: 'flex', gap: '0.625rem' }}>
                                <button type="button" className="halo-btn halo-btn-outline" style={{ flex: 1 }}
                                    onClick={closeModal}>
                                    {lang === 'vi' ? 'Hủy' : 'Cancel'}
                                </button>
                                <button type="submit" className="halo-btn" disabled={fabLoading}
                                    style={{
                                        flex: 1,
                                        background: fabMode === 'income' ? '#22C55E' : '#EF4444',
                                        color:      fabMode === 'income' ? '#0B1810' : 'white',
                                    }}>
                                    {fabLoading ? '...' : (lang === 'vi' ? 'Lưu' : 'Save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
