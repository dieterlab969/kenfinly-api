import React, { createContext, useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { TranslationProvider } from '../contexts/TranslationContext';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import VerifyEmail from '../pages/VerifyEmail';
import VerificationPending from '../pages/VerificationPending';
import ProtectedRoute from './ProtectedRoute';
import SuperAdminRoute from './SuperAdminRoute';
import AdminLogin from '../pages/admin/AdminLogin';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AccountManagement from '../pages/admin/AccountManagement';
import UserManagement from '../pages/admin/UserManagement';
import RoleManagement from '../pages/admin/RoleManagement';
import CategoryManagement from '../pages/admin/CategoryManagement';
import LanguageManagement from '../pages/admin/LanguageManagement';
import LicenseManagement from '../pages/admin/LicenseManagement';
import SettingsManagement from '../pages/admin/SettingsManagement';
import CacheManagement from '../pages/admin/CacheManagement';
import TranslationManagement from '../pages/admin/TranslationManagement';
import TransactionManagement from '../pages/admin/TransactionManagement';
import LogoManagement from '../pages/admin/LogoManagement';
import FaviconManagement from '../pages/admin/FaviconManagement';
import LandingPage from '../pages/public/LandingPage';
import BlogPage from '../pages/public/BlogPage';
import BlogPostPage from '../pages/public/BlogPostPage';
import AboutPage from '../pages/public/AboutPage';
import PlanSelection from './subscription/PlanSelection';
import CheckoutForm from './subscription/CheckoutForm';

const RecaptchaConfigContext = createContext({ enabled: false });

export const useRecaptchaConfig = () => useContext(RecaptchaConfigContext);

function PricingPage() {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [success, setSuccess] = useState(false);

    if (success) {
        return (
            <div className="py-20 text-center bg-gray-50 min-h-screen">
                <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md">
                    <h1 className="text-3xl font-bold text-green-600">Subscription Successful!</h1>
                    <p className="mt-4 text-gray-600">Thank you for upgrading. Your premium features are now active.</p>
                    <button onClick={() => window.location.href = '/dashboard'} className="mt-8 w-full bg-blue-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-700">Go to Dashboard</button>
                </div>
            </div>
        );
    }

    return selectedPlan ? (
        <div className="bg-gray-50 min-h-screen py-12">
            <CheckoutForm plan={selectedPlan} onPaymentSuccess={() => setSuccess(true)} />
            <button onClick={() => setSelectedPlan(null)} className="mt-4 block mx-auto text-blue-600 hover:underline">Back to plans</button>
        </div>
    ) : (
        <PlanSelection onSelectPlan={setSelectedPlan} />
    );
}

function App({ recaptchaEnabled = false }) {
    return (
        <RecaptchaConfigContext.Provider value={{ enabled: recaptchaEnabled }}>
            <TranslationProvider>
                <AuthProvider>
                    <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/:slug" element={<BlogPostPage />} />
                        <Route path="/about" element={<AboutPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route path="/verification-pending" element={<VerificationPending />} />
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            } 
                        />
                        
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route 
                            path="/admin/dashboard" 
                            element={
                                <SuperAdminRoute>
                                    <AdminDashboard />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/accounts" 
                            element={
                                <SuperAdminRoute>
                                    <AccountManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/users" 
                            element={
                                <SuperAdminRoute>
                                    <UserManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/roles" 
                            element={
                                <SuperAdminRoute>
                                    <RoleManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/categories" 
                            element={
                                <SuperAdminRoute>
                                    <CategoryManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/languages" 
                            element={
                                <SuperAdminRoute>
                                    <LanguageManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/licenses" 
                            element={
                                <SuperAdminRoute>
                                    <LicenseManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/settings" 
                            element={
                                <SuperAdminRoute>
                                    <SettingsManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/cache" 
                            element={
                                <SuperAdminRoute>
                                    <CacheManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/translations" 
                            element={
                                <SuperAdminRoute>
                                    <TranslationManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/transactions" 
                            element={
                                <SuperAdminRoute>
                                    <TransactionManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/logos" 
                            element={
                                <SuperAdminRoute>
                                    <LogoManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        <Route 
                            path="/admin/favicon" 
                            element={
                                <SuperAdminRoute>
                                    <FaviconManagement />
                                </SuperAdminRoute>
                            } 
                        />
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </AuthProvider>
            </TranslationProvider>
        </RecaptchaConfigContext.Provider>
    );
}

export default App;
