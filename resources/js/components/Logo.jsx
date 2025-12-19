import React, { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import axios from 'axios';

const Logo = ({ className = '', fallbackSize = 'default' }) => {
    const [logos, setLogos] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchLogos = async () => {
            try {
                const response = await axios.get('/api/settings/logos');
                if (response.data.success) {
                    setLogos(response.data.data);
                }
            } catch (err) {
                console.error('Failed to fetch logos:', err);
                setError(true);
            }
        };
        fetchLogos();
    }, []);

    const sizeClasses = {
        small: 'w-8 h-8',
        default: 'w-10 h-10',
        large: 'w-16 h-16'
    };

    const iconSizes = {
        small: 'w-5 h-5',
        default: 'w-6 h-6',
        large: 'w-10 h-10'
    };

    const getLogoPath = (path) => {
        if (!path) return null;
        return path.startsWith('/') ? path : `/${path}`;
    };

    if (error || !logos?.logo_1x) {
        return (
            <div className={`${sizeClasses[fallbackSize]} bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center ${className}`}>
                <TrendingUp className={`${iconSizes[fallbackSize]} text-white`} />
            </div>
        );
    }

    const buildSrcSet = () => {
        const parts = [];
        const logo1x = getLogoPath(logos.logo_1x);
        const logo2x = getLogoPath(logos.logo_2x);
        const logo4x = getLogoPath(logos.logo_4x);
        if (logo1x) parts.push(`${logo1x} 1x`);
        if (logo2x) parts.push(`${logo2x} 2x`);
        if (logo4x) parts.push(`${logo4x} 4x`);
        return parts.join(', ');
    };

    return (
        <img 
            src={getLogoPath(logos.logo_1x)}
            srcSet={buildSrcSet()}
            alt="Kenfinly Logo"
            className={`${sizeClasses[fallbackSize]} object-contain ${className}`}
        />
    );
};

export default Logo;
