import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Kenfinly</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-700">
                                Welcome, {user?.name}
                            </span>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Dashboard
                        </h2>
                        <p className="text-gray-600 mb-4">
                            Welcome to your Kenfinly dashboard! You've successfully logged in.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <h3 className="text-sm font-medium text-blue-900 mb-2">User Information</h3>
                            <dl className="space-y-1">
                                <div>
                                    <dt className="text-sm font-medium text-blue-700">Name:</dt>
                                    <dd className="text-sm text-blue-900">{user?.name}</dd>
                                </div>
                                <div>
                                    <dt className="text-sm font-medium text-blue-700">Email:</dt>
                                    <dd className="text-sm text-blue-900">{user?.email}</dd>
                                </div>
                                {user?.roles && user.roles.length > 0 && (
                                    <div>
                                        <dt className="text-sm font-medium text-blue-700">Role:</dt>
                                        <dd className="text-sm text-blue-900">{user.roles[0].name}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
