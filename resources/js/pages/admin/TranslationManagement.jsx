import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

/**
 * TranslationManagement component allows managing translations.
 * Features include listing, searching, filtering by language, creating, editing, and deleting translations.
 */
const TranslationManagement = () => {
    const [translations, setTranslations] = useState([]);
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingTranslation, setEditingTranslation] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, translationId: null });
    const [formData, setFormData] = useState({
        key: '',
        value: '',
        language_id: ''
    });

    // useEffect to fetch translations and languages on component mount
    useEffect(function () {
        fetchTranslations();
        fetchLanguages();
    }, []);

    /**
     * Fetches the list of translations from the API.
     * Updates translations state or logs an error if fetching fails.
     */
    function fetchTranslations() {
        api.get('/admin/translations')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setTranslations(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch translations:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Fetches the list of languages from the API.
     * Updates languages state or logs an error if fetching fails.
     */
    function fetchLanguages() {
        api.get('/admin/languages')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setLanguages(response.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch languages:', error);
            });
    }

    /**
     * Handles form submission for creating or updating a translation.
     * Sends POST or PUT requests based on whether editingTranslation is set.
     * Provides user feedback on success or failure.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();

        if (editingTranslation) {
            // Update existing translation
            api.put('/admin/translations/' + editingTranslation.id, formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchTranslations();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new translation
            api.post('/admin/translations', formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchTranslations();
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
     * Prepares the form for editing an existing translation.
     * Populates formData with the translation's current values and shows the modal.
     * @param {Object} translation - The translation object to edit
     */
    function handleEdit(translation) {
        setEditingTranslation(translation);
        setFormData({
            key: translation.key,
            value: translation.value,
            language_id: translation.language_id
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected translation after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/translations/' + deleteModal.translationId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchTranslations();
                    setDeleteModal({ isOpen: false, translationId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing translation state.
     */
    function resetForm() {
        setFormData({ key: '', value: '', language_id: '' });
        setEditingTranslation(null);
    }

    // Filter translations based on search term and selected language
    var filteredTranslations = [];
    if (translations && typeof translations.filter === 'function') {
        filteredTranslations = translations.filter(function (translation) {
            var matchesSearch = (translation.key && translation.key.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1) ||
                (translation.value && translation.value.toLowerCase().indexOf(searchTerm.toLowerCase()) !== -1);
            var matchesLanguage = selectedLanguage === 'all' || translation.language_id == selectedLanguage;
            return matchesSearch && matchesLanguage;
        });
    } else {
        console.error('translations is not an array or does not support filter method:', translations);
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
                {/* Search, language filter and Add Translation button */}
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search translations..."
                            value={searchTerm}
                            onChange={function (e) { setSearchTerm(e.target.value); }}
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={selectedLanguage}
                        onChange={function (e) { setSelectedLanguage(e.target.value); }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="all">All Languages</option>
                        {languagesList.map(function (lang) {
                            return (
                                <option key={lang.id} value={lang.id}>{lang.name}</option>
                            );
                        })}
                    </select>
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Translation
                    </button>
                </div>

                {/* Translations table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Key</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Language</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTranslations.map(function (translation) {
                                var langName = '-';
                                if (languagesList && typeof languagesList.find === 'function') {
                                    var langObj = languagesList.find(function (l) { return l.id === translation.language_id; });
                                    if (langObj) {
                                        langName = langObj.name;
                                    }
                                } else {
                                    console.error('languagesList does not support find method:', languagesList);
                                }
                                return (
                                    <tr key={translation.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 font-mono">{translation.key}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{translation.value}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{langName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={function () { handleEdit(translation); }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={function () { setDeleteModal({ isOpen: true, translationId: translation.id }); }}
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

            {/* Modal for adding or editing translations */}
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
                            <h3 className="text-lg font-medium mb-4">{editingTranslation ? 'Edit Translation' : 'Add New Translation'}</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Key</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.key}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { key: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., auth.login"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Language</label>
                                    <select
                                        required
                                        value={formData.language_id}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { language_id: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">Select language...</option>
                                        {languagesList.map(function (lang) {
                                            return (
                                                <option key={lang.id} value={lang.id}>{lang.name}</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Value</label>
                                    <textarea
                                        required
                                        value={formData.value}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { value: e.target.value })); }}
                                        rows={3}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="Translation text..."
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
                                        {editingTranslation ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a translation */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, translationId: null }); }}
                onConfirm={handleDelete}
                title="Delete Translation"
                message="Are you sure you want to delete this translation? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
}

export default TranslationManagement;
