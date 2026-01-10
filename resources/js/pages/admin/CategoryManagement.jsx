import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import ConfirmModal from '../../components/admin/ConfirmModal';
import api from '../../utils/api';
import { Plus, Edit, Trash2 } from 'lucide-react';

/**
 * CategoryManagement component allows managing categories.
 * Features include listing categories, creating, editing, and deleting categories.
 */
const CategoryManagement = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, categoryId: null });
    const [formData, setFormData] = useState({
        name: '',
        type: 'expense',
        icon: '',
        color: '#000000'
    });

    // useEffect to fetch categories on component mount
    useEffect(() => {
        fetchCategories();
    }, []);

    /**
     * Fetches the list of categories from the API.
     * Sets the categories state or logs an error if fetching fails.
     */
    function fetchCategories() {
        api.get('/admin/categories')
            .then(function (response) {
                if (response.data && response.data.success) {
                    setCategories(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch categories:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Handles form submission for creating or updating a category.
     * Sends POST or PUT requests based on whether editingCategory is set.
     * Provides user feedback on success or failure.
     * @param {Event} e - Form submit event
     */
    function handleSubmit(e) {
        e.preventDefault();
        if (editingCategory) {
            // Update existing category
            api.put('/admin/categories/' + editingCategory.id, formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchCategories();
                        setShowModal(false);
                        resetForm();
                    }
                })
                .catch(function (error) {
                    alert((error.response && error.response.data && error.response.data.message) || 'Operation failed');
                });
        } else {
            // Create new category
            api.post('/admin/categories', formData)
                .then(function (response) {
                    if (response.data && response.data.success) {
                        fetchCategories();
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
     * Prepares the form for editing an existing category.
     * Populates formData with the category's current values and shows the modal.
     * @param {Object} category - The category object to edit
     */
    function handleEdit(category) {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            type: category.type,
            icon: category.icon || '',
            color: category.color || '#000000'
        });
        setShowModal(true);
    }

    /**
     * Deletes the selected category after confirmation.
     * Provides user feedback on success or failure.
     */
    function handleDelete() {
        api.delete('/admin/categories/' + deleteModal.categoryId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    fetchCategories();
                    setDeleteModal({ isOpen: false, categoryId: null });
                }
            })
            .catch(function (error) {
                alert((error.response && error.response.data && error.response.data.message) || 'Delete failed');
            });
    }

    /**
     * Resets the form data and clears the editing category state.
     */
    function resetForm() {
        setFormData({ name: '', type: 'expense', icon: '', color: '#000000' });
        setEditingCategory(null);
    }

    // Check if categories is an array before mapping
    var categoriesList = [];
    if (categories && typeof categories.map === 'function') {
        categoriesList = categories;
    } else {
        console.error('categories is not an array or does not support map method:', categories);
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-end">
                    {/* Add Category button */}
                    <button
                        onClick={function () { setShowModal(true); }}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Category
                    </button>
                </div>

                {/* Categories table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Icon</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {categoriesList.map(function (category) {
                            return (
                                <tr key={category.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{category.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' +
                                                (category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                            }>
                                                {category.type}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{category.icon || '-'}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-6 w-6 rounded" style={{ backgroundColor: category.color }}></div>
                                            <span className="ml-2 text-sm text-gray-500">{category.color}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={function () { handleEdit(category); }}
                                            className="text-indigo-600 hover:text-indigo-900 mr-4"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={function () { setDeleteModal({ isOpen: true, categoryId: category.id }); }}
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

            {/* Modal for adding or editing categories */}
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
                            <h3 className="text-lg font-medium mb-4">{editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
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
                                    <label className="block text-sm font-medium text-gray-700">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { type: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Icon</label>
                                    <input
                                        type="text"
                                        value={formData.icon}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { icon: e.target.value })); }}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., shopping-cart"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Color</label>
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={function (e) { setFormData(Object.assign({}, formData, { color: e.target.value })); }}
                                        className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                                        {editingCategory ? 'Update' : 'Create'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation modal for deleting a category */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={function () { setDeleteModal({ isOpen: false, categoryId: null }); }}
                onConfirm={handleDelete}
                title="Delete Category"
                message="Are you sure you want to delete this category? This action cannot be undone."
                confirmText="Delete"
                danger
            />
        </AdminLayout>
    );
};

export default CategoryManagement;
