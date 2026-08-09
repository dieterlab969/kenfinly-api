import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
    },
});

// ── Token helpers ─────────────────────────────────────────────────────────────

function getStoredToken() {
    return localStorage.getItem('token') || localStorage.getItem('auth_token') || null;
}

function saveToken(token) {
    localStorage.setItem('token', token);
    // Keep legacy key in sync so older code paths still work
    localStorage.removeItem('auth_token');
}

function clearTokens() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
}

// ── Request interceptor — attach token ────────────────────────────────────────

api.interceptors.request.use((config) => {
    const token = getStoredToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});

// ── Response interceptor — silent token refresh on 401 ───────────────────────
//
// Flow:
//   1. Any API call gets a 401 (token expired).
//   2. We immediately try POST /auth/refresh (the old token is still sent by
//      the request interceptor above; tymon/jwt-auth accepts it within the
//      JWT_REFRESH_TTL window).
//   3. On success  → store new token, replay the original request once.
//   4. On failure  → token is truly dead; clear storage and go to /SignIn.
//
// Multiple concurrent 401s are queued so we only call /refresh once.

let isRefreshing = false;
let failedQueue  = [];

function processQueue(error, token = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else       resolve(token);
    });
    failedQueue = [];
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the refresh call itself fails, bail out immediately (avoid loop)
        if (error.response?.status === 401 && originalRequest.url?.includes('/auth/refresh')) {
            processQueue(error, null);
            clearTokens();
            window.location.href = '/SignIn';
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            // Queue concurrent requests that also 401'd while we refresh
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const { data } = await api.post('/auth/refresh');
                const newToken = data.access_token;

                saveToken(newToken);
                api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                // Also update the global axios instance used by AuthContext
                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

                processQueue(null, newToken);

                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                window.location.href = '/SignIn';
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
