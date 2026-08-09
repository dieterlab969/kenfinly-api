import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// ── Cookie helpers ────────────────────────────────────────────────────────────

/**
 * Read the `app_currency` cookie that LocalizationMiddleware sets on every
 * web page response. The cookie is intentionally NOT httpOnly so JS can read it.
 *
 * Returns "VND" | "USD", defaulting to "VND" when the cookie isn't present
 * yet (e.g. first-ever visit before a full page load has completed).
 */
function readCurrencyCookie() {
    try {
        const match = document.cookie
            .split('; ')
            .find(row => row.startsWith('app_currency='));
        const value = match ? match.split('=')[1] : null;
        return value === 'USD' ? 'USD' : 'VND';  // whitelist; default VND
    } catch {
        return 'VND';
    }
}

/**
 * Read the `app_country` cookie set by LocalizationMiddleware (if present).
 * Returns a 2-char ISO code or null.
 */
function readCountryCookie() {
    try {
        const match = document.cookie
            .split('; ')
            .find(row => row.startsWith('app_country='));
        const value = match ? match.split('=')[1].toUpperCase() : null;
        return (value && value.length === 2) ? value : null;
    } catch {
        return null;
    }
}

// ── AuthProvider ──────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
    const [user,     setUser]     = useState(null);
    const [loading,  setLoading]  = useState(true);
    const [token,    setToken]    = useState(localStorage.getItem('token'));

    /**
     * `currency` is initialised synchronously from the cookie so that every
     * component that calls `useAuth().currency` gets the right value on the
     * very first render — no flash, no loading state needed.
     *
     * Sources (priority order, same as server):
     *  1. Authenticated user's saved `user.currency` column (set after fetchUser)
     *  2. `app_currency` cookie (set by LocalizationMiddleware on any web page visit)
     *  3. Hardcoded fallback "VND"
     */
    const [currency, setCurrency] = useState(() => readCurrencyCookie());
    const [country,  setCountry]  = useState(() => readCountryCookie());

    // Keep currency in sync whenever the user object changes
    // (e.g. after login, the user's saved preference takes priority)
    useEffect(() => {
        if (user?.currency) {
            setCurrency(user.currency === 'USD' ? 'USD' : 'VND');
        } else {
            // Refresh from cookie (e.g. after logout, fall back to IP-detected value)
            setCurrency(readCurrencyCookie());
            setCountry(readCountryCookie());
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, [token]);

    const fetchUser = async () => {
        try {
            const response = await axios.get('/api/auth/me');
            if (response.data.success) {
                setUser(response.data.user);
            }
        } catch (error) {
            // On 401 try a silent token refresh before giving up.
            // tymon/jwt-auth accepts expired tokens within the JWT_REFRESH_TTL window.
            if (error.response?.status === 401) {
                try {
                    const refreshResponse = await axios.post('/api/auth/refresh');
                    if (refreshResponse.data?.access_token) {
                        const newToken = refreshResponse.data.access_token;
                        localStorage.setItem('token', newToken);
                        setToken(newToken);
                        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                        // Retry fetching the user profile with the fresh token
                        const retryResponse = await axios.get('/api/auth/me');
                        if (retryResponse.data.success) {
                            setUser(retryResponse.data.user);
                            return; // success — skip the logout below
                        }
                    }
                } catch {
                    // Refresh window expired or network error — fall through to logout
                }
            } else {
                console.error('Failed to fetch user:', error);
            }
            logout();
        } finally {
            setLoading(false);
        }
    };

    /**
     * Build the localization payload that is attached to every login/register
     * request so the server can sync geo-detected values into the user row.
     *
     * Values come from the `app_currency` / `app_country` cookies that
     * LocalizationMiddleware set on the last full web-page load.
     */
    const localizationPayload = useCallback(() => ({
        app_currency: readCurrencyCookie(),
        app_country:  readCountryCookie() ?? '',
    }), []);

    const login = async (email, password, recaptchaToken = null) => {
        try {
            const response = await axios.post('/api/auth/login', {
                email,
                password,
                'g-recaptcha-response': recaptchaToken,
                // Geo-locale sync: server saves these into users.currency /
                // users.country_code on first login (when country_code is null)
                ...localizationPayload(),
            });

            if (response.data.success) {
                const newToken = response.data.access_token;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                setUser(response.data.user);
                return { success: true };
            }
            return { success: false, message: response.data.message };
        } catch (error) {
            if (error.response?.data?.action === 'verify_email') {
                return {
                    success: false,
                    action: 'verify_email',
                    message: error.response.data.message,
                    user: error.response.data.user,
                    verification_sent: error.response.data.verification_sent,
                    verification_expires_at: error.response.data.verification_expires_at,
                };
            }
            if (error.response?.data?.message) {
                return { success: false, message: error.response.data.message };
            }
            throw error;
        }
    };

    const register = async (name, email, password, passwordConfirmation, recaptchaToken = null) => {
        const response = await axios.post('/api/auth/register', {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            'g-recaptcha-response': recaptchaToken,
            // Geo-locale sync: written into the new user row at creation time
            ...localizationPayload(),
        });

        if (response.data.success) {
            // If the backend returned a token (MVP: email verification bypassed),
            // store it and hydrate the user so the app is immediately authenticated.
            if (response.data.access_token) {
                const newToken = response.data.access_token;
                localStorage.setItem('token', newToken);
                setToken(newToken);
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                setUser(response.data.user);
            }

            return {
                success: true,
                user: response.data.user,
                token: response.data.access_token ?? null,
                verification_sent: response.data.verification_sent,
                message: response.data.message,
            };
        }
        return { success: false, errors: response.data.errors };
    };

    const logout = async () => {
        try {
            if (token) {
                await axios.post('/api/auth/logout');
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
            // After logout, fall back to the IP-detected cookie value
            setCurrency(readCurrencyCookie());
            setCountry(readCountryCookie());
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            login,
            register,
            logout,
            loading,
            /** "VND" | "USD" — resolved from DB preference, cookie, or default */
            currency,
            /** ISO 3166-1 alpha-2 country code or null */
            country,
            /** true when currency is USD (convenience flag for components) */
            isUsd: currency === 'USD',
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
