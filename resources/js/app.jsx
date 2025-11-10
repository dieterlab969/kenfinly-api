import './bootstrap';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import App from './components/App';

const recaptchaSiteKey = import.meta.env.VITE_GOOGLE_RECAPTCHA_SITE_KEY;

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <GoogleReCaptchaProvider reCaptchaKey={recaptchaSiteKey}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </GoogleReCaptchaProvider>
    </React.StrictMode>
);
