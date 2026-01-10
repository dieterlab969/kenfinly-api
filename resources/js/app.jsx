import './bootstrap';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import axios from 'axios';
import App from './components/App';

function AppWrapper() {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const response = await axios.get('/api/auth/config');
                if (response.data.success) {
                    setConfig(response.data.config);
                }
            } catch (error) {
                console.error('Failed to fetch config:', error);
                setConfig({ recaptcha_enabled: false });
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div>Loading...</div>
            </div>
        );
    }

    const content = (
        <BrowserRouter>
            <App recaptchaEnabled={config?.recaptcha_enabled || false} />
        </BrowserRouter>
    );

    if (config?.recaptcha_enabled && config?.recaptcha_site_key) {
        return (
            <GoogleReCaptchaProvider reCaptchaKey={config.recaptcha_site_key}>
                {content}
            </GoogleReCaptchaProvider>
        );
    }

    return content;
}

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <AppWrapper />
    </React.StrictMode>
);
