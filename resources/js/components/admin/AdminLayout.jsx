import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
    LayoutDashboard, 
    Users, 
    UserCircle, 
    Shield, 
    FolderTree, 
    Languages, 
    Key, 
    Settings, 
    Database, 
    FileText, 
    Receipt,
    LogOut,
    Menu,
    X
} from 'lucide-react';

const AdminLayout = ({ children }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/admin/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
        { name: 'Accounts', href: '/admin/accounts', icon: UserCircle },
        { name: 'Users', href: '/admin/users', icon: Users },
        { name: 'Roles', href: '/admin/roles', icon: Shield },
        { name: 'Categories', href: '/admin/categories', icon: FolderTree },
        { name: 'Languages', href: '/admin/languages', icon: Languages },
        { name: 'Licenses', href: '/admin/licenses', icon: Key },
        { name: 'Translations', href: '/admin/translations', icon: FileText },
        { name: 'Transactions', href: '/admin/transactions', icon: Receipt },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
        { name: 'Cache', href: '/admin/cache', icon: Database },
    ];

    const isActive = (href) => location.pathname === href;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center justify-between h-16 px-6 bg-gray-800">
                    <h1 className="text-xl font-bold text-white">Admin Panel</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                
                <div className="px-4 py-6">
                    <div className="flex items-center space-x-3 mb-6 px-2">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-gray-400">Super Admin</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive(item.href)
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`}
                                >
                                    <Icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Logout
                    </button>
                </div>
            </div>

            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:pl-64' : 'pl-0'}`}>
                <div className="sticky top-0 z-40 flex h-16 bg-white shadow">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                    <div className="flex-1 px-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">
                            {navigation.find(item => isActive(item.href))?.name || 'Admin Dashboard'}
                        </h2>
                    </div>
                </div>

                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
