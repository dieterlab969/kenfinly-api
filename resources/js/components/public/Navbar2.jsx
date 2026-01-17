import React from 'react';
import { Link } from 'react-router-dom';
import DynamicLogo from '../DynamicLogo';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from '../../contexts/TranslationContext';

function Navbar2() {
    const { t } = useTranslation();

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center">
                            <DynamicLogo className="w-8 h-8" showText={true} textClassName="text-lg font-bold text-gray-900 font-['Montserrat']" />
                        </Link>
                    </div>

                    <div className="flex items-center space-x-6">
                        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            {t('navbar.home')}
                        </Link>
                        <Link to="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                            {t('navbar.blog')}
                        </Link>
                        <LanguageSwitcher />
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar2;
