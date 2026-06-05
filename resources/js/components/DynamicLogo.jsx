import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLogo } from '../contexts/LogoContext';

const DynamicLogo = ({ className = "w-10 h-10", iconClassName = "w-6 h-6", showText = false, textClassName = "text-xl font-bold", brandingText = "KENFINLY" }) => {
    const { logoUrl } = useLogo();
    const [logoFailed, setLogoFailed] = useState(false);

    const fallbackLogo = useMemo(() => {
        if (typeof window === 'undefined') {
            return '/logos/logo-black.png';
        }

        const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
        const hasDarkClass = document.documentElement.classList.contains('dark');

        return prefersDark || hasDarkClass ? '/logos/logo-white.png' : '/logos/logo-black.png';
    }, []);

    const logoSrc = logoFailed ? fallbackLogo : (logoUrl || fallbackLogo);
    const imageClassName = className.includes('w-') || className.includes('h-')
        ? className
        : `h-12 w-auto ${className}`;

    return (
        <Link to="/" className="flex items-center space-x-2 logo-container">
            <>
                <img
                    src={logoSrc}
                    alt="Kenfinly Logo"
                    className={`${imageClassName} object-contain`}
                    onError={() => setLogoFailed(true)}
                />
                {showText && <span className={textClassName}>{brandingText}</span>}
            </>
        </Link>
    );
};

export default DynamicLogo;
