import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Heart, Settings, User, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const navItems = [
    { to: '/halo-dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/finance', icon: TrendingUp, label: 'Finance' },
    { to: '/commitments', icon: Heart, label: 'Promises' },
];

export default function HaloLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="flex min-h-screen" style={{ background: '#0B1810', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
            {/* Sidebar */}
            <aside className="flex flex-col w-52 shrink-0 border-r" style={{ background: '#0D1C12', borderColor: '#1A3020' }}>
                {/* Logo */}
                <div className="px-5 py-6 border-b" style={{ borderColor: '#1A3020' }}>
                    <img
                        src="/images/konfinly-logo.png"
                        alt="Konfinly"
                        className="h-7 w-auto object-contain"
                        onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                        }}
                    />
                    <div
                        className="items-center gap-2 text-white font-bold text-lg"
                        style={{ display: 'none' }}
                    >
                        <span className="text-green-400">K</span>
                        <span className="w-5 h-5 rounded-full border-2 border-green-400 inline-block" />
                        <span>NFINLY</span>
                    </div>
                </div>

                {/* Nav Items */}
                <nav className="flex-1 px-3 py-5 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                                    isActive
                                        ? 'text-white'
                                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                                }`
                            }
                            style={({ isActive }) =>
                                isActive ? { background: 'rgba(34,197,94,0.15)', color: '#4ADE80' } : {}
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <Icon size={16} style={{ color: isActive ? '#4ADE80' : undefined }} />
                                    {label}
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Bottom nav */}
                <div className="px-3 pb-5 space-y-1 border-t pt-4" style={{ borderColor: '#1A3020' }}>
                    <NavLink
                        to="/halo-dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        onClick={(e) => e.preventDefault()}
                    >
                        <Settings size={16} />
                        Settings
                    </NavLink>
                    <NavLink
                        to="/halo-dashboard"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-200 hover:bg-white/5"
                        onClick={(e) => e.preventDefault()}
                    >
                        <User size={16} />
                        Profile
                    </NavLink>

                    {/* User avatar row */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg mt-2 cursor-pointer hover:bg-white/5 group">
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                        >
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-gray-300 truncate flex-1">{user?.name || 'User'}</span>
                        <button
                            onClick={handleLogout}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Logout"
                        >
                            <LogOut size={14} className="text-gray-400 hover:text-red-400" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
