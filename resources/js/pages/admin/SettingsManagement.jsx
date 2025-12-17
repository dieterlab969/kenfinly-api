import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Save, Tag } from 'lucide-react';

const SettingsManagement = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSetting, setEditingSetting] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, settingId: null });
    const [gtmId, setGtmId] = useState('');
    const [gtmLoading, setGtmLoading] = useState(false);
    const [gtmMessage, setGtmMessage] = useState('');
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        description: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await api.get('/admin/settings');
            if (response.data.success) {
                setSettings(response.data.data);
                const gtmSetting = response.data.data.find(s => s.key === 'google_tag_manager_id');
                if (gtmSetting) {
                    setGtmId(gtmSetting.value);
                }
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGtmUpdate = async (e) => {
        e.preventDefault();
        setGtmLoading(true);
        setGtmMessage('');
        try {
            const gtmSetting = settings.find(s => s.key === 'google_tag_manager_id');
            if (gtmSetting) {
                const response = await api.put(`/admin/settings/${gtmSetting.id}`, {
                    value: gtmId,
                    type: 'string'
                });
                if (response.data.success) {
                    setGtmMessage({ type: 'success', text: 'Google Tag Manager ID updated successfully!' });
                    fetchSettings();
                    setTimeout(() => setGtmMessage(''), 3000);
                }
            }
        } catch (error) {
            setGtmMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update GTM ID' });
        } finally {
            setGtmLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSetting) {
                const response = await api.put(`/admin/settings/${editingSetting.id}`, formData);
                if (response.data.success) {
                    fetchSettings();
                    setShowModal(false);
                    resetForm();
                }
            } else {
                const response = await api.post('/admin/settings', formData);
                if (response.data.success) {
                    fetchSettings();
                    setShowModal(false);
                    resetForm();
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (setting) => {
        setEditingSetting(setting);
        setFormData({
            key: setting.key,
            value: setting.value,
            description: setting.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        try {
            const response = await api.delete(`/admin/settings/${deleteModal.settingId}`);
            if (response.data.success) {
                fetchSettings();
                setDeleteModal({ isOpen: false, settingId: null });
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        }
    };

    const resetForm = () => {
        setFormData({ key: '', value: '', description: '' });
        setEditingSetting(null);
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Configuration cache is automatically cleared when you update settings.
                    </p>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center mb-4">
                        <Tag className="h-6 w-6 text-indigo-600 mr-2" />
                        <h2 className="text-lg font-semibold text-gray-900">Google Tag Manager Settings</h2>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Configure your Google Tag Manager container ID for website analytics tracking.</p>
                    
                    <form onSubmit={handleGtmUpdate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Container ID
                            </label>
                            <input
                                type="text"
                                value={gtmId}
                                onChange={(e) => setGtmId(e.target.value)}
                                placeholder="e.g., G-HR6DW8D0GB"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                            />
                            <p className="text-xs text-gray-500 mt-1">Your Google Analytics 4 measurement ID</p>
                        </div>
                        
                        {gtmMessage && (
                            <div className={`p-3 rounded-md text-sm ${
                                gtmMessage.type === 'success' 
                                    ? 'bg-green-50 text-green-800 border border-green-200' 
                                    : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                                {gtmMessage.text}
                            </div>
                        )}
                        
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={gtmLoading}
                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="h-4 w-4 mr-2" />
                                {gtmLoading ? 'Saving...' : 'Save GTM ID'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Setting
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {settings.map((setting) => (
                                <tr key={setting.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{setting.key}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        <code className="bg-gray-100 px-2 py-1 rounded">{setting.value}</code>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{setting.description || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(setting)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, settingId: setting.id })}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => { setShowModal(false); resetForm(); }}></div>
                        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">{editingSetting ? 'Edit Setting' : 'Add New Setting'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Key</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.key}
                                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., app.maintenance_mode"
                                        disabled={editingSetting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Value</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Optional description of this setting"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        <Save className="h-4 w-4 mr-2" />
                                        {editingSetting ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, settingId: null })}
                onConfirm={handleDelete}
                title="Delete Setting"
                message="Are you sure you want to delete this setting? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
};

export default SettingsManagement;
