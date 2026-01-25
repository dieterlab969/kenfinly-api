import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LogoContext = createContext({ logoUrl: null, refreshLogo: () => {} });

export const useLogo = () => useContext(LogoContext);

export const LogoProvider = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState(null);

    const fetchLogo = async () => {
        try {
            // Try to get cached logo data
            const cachedLogo = localStorage.getItem('site_logo_cache');
            if (cachedLogo) {
                const { url, timestamp } = JSON.parse(cachedLogo);
                // Use cached logo immediately for fast rendering
                setLogoUrl(url);
                
                // Only re-fetch from server if cache is older than 1 hour
                const oneHour = 60 * 60 * 1000;
                if (Date.now() - timestamp < oneHour) {
                    return;
                }
            }

            const response = await axios.get('/api/logo');
            if (response.data.success) {
                const newLogoUrl = response.data.logo_url;
                setLogoUrl(newLogoUrl);
                
                // Cache the new logo URL with timestamp
                localStorage.setItem('site_logo_cache', JSON.stringify({
                    url: newLogoUrl,
                    timestamp: Date.now()
                }));
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    useEffect(() => {
        fetchLogo();
        
        const handleUpdate = (e) => {
            const newUrl = e.detail;
            setLogoUrl(newUrl);
            // Update cache when logo is updated
            localStorage.setItem('site_logo_cache', JSON.stringify({
                url: newUrl,
                timestamp: Date.now()
            }));
        };
        window.addEventListener('logo-updated', handleUpdate);
        return () => window.removeEventListener('logo-updated', handleUpdate);
    }, []);

    return (
        <LogoContext.Provider value={{ logoUrl, refreshLogo: fetchLogo }}>
            {children}
        </LogoContext.Provider>
    );
};
