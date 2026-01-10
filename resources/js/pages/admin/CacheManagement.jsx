import React, { useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { Trash2, CheckCircle, Database, FileCode, MapPin, Eye } from 'lucide-react';

const CacheManagement = () => {
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleClearCache = async (type) => {
        setLoading(true);
        setSuccessMessage('');
        try {
            const endpoint = type === 'all' ? '/admin/cache/clear' : `/admin/cache/clear-${type}`;
            const response = await api.post(endpoint);
            if (response.data.success) {
                setSuccessMessage(response.data.message);
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Cache clear failed');
        } finally {
            setLoading(false);
        }
    };

    const cacheTypes = [
        {
            type: 'all',
            name: 'Clear All Caches',
            description: 'Clear all application caches at once',
            icon: Database,
            color: 'bg-red-500',
            hoverColor: 'hover:bg-red-600'
        },
        {
            type: 'app',
            name: 'Application Cache',
            description: 'Clear application-specific cache',
            icon: FileCode,
            color: 'bg-blue-500',
            hoverColor: 'hover:bg-blue-600'
        },
        {
            type: 'config',
            name: 'Configuration Cache',
            description: 'Clear configuration cache',
            icon: Eye,
            color: 'bg-green-500',
            hoverColor: 'hover:bg-green-600'
        },
        {
            type: 'route',
            name: 'Route Cache',
            description: 'Clear route cache',
            icon: MapPin,
            color: 'bg-yellow-500',
            hoverColor: 'hover:bg-yellow-600'
        },
        {
            type: 'view',
            name: 'View Cache',
            description: 'Clear compiled view cache',
            icon: Eye,
            color: 'bg-purple-500',
            hoverColor: 'hover:bg-purple-600'
        }
    ];

    return (
        <AdminLayout>
            <div className="space-y-6">
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Warning:</strong> Clearing caches may temporarily affect application performance while caches are rebuilt.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {cacheTypes.map((cache) => {
                        const Icon = cache.icon;
                        return (
                            <div key={cache.type} className="bg-white overflow-hidden shadow rounded-lg">
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className={`flex-shrink-0 rounded-md p-3 ${cache.color}`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                            <h3 className="text-lg font-medium text-gray-900">{cache.name}</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-4">{cache.description}</p>
                                    <button
                                        onClick={() => handleClearCache(cache.type)}
                                        disabled={loading}
                                        className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${cache.color} ${cache.hoverColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50`}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Clear Cache
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Cache Management Information</h3>
                    <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex">
                            <span className="font-medium w-40">Application Cache:</span>
                            <span>Stores frequently accessed data to improve performance</span>
                        </div>
                        <div className="flex">
                            <span className="font-medium w-40">Configuration Cache:</span>
                            <span>Stores application configuration for faster loading</span>
                        </div>
                        <div className="flex">
                            <span className="font-medium w-40">Route Cache:</span>
                            <span>Stores compiled routes for faster request handling</span>
                        </div>
                        <div className="flex">
                            <span className="font-medium w-40">View Cache:</span>
                            <span>Stores compiled template files for faster rendering</span>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default CacheManagement;
