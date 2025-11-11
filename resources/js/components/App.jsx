import React, { createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TranslationProvider } from '../contexts/TranslationContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import ProtectedRoute from './ProtectedRoute';

const RecaptchaConfigContext = createContext({ enabled: false });

export const useRecaptchaConfig = () => useContext(RecaptchaConfigContext);

function App({ recaptchaEnabled = false }) {
    return (
        <RecaptchaConfigContext.Provider value={{ enabled: recaptchaEnabled }}>
            <TranslationProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            } 
                        />
                        <Route path="/" element={<Navigate to="/login" replace />} />
                    </Routes>
                </AuthProvider>
            </TranslationProvider>
        </RecaptchaConfigContext.Provider>
    );
}

export default App;
