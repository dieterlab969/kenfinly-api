import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

const AccountManagement = () => {
    const [accounts, setAccounts] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, accountId: null });
    const [formData, setFormData] = useState({
        name: '',
        user_id: '',
        currency: 'USD',
        initial_balance: '0'
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        fetchAccounts();
        fetchUsers();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/admin/accounts');
            if (response.data.success) {
                setAccounts(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
            setErrorMessage('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await api.get('/admin/users');
            if (response.data.success) {
                setUsers(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        try {
            if (editingAccount) {
                const response = await api.put(`/admin/accounts/${editingAccount.id}`, formData);
                if (response.data.success) {
                    setSuccessMessage('Account updated successfully');
                    fetchAccounts();
                    setShowModal(false);
                    resetForm();
                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            } else {
                const response = await api.post('/admin/accounts', formData);
                if (response.data.success) {
                    setSuccessMessage('Account created successfully');
                    fetchAccounts();
                    setShowModal(false);
                    resetForm();
                    setTimeout(() => setSuccessMessage(''), 3000);
                }
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Operation failed');
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const handleEdit = (account) => {
        setEditingAccount(account);
        setFormData({
            name: account.name,
            user_id: account.user_id,
            currency: account.currency || 'USD',
            initial_balance: account.balance || '0'
        });
        setShowModal(true);
    };

    const handleDelete = async () => {
        setErrorMessage('');
        setSuccessMessage('');
        try {
            const response = await api.delete(`/admin/accounts/${deleteModal.accountId}`);
            if (response.data.success) {
                setSuccessMessage('Account deleted successfully');
                fetchAccounts();
                setDeleteModal({ isOpen: false, accountId: null });
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            setErrorMessage(error.response?.data?.message || 'Delete failed');
            setDeleteModal({ isOpen: false, accountId: null });
            setTimeout(() => setErrorMessage(''), 5000);
        }
    };

    const resetForm = () => {
        setFormData({ name: '', user_id: '', currency: 'USD', initial_balance: '0' });
        setEditingAccount(null);
    };

    const filteredAccounts = accounts.filter(account =>
        account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (account.user?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="space-y-6">
                {successMessage && (
                    <div className="bg-green-50 border border-green-200 rounded-md p-4">
                        <p className="text-sm text-green-800">{successMessage}</p>
                    </div>
                )}

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-sm text-red-800">{errorMessage}</p>
                    </div>
                )}

                <div className="flex justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search accounts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Account
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Currency</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAccounts.map((account) => (
                                <tr key={account.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{account.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.user?.name || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={account.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {account.balance}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{account.currency || 'USD'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(account.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(account)}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal({ isOpen: true, accountId: account.id })}
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
                            <h3 className="text-lg font-medium mb-4">{editingAccount ? 'Edit Account' : 'Add New Account'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Account Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Main Checking"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Owner</label>
                                    <select
                                        required
                                        value={formData.user_id}
                                        onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select user...</option>
                                        {users.map((user) => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="GBP">GBP</option>
                                        <option value="VND">VND</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.initial_balance}
                                        onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {editingAccount ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, accountId: null })}
                onConfirm={handleDelete}
                title="Delete Account"
                message="Are you sure you want to delete this account? All associated transactions will also be deleted. This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
};

export default AccountManagement;
