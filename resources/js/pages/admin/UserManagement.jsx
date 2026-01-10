import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

/**
 * UserManagement component allows managing users.
 * Features include listing users, searching, creating, editing, and deleting users.
 */
const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, userId: null });
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'user'
    });

    // useEffect to fetch users and roles on component mount
    useEffect(function () {
        fetchUsers();
        fetchRoles();
    }, []);

    /**
     * Fetches the list of users from the API.
     * Updates users state or logs an error if fetching fails.
     */
    function fetchUsers() {
        api.get('/admin/users')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setUsers(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch users:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Fetches the list of roles from the API.
     * Updates roles state or logs an error if fetching fails.
     */
    function fetchRoles() {
        api.get('/admin/roles')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setRoles(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch roles:', error);
            });
    }

    /**
     * Handles form submission for creating or updating a user.
     * Sends POST or PUT requests based on whether editingUser is set.
     * Provides user feedback on success or failure.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();

        if (editingUser) {
            // Update existing user
            api.put('/admin/users/' + editingUser.id, formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchUsers();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new user
            api.post('/admin/users', formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchUsers();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        }
    }

    /**
     * Prepares the form for editing an existing user.
     * Populates formData with the user's current values and shows the modal.
     * @param {Object} user - The user object to edit
     */
    function handleEdit(user) {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected user after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/users/' + deleteModal.userId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchUsers();
                    setDeleteModal({ isOpen: false, userId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing user state.
     */
    function resetForm() {
        setFormData({ name: '', email: '', password: '', role: 'user' });
        setEditingUser(null);
    }

    // Filter users based on search term
    var filteredUsers = [];
    if (users && typeof users.filter === 'function') {
        filteredUsers = users.filter(function (user) {
            var nameMatch = user.name && user.name.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
            var emailMatch = user.email && user.email.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1;
            return nameMatch || emailMatch;
        });
    } else {
        console.error('users is not an array or does not support filter method:', users);
    }

    // Check if roles is an array before mapping
    var rolesList = [];
    if (roles && typeof roles.map === 'function') {
        rolesList = roles;
    } else {
        console.error('roles is not an array or does not support map method:', roles);
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Search input and Add User button */}
                <div className="flex justify-between items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={function (e) { setSearchTerm(e.target.value); }}
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="ml-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add User
                    </button>
                </div>

                {/* Users table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredUsers.map(function (user) {
                                return (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' +
                                                (user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800')
                                            }>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={function () { handleEdit(user); }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {user.role !== 'super_admin' && (
                                                <button
                                                    onClick={function () { setDeleteModal({ isOpen: true, userId: user.id }); }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for adding or editing users */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75"
                            onClick={function () {
                                setShowModal(false);
                                resetForm();
                            }}
                        ></div>
                        <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-medium mb-4">{editingUser ? 'Edit User' : 'Add New User'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { email: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Password {editingUser && '(leave blank to keep current)'}</label>
                                    <input
                                        type="password"
                                        required={!editingUser}
                                        value={formData.password}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { password: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { role: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {rolesList.map(function (role) {
                                            return (
                                                <option key={role.id} value={role.name}>{role.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={function () {
                                            setShowModal(false);
                                            resetForm();
                                        }}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                                    >
                                        {editingUser ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a user */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, userId: null }); }}
                onConfirm={handleDelete}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
}

export default UserManagement;
