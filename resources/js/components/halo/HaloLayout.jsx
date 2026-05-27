import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Heart, Settings, User, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../../css/halo.css';

const NAV_ITEMS = [
    { to: '/halo-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/finance',        icon: TrendingUp,      label: 'Finance'   },
    { to: '/commitments',    icon: Heart,           label: 'Promises'  },
];

export default function HaloLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const closeSidebar = () => setSidebarOpen(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const SidebarContent = () => (
        <>
        <div className="halo-sidebar-logo">
        <img
            src="/images/logo-white-text.png"
            alt="Kenfinly"
        />
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
                <button
                    className="halo-nav-link w-100"
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'default', opacity: 0.5 }}
                >
                    <Settings size={16} />
                    Settings
                </button>
                <button
                    className="halo-nav-link w-100"
                    style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'default', opacity: 0.5 }}
                >
                    <User size={16} />
                    Profile
                </button>

                <div className="halo-user-row">
                    <div className="halo-avatar">
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontSize: '0.8125rem', color: '#D1D5DB', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.name || 'User'}
                    </span>
                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={{ background: 'none', border: 'none', padding: '0.2rem', cursor: 'pointer' }}
                    >
                        <LogOut size={14} style={{ color: '#9CA3AF' }} />
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="halo-layout">
            {/* ── Mobile overlay ── */}
            <div
                className={`halo-sidebar-overlay${sidebarOpen ? ' open' : ''}`}
                onClick={closeSidebar}
                aria-hidden="true"
            />

            {/* ── Desktop sidebar ── */}
            <aside className={`halo-sidebar${sidebarOpen ? ' open' : ''}`}>
                <SidebarContent />
            </aside>

            {/* ── Main content area ── */}
            <main className="halo-main">
                {/* Mobile top bar */}
                <header className="halo-topbar">
                    <button
                        className="halo-hamburger"
                        onClick={() => setSidebarOpen(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {sidebarOpen ? <X size={22} style={{ color: 'var(--halo-accent-light)' }} /> : (
                            <>
                                <span /><span /><span />
                            </>
                        )}
                    </button>
                    <span style={{ fontWeight: 700, color: 'var(--halo-accent-light)', fontSize: '0.9375rem', letterSpacing: '0.05em' }}>
                        KENFINLY
                    </span>
                    <div className="halo-avatar" style={{ width: 28, height: 28, fontSize: '0.6875rem' }}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                </header>

                {children}
            </main>
        </div>
    );
}
