import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

const LicenseManagement = () => {
    const [licenses, setLicenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLicense, setEditingLicense] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, licenseId: null });
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration_days: '',
        max_accounts: '',
        features: ''
    });

    // useEffect hook to fetch licenses when component mounts
    useEffect(function () {
        fetchLicenses();
    }, []);

    /**
     * Fetches the list of licenses from the API.
     * Updates the licenses state or logs an error if fetching fails.
     */
    function fetchLicenses() {
        api.get('/admin/licenses')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setLicenses(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch licenses:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Handles form submission for creating or updating a license.
     * Serializes the features string into JSON array before sending.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();

        // Prepare features as JSON string or null if empty
        var submitData = Object.assign({}, formData);
        if (formData.features) {
            var featuresArray = formData.features.split('\n').filter(function (f) {
                return f.trim() !== '';
            });
            submitData.features = JSON.stringify(featuresArray);
        } else {
            submitData.features = null;
        }

        if (editingLicense) {
            // Update existing license
            api.put('/admin/licenses/' + editingLicense.id, submitData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchLicenses();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new license
            api.post('/admin/licenses', submitData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchLicenses();
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
     * Prepares the form for editing an existing license.
     * Parses the features JSON string into a newline-separated string for the textarea.
     * @param {Object} license - The license object to edit
     */
    function handleEdit(license) {
        var featuresString = '';
        if (license.features) {
            try {
                var featuresArray = JSON.parse(license.features);
                featuresString = featuresArray.join('\n');
            } catch (err) {
                console.error('Failed to parse features JSON:', err);
            }
        }
        setEditingLicense(license);
        setFormData({
            name: license.name,
            price: license.price,
            duration_days: license.duration_days,
            max_accounts: license.max_accounts,
            features: featuresString
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected license after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/licenses/' + deleteModal.licenseId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchLicenses();
                    setDeleteModal({ isOpen: false, licenseId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing license state.
     */
    function resetForm() {
        setFormData({
            name: '',
            price: '',
            duration_days: '',
            max_accounts: '',
            features: ''
        });
        setEditingLicense(null);
    }

    // Check if licenses is an array before mapping
    var licensesList = [];
    if (licenses && typeof licenses.map === 'function') {
        licensesList = licenses;
    } else {
        console.error('licenses is not an array or does not support map method:', licenses);
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Add License button */}
                <div className="flex justify-end">
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add License
                    </button>
                </div>

                {/* Licenses table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max Accounts</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {licensesList.map(function (license) {
                                return (
                                    <tr key={license.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{license.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${license.price}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.duration_days} days</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{license.max_accounts || 'Unlimited'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={function () { handleEdit(license); }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={function () { setDeleteModal({ isOpen: true, licenseId: license.id }); }}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal for adding or editing licenses */}
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
                            <h3 className="text-lg font-medium mb-4">{editingLicense ? 'Edit License' : 'Add New License'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Premium Monthly"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Price (USD)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.price}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { price: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Duration (days)</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.duration_days}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { duration_days: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Max Accounts (leave blank for unlimited)</label>
                                    <input
                                        type="number"
                                        value={formData.max_accounts}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { max_accounts: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Features (one per line)</label>
                                    <textarea
                                        value={formData.features}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { features: e.target.value })); }}
                                        rows={4}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Unlimited accounts&#10;Priority support&#10;Advanced analytics"
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
                                        {editingLicense ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a license */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, licenseId: null }); }}
                onConfirm={handleDelete}
                title="Delete License"
                message="Are you sure you want to delete this license? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
}

export default LicenseManagement;
