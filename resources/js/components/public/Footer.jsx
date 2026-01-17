import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Facebook, Linkedin, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from '../../contexts/TranslationContext';
import DynamicLogo from '../DynamicLogo';

function Footer({ showCopyright = true, showAnalytics = true }) {
    const { t } = useTranslation();
    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const [companyInfo, setCompanyInfo] = useState({
        company_name: 'Kenfinly',
        company_tax_code: '0318304909',
        company_email: 'purchasevn@getkenka.com',
        company_phone: '+84 0941069969',
        company_address: '2nd Floor, 81 CMT8 Street, Ben Thanh Ward, Dist 1, HCMC',
    });

    const fetchCompanyInfo = useCallback(async () => {
        try {
            const response = await axios.get('/api/settings/company');
            setCompanyInfo(response.data);
        } catch (error) {
            console.error('Failed to fetch company info:', error);
        }
    }, []);

    useEffect(() => {
        fetchCompanyInfo();
    }, [fetchCompanyInfo]);

    const socialLinks = [
        {
            href: '#',
            label: 'Twitter',
            icon: <Twitter size={20} />
        },
        {
            href: '#',
            label: 'Facebook',
            icon: <Facebook size={20} />
        },
        {
            href: '#',
            label: 'LinkedIn',
            icon: <Linkedin size={20} />
        }
    ];

    const ColumnTitle = ({ children }) => (
        <div className="relative mb-8 pt-4">
            <div className="absolute top-0 left-0 w-12 h-1 bg-blue-500 rounded-full"></div>
            <h3 className="text-white font-bold text-xl tracking-tight">{children}</h3>
        </div>
    );

    return (
        <footer className="bg-[#0f172a] text-[#cbd5e1] pt-20 pb-10 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
                    {/* Column 1: Logo & Brand */}
                    <div className="space-y-6">
                        <Link to="/" className="inline-block transform hover:scale-105 transition-transform duration-300">
                            <DynamicLogo className="w-14 h-14" showText={true} textClassName="text-2xl font-bold text-white font-['Montserrat'] ml-3" />
                        </Link>
                        <p className="text-[#94a3b8] leading-relaxed text-sm max-w-xs">
                            {t('footer.description') || 'Kenfinly helps you take control of your financial future with intuitive tools and insights.'}
                        </p>
                        <div className="flex items-center space-x-4">
                            {socialLinks.map((social, idx) => (
                                <a
                                    key={idx}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 rounded-lg bg-[#1e293b] text-[#cbd5e1] hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-lg border border-[#334155]"
                                    aria-label={social.label}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <ColumnTitle>{t('footer.quick_links_title') || 'Quick Links'}</ColumnTitle>
                        <ul className="space-y-4">
                            {[
                                { to: '/', label: t('footer.navigation.home') || 'Home' },
                                { to: '/blog', label: t('footer.navigation.blog') || 'Blog' },
                                { to: '/about', label: t('footer.navigation.about_us') || 'About Us' },
                                { to: '/login', label: t('footer.navigation.sign_in') || 'Login' },
                                { to: '/register', label: t('footer.navigation.get_started') || 'Get Started' }
                            ].map((link, idx) => (
                                <li key={idx}>
                                    <Link 
                                        to={link.to} 
                                        className="group flex items-center text-[#94a3b8] hover:text-white transition-colors duration-200"
                                    >
                                        <ChevronRight size={14} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-blue-500" />
                                        <span>{link.label}</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Utilities */}
                    <div>
                        <ColumnTitle>{t('footer.utilities_title') || 'Utilities'}</ColumnTitle>
                        <ul className="space-y-4">
                            <li>
                                <Link 
                                    to="/textcase" 
                                    className="group flex items-center text-[#94a3b8] hover:text-white transition-colors duration-200"
                                >
                                    <ChevronRight size={14} className="mr-2 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-blue-500" />
                                    <span>{t('footer.convert_case_tool') || 'Convert Case Tool'}</span>
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <ColumnTitle>{t('footer.contact_title') || 'Contact Us'}</ColumnTitle>
                        <ul className="space-y-5 text-sm">
                            <li className="flex items-start space-x-3 group">
                                <div className="p-2 rounded-md bg-[#1e293b] group-hover:bg-blue-600/20 transition-colors">
                                    <MapPin size={16} className="text-blue-500" />
                                </div>
                                <span className="pt-1">{companyInfo.company_address}</span>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <div className="p-2 rounded-md bg-[#1e293b] group-hover:bg-blue-600/20 transition-colors">
                                    <Mail size={16} className="text-blue-500" />
                                </div>
                                <a href={`mailto:${companyInfo.company_email}`} className="hover:text-blue-400 transition-colors">
                                    {companyInfo.company_email}
                                </a>
                            </li>
                            <li className="flex items-center space-x-3 group">
                                <div className="p-2 rounded-md bg-[#1e293b] group-hover:bg-blue-600/20 transition-colors">
                                    <Phone size={16} className="text-blue-500" />
                                </div>
                                <a href={`tel:${companyInfo.company_phone}`} className="hover:text-blue-400 transition-colors">
                                    {companyInfo.company_phone}
                                </a>
                            </li>
                            <li className="flex items-start space-x-3 pt-2 border-t border-[#1e293b]">
                                <span className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">{t('footer.tax_code') || 'Tax Code'}:</span>
                                <span className="text-xs font-mono">{companyInfo.company_tax_code}</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                {showCopyright && (
                    <div className="mt-16 pt-8 border-t border-[#1e293b]">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#64748b]">
                                <Link to="/privacy" className="hover:text-[#cbd5e1] transition-colors">Privacy Policy</Link>
                                <Link to="/terms" className="hover:text-[#cbd5e1] transition-colors">Terms of Service</Link>
                                <Link to="/sitemap.xml" className="hover:text-[#cbd5e1] transition-colors">Sitemap</Link>
                            </div>
                            <p className="text-center text-[#64748b] text-[10px] sm:text-xs">
                                Copyright © 2024–{currentYear} {companyInfo.company_name} | Concept by Dieter R.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </footer>
    );
}

export default Footer;
