import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { Users, UserCircle, Receipt, FolderTree, Languages, Key } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const response = await api.get('/admin/dashboard');
            if (response.data.success) {
                setStats(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    const statCards = [
        { name: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'bg-blue-500' },
        { name: 'Total Accounts', value: stats?.total_accounts || 0, icon: UserCircle, color: 'bg-green-500' },
        { name: 'Total Transactions', value: stats?.total_transactions || 0, icon: Receipt, color: 'bg-purple-500' },
        { name: 'Categories', value: stats?.total_categories || 0, icon: FolderTree, color: 'bg-yellow-500' },
        { name: 'Languages', value: stats?.total_languages || 0, icon: Languages, color: 'bg-pink-500' },
        { name: 'Active Licenses', value: stats?.active_licenses || 0, icon: Key, color: 'bg-indigo-500' },
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium leading-6 text-gray-900">System Overview</h3>
                    <p className="mt-1 text-sm text-gray-500">System-wide statistics and metrics</p>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {statCards.map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${item.color}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="text-sm font-medium text-gray-500 truncate">
                                                    {item.name}
                                                </dt>
                                                <dd className="text-3xl font-semibold text-gray-900">
                                                    {item.value}
                                                </dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {stats?.recent_activity && stats.recent_activity.length > 0 && (
                    <div className="bg-white shadow rounded-lg">
                        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                            {stats.recent_activity.map((activity, index) => (
                                <li key={index} className="px-4 py-4">
                                    <p className="text-sm text-gray-900">{activity.description}</p>
                                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
