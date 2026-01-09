import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import Logo from '../Logo';
import gtmTracking from '../../utils/gtmTracking';
import { useTranslation } from '../../contexts/TranslationContext';

function Footer({ showCopyright = true }) {
    const { t } = useTranslation();
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [companyInfo, setCompanyInfo] = useState({
        company_name: import.meta.env.COMPANY_NAME || process.env.COMPANY_NAME,
        company_tax_code: import.meta.env.COMPANY_TAX_CODE || process.env.COMPANY_TAX_CODE,
        company_email: import.meta.env.COMPANY_EMAIL || process.env.COMPANY_EMAIL,
        company_phone: import.meta.env.COMPANY_PHONE || process.env.COMPANY_PHONE,
        company_address: import.meta.env.COMPANY_ADDRESS || process.env.COMPANY_ADDRESS,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchCompanyInfo = useCallback(async () => {
        setLoading(true);
        setError(false);
        try {
            const response = await axios.get('/api/settings/company');
            setCompanyInfo(response.data);
        } catch (error) {
            console.error('Failed to fetch company info:', error);
            setError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanyInfo();
    }, [fetchCompanyInfo]);

    const socialLinks = [
        {
            href: import.meta.env.VITE_PROFILE_TWITTER || process.env.VITE_PROFILE_TWITTER,
            label: 'X',
            svgPath: "M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"
        },
        {
            href: import.meta.env.VITE_PROFILE_FACEBOOK || process.env.VITE_PROFILE_FACEBOOK,
            label: 'Facebook',
            svgPath: "M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"
        },
        {
            href: import.meta.env.VITE_PROFILE_LINKEDIN || process.env.VITE_PROFILE_LINKEDIN,
            label: 'LinkedIn',
            svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667h-3.554v-11.452h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zm-15.11-13.019c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019h-3.564v-11.452h3.564v11.452zm15.106-20.452h-20.454c-.979 0-1.771.774-1.771 1.729v20.542c0 .956.792 1.729 1.771 1.729h20.451c.978 0 1.778-.773 1.778-1.729v-20.542c0-.955-.8-1.729-1.778-1.729z"
        }
    ];

    return (
        <footer className="bg-gray-900 text-gray-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-4">
                            <Logo fallbackSize="default" />
                            <span className="text-xl font-bold text-white">Kenfinly</span>
                        </div>
                        <p className="text-gray-400 mb-4 max-w-md">
                            {t('footer.description')}
                        </p>
                        <div className="flex space-x-4">
                            {socialLinks.map(({ href, label, svgPath }, idx) =>
                                href ? (
                                    <a
                                        key={idx}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        onClick={() => gtmTracking.trackSocialLinkClick(label.toLowerCase())}
                                        className="text-gray-400 hover:text-white transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d={svgPath} />
                                        </svg>
                                    </a>
                                ) : null
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('footer.quick_links_title')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/" onClick={() => gtmTracking.trackFooterNavClick('home')} className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.navigation.home')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" onClick={() => gtmTracking.trackFooterNavClick('blog')} className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.navigation.blog')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" onClick={() => gtmTracking.trackFooterNavClick('about_us')} className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.navigation.about_us')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" onClick={() => gtmTracking.trackFooterNavClick('sign_in')} className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.navigation.sign_in')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" onClick={() => gtmTracking.trackFooterNavClick('get_started')} className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.navigation.get_started')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">{t('footer.utilities_title')}</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/textcase" className="text-gray-400 hover:text-white transition-colors">
                                    {t('footer.convert_case_tool')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-semibold mb-4">CÔNG TY TNHH GETKENKA</h3>
                        <p className="text-sm text-gray-400 mb-2">
                            Registered office address: Tầng 2, 81 Cách Mạng Tháng Tám, Phường Bến Thành, Thành phố Hồ Chí Minh, Việt Nam
                        </p>
                        <p className="text-sm text-gray-400 mb-4">Tax code: 0318304909</p>
                        <ul className="space-y-3">
                            <li className="flex items-center space-x-3">
                                <Mail className="w-5 h-5 text-blue-500" aria-hidden="true"/>
                                <a href={`mailto:${companyInfo.company_email}`} className="hover:text-white transition-colors">
                                    {companyInfo.company_email}
                                </a>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Phone className="w-5 h-5 text-blue-500" aria-hidden="true"/>
                                <a href={`tel:${companyInfo.company_phone}`} className="hover:text-white transition-colors">
                                    {companyInfo.company_phone}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {showCopyright && (
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-xs">
                        <p className="mb-2">Copyright © 2024–2026 Getkenka Ltd | Last updated: January 2026</p>
                        <p>
                            Concept by <a href="https://www.linkedin.com/in/dieter-entrepreneur/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Dieter R.</a> | Privacy Policy | Terms of Service | Sitemap
                        </p>
                    </div>
                )}
            </div>
        </footer>
    );
}

export default Footer;
