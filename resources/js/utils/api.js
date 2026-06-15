import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Accept': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    if (token) {
        if (!localStorage.getItem('token')) {
            localStorage.setItem('token', token);
        }
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    } else {
        config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
