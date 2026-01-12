import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const LogoContext = createContext({ logoUrl: null, refreshLogo: () => {} });

export const useLogo = () => useContext(LogoContext);

export const LogoProvider = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState(null);

    const fetchLogo = async () => {
        try {
            const response = await axios.get('/api/logo');
            if (response.data.success) {
                setLogoUrl(response.data.logo_url);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    useEffect(() => {
        fetchLogo();
        
        const handleUpdate = (e) => setLogoUrl(e.detail);
        window.addEventListener('logo-updated', handleUpdate);
        return () => window.removeEventListener('logo-updated', handleUpdate);
    }, []);

    return (
        <LogoContext.Provider value={{ logoUrl, refreshLogo: fetchLogo }}>
            {children}
        </LogoContext.Provider>
    );
};
