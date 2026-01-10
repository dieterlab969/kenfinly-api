import React from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import FaviconManager from '../../components/admin/FaviconManager';

const FaviconManagement = () => {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Favicon Management</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Upload and manage your website favicon. The favicon appears in browser tabs, bookmarks, and the address bar.
                    </p>
                </div>
                <FaviconManager />
            </div>
        </AdminLayout>
    );
};

export default FaviconManagement;
