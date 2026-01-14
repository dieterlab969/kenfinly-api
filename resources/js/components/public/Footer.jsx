import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import axios from 'axios';
import gtmTracking from '../../utils/gtmTracking';
import { useTranslation } from '../../contexts/TranslationContext';
import DynamicLogo from '../DynamicLogo';

const StatCard = ({ title, value, icon, color }) => {
    const colorClasses = {
        blue: 'text-blue-600 bg-blue-50',
        green: 'text-green-600 bg-green-50',
        purple: 'text-purple-600 bg-purple-50',
        orange: 'text-orange-600 bg-orange-50',
    };

    return (
        <div className="mb-4 p-4 rounded border border-gray-700 bg-gray-800 flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center space-x-3">
                <span className="text-2xl">{icon}</span>
                <div className={`text-lg font-semibold ${colorClasses[color]}`}>{title}</div>
            </div>
            <div className={`text-3xl font-bold ${colorClasses[color].split(' ')[0]}`}>{value}</div>
        </div>
    );
};

function Footer({ showCopyright = true, showAnalytics = true }) {
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

    // Analytics state
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);

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

    const fetchAnalytics = useCallback(async () => {
        if (!showAnalytics) return;
        try {
            const response = await axios.get('/api/analytics/public-stats');
            if (response.data.success) {
                setStats(response.data.data);
                setStatsError(null);
            } else {
                setStatsError(t('analyticsFooter.loadFailed'));
            }
        } catch (err) {
            setStatsError(t('analyticsFooter.unableToLoad'));
            console.error('Analytics fetch error:', err);
        } finally {
            setStatsLoading(false);
        }
    }, [showAnalytics, t]);

    useEffect(() => {
        fetchCompanyInfo();
    }, [fetchCompanyInfo]);

    useEffect(() => {
        if (showAnalytics) {
            fetchAnalytics();
            const interval = setInterval(fetchAnalytics, 300000);
            return () => clearInterval(interval);
        }
    }, [showAnalytics, fetchAnalytics]);

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
            {showAnalytics && stats && !statsError && (
                <div className="border-b border-gray-800 py-12">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <h3 className="text-xl font-semibold text-white mb-8 text-center">
                            {t('analyticsFooter.title')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                                <h4 className="text-lg font-semibold mb-6 text-blue-400 flex items-center">
                                    <span className="mr-2">📈</span> {t('analyticsFooter.weeklyStats')}
                                </h4>
                                <div className="space-y-4">
                                    <StatCard
                                        title={t('analyticsFooter.visitors')}
                                        value={stats.weekly.formatted_users}
                                        icon="👥"
                                        color="blue"
                                    />
                                    <StatCard
                                        title={t('analyticsFooter.totalSessions')}
                                        value={stats.weekly.formatted_sessions}
                                        icon="🔄"
                                        color="green"
                                    />
                                </div>
                            </div>
                            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
                                <h4 className="text-lg font-semibold mb-6 text-purple-400 flex items-center">
                                    <span className="mr-2">📊</span> {t('analyticsFooter.monthlyStats')}
                                </h4>
                                <div className="space-y-4">
                                    <StatCard
                                        title={t('analyticsFooter.visitors')}
                                        value={stats.monthly.formatted_users}
                                        icon="👥"
                                        color="purple"
                                    />
                                    <StatCard
                                        title={t('analyticsFooter.totalSessions')}
                                        value={stats.monthly.formatted_sessions}
                                        icon="🔄"
                                        color="orange"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-8 text-center text-sm text-gray-500">
                            <p>{t('analyticsFooter.lastUpdated', { date: new Date(stats.weekly.updated_at).toLocaleString() })}</p>
                            <p className="mt-2 max-w-2xl mx-auto italic">{t('analyticsFooter.disclaimer')}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center space-x-2 mb-6">
                            <DynamicLogo className="w-12 h-12" showText={true} textClassName="text-2xl font-bold text-white font-['Montserrat']" />
                        </div>
                        <p className="text-gray-400 mb-6 text-lg leading-relaxed max-w-md">
                            {t('footer.description')}
                        </p>
                        <div className="flex space-x-5">
                            {socialLinks.map(({ href, label, svgPath }, idx) =>
                                href ? (
                                    <a
                                        key={idx}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={label}
                                        onClick={() => gtmTracking.trackSocialLinkClick(label.toLowerCase())}
                                        className="text-gray-400 hover:text-white transition-all transform hover:scale-110"
                                    >
                                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d={svgPath} />
                                        </svg>
                                    </a>
                                ) : null
                            )}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 uppercase tracking-wider">{t('footer.quick_links_title')}</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/" onClick={() => gtmTracking.trackFooterNavClick('home')} className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.navigation.home')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/blog" onClick={() => gtmTracking.trackFooterNavClick('blog')} className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.navigation.blog')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" onClick={() => gtmTracking.trackFooterNavClick('about_us')} className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.navigation.about_us')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" onClick={() => gtmTracking.trackFooterNavClick('sign_in')} className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.navigation.sign_in')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" onClick={() => gtmTracking.trackFooterNavClick('get_started')} className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.navigation.get_started')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-white font-bold text-lg mb-6 uppercase tracking-wider">{t('footer.utilities_title')}</h3>
                        <ul className="space-y-4">
                            <li>
                                <Link to="/textcase" className="text-gray-400 hover:text-white transition-colors flex items-center">
                                    <span className="mr-2">›</span> {t('footer.convert_case_tool')}
                                </Link>
                            </li>
                        </ul>

                        <h3 className="text-white font-bold text-lg mt-8 mb-6 uppercase tracking-wider">Contact Us</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start space-x-3 text-gray-400">
                                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-1" aria-hidden="true"/>
                                <span className="text-sm leading-relaxed">{companyInfo.company_address}</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-400">
                                <Mail className="w-5 h-5 text-blue-500 shrink-0" aria-hidden="true"/>
                                <a href={`mailto:${companyInfo.company_email}`} className="hover:text-white transition-colors text-sm">
                                    {companyInfo.company_email}
                                </a>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-400">
                                <Phone className="w-5 h-5 text-blue-500 shrink-0" aria-hidden="true"/>
                                <a href={`tel:${companyInfo.company_phone}`} className="hover:text-white transition-colors text-sm">
                                    {companyInfo.company_phone}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {showCopyright && (
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-500 text-sm">
                        <p className="mb-4">Copyright © 2024–{currentYear} {companyInfo.company_name} | Last updated: January 2026</p>
                        <div className="flex flex-wrap justify-center gap-4 text-xs">
                            <span className="text-gray-600">Concept by <a href="https://www.linkedin.com/in/dieter-entrepreneur/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Dieter R.</a></span>
                            <span className="text-gray-700">|</span>
                            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <span className="text-gray-700">|</span>
                            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                            <span className="text-gray-700">|</span>
                            <Link to="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</Link>
                        </div>
                    </div>
                )}
            </div>
        </footer>
    );
}

export default Footer;

export default Footer;
