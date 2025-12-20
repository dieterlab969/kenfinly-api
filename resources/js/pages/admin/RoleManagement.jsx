import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingRole, setEditingRole] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, roleId: null });
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: ''
    });

    // useEffect hook to fetch roles on component mount
    useEffect(function () {
        fetchRoles();
    }, []);

    /**
     * Fetches the list of roles from the API.
     * Updates the roles state or logs an error if fetching fails.
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
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Handles form submission for creating or updating a role.
     * Sends POST or PUT requests based on whether editingRole is set.
     * Provides user feedback on success or failure.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();

        if (editingRole) {
            // Update existing role
            api.put('/admin/roles/' + editingRole.id, formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchRoles();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new role
            api.post('/admin/roles', formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchRoles();
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
     * Prepares the form for editing an existing role.
     * Populates formData with the role's current values and shows the modal.
     * @param {Object} role - The role object to edit
     */
    function handleEdit(role) {
        setEditingRole(role);
        setFormData({
            name: role.name,
            display_name: role.display_name || '',
            description: role.description || ''
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected role after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/roles/' + deleteModal.roleId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchRoles();
                    setDeleteModal({ isOpen: false, roleId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing role state.
     */
    function resetForm() {
        setFormData({ name: '', display_name: '', description: '' });
        setEditingRole(null);
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
                {/* Add Role button */}
                <div className="flex justify-end">
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Role
                    </button>
                </div>

                {/* Roles table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {rolesList.map(function (role) {
                                return (
                                    <tr key={role.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{role.display_name || '-'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{role.description || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={function () { handleEdit(role); }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            {role.name !== 'super_admin' && (
                                                <button
                                                    onClick={function () { setDeleteModal({ isOpen: true, roleId: role.id }); }}
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

            {/* Modal for adding or editing roles */}
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
                            <h3 className="text-lg font-medium mb-4">{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name (slug)</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., editor"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Display Name</label>
                                    <input
                                        type="text"
                                        value={formData.display_name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { display_name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Editor"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { description: e.target.value })); }}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
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
                                        {editingRole ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a role */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, roleId: null }); }}
                onConfirm={handleDelete}
                title="Delete Role"
                message="Are you sure you want to delete this role? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
}

export default RoleManagement;
