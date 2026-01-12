import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import DynamicLogo from '../DynamicLogo';

function Navbar() {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    const navLinks = [
        { name: t('navbar.home'), path: '/' },
        { name: t('navbar.features'), path: '/#features' },
        { name: t('navbar.pricing') || t('navbar.plans'), path: '/pricing' },
        { name: t('navbar.blog'), path: '/blog' },
        { name: t('navbar.about'), path: '/about' },
    ];

    const isActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <DynamicLogo className="w-10 h-10" textClassName="text-xl font-bold text-black font-['Montserrat']" />
                    </div>

                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => {
                                    const navItem = link.name.toLowerCase().replace(/\s+/g, '_'); // Replace spaces with underscores (_)
                                    gtmTracking.trackHeaderNavClick(navItem);
                                }}
                                className={`text-sm font-medium transition-colors ${
                                    isActive(link.path)
                                        ? 'text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden md:flex items-center space-x-4">
                        <LanguageSwitcher />
                        <Link
                            to="/login"
                            onClick={() => gtmTracking.trackHeaderNavClick('sign_in')}
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                        >
                            {t('navbar.sign_in')}
                        </Link>
                        <Link
                            to="/register"
                            onClick={() => gtmTracking.trackHeaderNavClick('get_started')}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                        >
                            {t('navbar.get_started')}
                        </Link>
                    </div>

                    <div className="md:hidden flex items-center gap-3">
                        <LanguageSwitcher />
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {isMenuOpen && (
                <div className="md:hidden bg-white border-t">
                    <div className="px-4 py-4 space-y-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.path}
                                to={link.path}
                                onClick={() => {
                                    const navItem = link.name.toLowerCase().replace(/\s+/g, '_');
                                    gtmTracking.trackHeaderNavClick(navItem);
                                    setIsMenuOpen(false);
                                }}
                                className={`block text-sm font-medium ${
                                    isActive(link.path)
                                        ? 'text-blue-600'
                                        : 'text-gray-600 hover:text-blue-600'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <div className="pt-4 border-t space-y-3">
                            <Link
                                to="/login"
                                onClick={() => {
                                    gtmTracking.trackHeaderNavClick('sign_in');
                                    setIsMenuOpen(false);
                                }}
                                className="block text-sm font-medium text-gray-600 hover:text-blue-600"
                            >
                                {t('navbar.sign_in')}
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => {
                                    gtmTracking.trackHeaderNavClick('get_started');
                                    setIsMenuOpen(false);
                                }}
                                className="block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
                            >
                                {t('navbar.get_started')}
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Navbar;
