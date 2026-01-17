import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../contexts/TranslationContext';

function Footer2() {
    const { t } = useTranslation();
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-500">
                        &copy; {currentYear} Kenfinly. {t('footer.all_rights_reserved') || 'All rights reserved.'}
                    </div>
                    <div className="flex items-center space-x-6">
                        <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                            {t('footer.navigation.privacy_policy') || 'Privacy Policy'}
                        </Link>
                        <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                            {t('footer.navigation.terms_of_service') || 'Terms of Service'}
                        </Link>
                        <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                            {t('footer.navigation.about_us')}
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}

export default Footer2;
