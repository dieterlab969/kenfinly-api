import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

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
            console.error('Failed to fetch user:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post('/api/auth/login', { email, password });
        if (response.data.success) {
            const newToken = response.data.access_token;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setUser(response.data.user);
            return { success: true };
        }
        return { success: false, message: response.data.message };
    };

    const register = async (name, email, password, passwordConfirmation) => {
        const response = await axios.post('/api/auth/register', {
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
        });
        
        if (response.data.success) {
            const newToken = response.data.access_token;
            localStorage.setItem('token', newToken);
            setToken(newToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            setUser(response.data.user);
            return { success: true };
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
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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
