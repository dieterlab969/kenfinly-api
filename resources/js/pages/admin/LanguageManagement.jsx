import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Check, X } from 'lucide-react';

const LanguageManagement = () => {
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingLanguage, setEditingLanguage] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, languageId: null });
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        native_name: '',
        is_active: true
    });

    // useEffect to fetch languages on component mount
    useEffect(() => {
        fetchLanguages();
    }, []);

    /**
     * Fetches the list of languages from the API.
     * Sets the languages state or logs an error if fetching fails.
     */
    function fetchLanguages() {
        api.get('/admin/languages')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setLanguages(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch languages:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Handles form submission for creating or updating a language.
     * Sends POST or PUT requests based on whether editingLanguage is set.
     * Provides user feedback on success or failure.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();

        if (editingLanguage) {
            // Update existing language
            api.put('/admin/languages/' + editingLanguage.id, formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchLanguages();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new language
            api.post('/admin/languages', formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchLanguages();
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
     * Prepares the form for editing an existing language.
     * Populates formData with the language's current values and shows the modal.
     * @param {Object} language - The language object to edit
     */
    function handleEdit(language) {
        setEditingLanguage(language);
        setFormData({
            code: language.code,
            name: language.name,
            native_name: language.native_name,
            is_active: language.is_active
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected language after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/languages/' + deleteModal.languageId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchLanguages();
                    setDeleteModal({ isOpen: false, languageId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing language state.
     */
    function resetForm() {
        setFormData({ code: '', name: '', native_name: '', is_active: true });
        setEditingLanguage(null);
    }

    // Check if languages is an array before mapping
    var languagesList = [];
    if (languages && typeof languages.map === 'function') {
        languagesList = languages;
    } else {
        console.error('languages is not an array or does not support map method:', languages);
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> English (en) and Vietnamese (vi) are default languages and cannot be deleted.
                    </p>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Language
                    </button>
                </div>

                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Native Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Active</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {languagesList.map(function (language) {
                            return (
                                <tr key={language.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{language.code}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{language.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{language.native_name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {language.is_active ? (
                                            <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                            <X className="h-5 w-5 text-red-500" />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={function () { handleEdit(language); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        {!['en', 'vi'].includes(language.code) && (
                                            <button
                                                onClick={function () { setDeleteModal({ isOpen: true, languageId: language.id }); }}
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

            {/* Modal for adding or editing languages */}
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
                            <h3 className="text-lg font-medium mb-4">{editingLanguage ? 'Edit Language' : 'Add New Language'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Language Code</label>
                                    <input
                                        type="text"
                                        required
                                        maxLength={2}
                                        value={formData.code}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { code: e.target.value.toLowerCase() })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., es, fr, de"
                                        disabled={!!editingLanguage}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">ISO 639-1 code (2 letters)</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Spanish"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Native Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.native_name}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { native_name: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., Español"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { is_active: e.target.checked })); }}
                                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                                        Active
                                    </label>
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
                                        {editingLanguage ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a language */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, languageId: null }); }}
                onConfirm={handleDelete}
                title="Delete Language"
                message="Are you sure you want to delete this language? All translations for this language will also be deleted. This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
};

export default LanguageManagement;
