import React, { useState, useEffect } from 'react';
import { X, Edit2, Save, XCircle, Upload, Trash2, Calendar, DollarSign, Tag, FileText, History } from 'lucide-react';
import api from '../utils/api';
import { getCategoryIcon, formatCurrency } from '../constants/categories';
import { format, parseISO } from 'date-fns';
import { useTranslation } from '@assets/js/contexts/TranslationContext.jsx';

const TransactionDetailModal = ({ isOpen, onClose, transactionId, onUpdate }) => {
    const [transaction, setTransaction] = useState(null);
    const [permissions, setPermissions] = useState({ can_edit: false, can_manage_photos: false });
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [formData, setFormData] = useState({});
    const [selectedTab, setSelectedTab] = useState('details');
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const { t } = useTranslation();

    useEffect(() => {
        if (isOpen && transactionId) {
            fetchTransactionDetails();
            fetchCategories();
            fetchAccounts();
        }
    }, [isOpen, transactionId]);

    const fetchTransactionDetails = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/transactions/${transactionId}`);
            setTransaction(response.data.transaction);
            setPermissions(response.data.permissions);
            setFormData({
                amount: response.data.transaction.amount,
                category_id: response.data.transaction.category_id,
                account_id: response.data.transaction.account_id,
                notes: response.data.transaction.notes || '',
                transaction_date: response.data.transaction.transaction_date,
            });
            setError('');
        } catch (err) {
            setError('Failed to load transaction details');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/categories');
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.accounts);
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.put(`/transactions/${transactionId}`, formData);
            setTransaction(response.data.transaction);
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update transaction');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 20) {
            setError(`Photo size (${fileSizeMB.toFixed(2)}MB) exceeds the maximum allowed size of 20MB. Please remove or resize the photo and try again.`);
            return;
        }

        setUploadingPhoto(true);
        setError('');

        try {
            const photoData = new FormData();
            photoData.append('photo', file);

            const response = await api.post(`/transactions/${transactionId}/photos`, photoData);
            await fetchTransactionDetails();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload photo');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleDeletePhoto = async (photoId) => {
        if (!confirm('Are you sure you want to delete this photo?')) return;

        try {
            await api.delete(`/photos/${photoId}`);
            await fetchTransactionDetails();
        } catch (err) {
            setError('Failed to delete photo');
        }
    };

    const formatChangeValue = (key, value) => {
        if (key === 'amount') return formatCurrency(value);
        if (key === 'transaction_date') return format(parseISO(value), 'MMM dd, yyyy');
        return value || 'N/A';
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Transaction Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {error && (
                    <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                        {error}
                    </div>
                )}

                {loading && !transaction ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-gray-500">Loading...</div>
                    </div>
                ) : transaction ? (
                    <>
                        <div className="border-b border-gray-200">
                            <div className="flex space-x-1 px-6">
                                <button
                                    onClick={() => setSelectedTab('details')}
                                    className={`px-4 py-3 font-medium transition-colors ${selectedTab === 'details'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setSelectedTab('photos')}
                                    className={`px-4 py-3 font-medium transition-colors ${selectedTab === 'photos'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Photos ({transaction.photos?.length || 0})
                                </button>
                                <button
                                    onClick={() => setSelectedTab('history')}
                                    className={`px-4 py-3 font-medium transition-colors ${selectedTab === 'history'
                                        ? 'text-blue-600 border-b-2 border-blue-600'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    History
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {selectedTab === 'details' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${transaction.type === 'income'
                                                ? 'bg-green-100'
                                                : 'bg-blue-100'
                                            }`}>
                                                {getCategoryIcon(transaction.category?.slug)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">
                                                    {transaction.category?.name}
                                                </h3>
                                                <p className="text-gray-500">{transaction.account?.name}</p>
                                            </div>
                                        </div>
                                        <div className={`text-3xl font-bold ${transaction.type === 'income'
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }`}>
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatCurrency(transaction.amount)}
                                        </div>
                                    </div>

                                    {!isEditing ? (
                                        <div className="space-y-4">
                                            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                                                <div className="flex items-center space-x-3">
                                                    <Calendar className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm text-gray-500">Date</div>
                                                        <div className="font-medium text-gray-900">
                                                            {format(parseISO(transaction.transaction_date), 'MMMM dd, yyyy')}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-3">
                                                    <Tag className="w-5 h-5 text-gray-400" />
                                                    <div>
                                                        <div className="text-sm text-gray-500">Category</div>
                                                        <div className="font-medium text-gray-900">
                                                            {transaction.category?.name}
                                                        </div>
                                                    </div>
                                                </div>

                                                {transaction.notes && (
                                                    <div className="flex items-start space-x-3">
                                                        <FileText className="w-5 h-5 text-gray-400 mt-1" />
                                                        <div className="flex-1">
                                                            <div className="text-sm text-gray-500">Notes</div>
                                                            <div className="text-gray-900">{transaction.notes}</div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {permissions.can_edit && (
                                                <button
                                                    onClick={() => setIsEditing(true)}
                                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                                >
                                                    <Edit2 className="w-5 h-5" />
                                                    <span>Edit Transaction</span>
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <form onSubmit={handleUpdate} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Amount
                                                </label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Category
                                                </label>
                                                <select
                                                    value={formData.category_id}
                                                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                >
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>
                                                            {cat.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Account
                                                </label>
                                                <select
                                                    value={formData.account_id}
                                                    onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                >
                                                    {accounts.map(acc => (
                                                        <option key={acc.id} value={acc.id}>
                                                            {acc.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.transaction_date}
                                                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Notes
                                                </label>
                                                <textarea
                                                    value={formData.notes}
                                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                                    rows="3"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>

                                            <div className="flex space-x-3">
                                                <button
                                                    type="submit"
                                                    disabled={loading}
                                                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                >
                                                    <Save className="w-5 h-5" />
                                                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setIsEditing(false)}
                                                    className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                                                >
                                                    <XCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            )}

                            {selectedTab === 'photos' && (
                                <div className="space-y-4">
                                    {permissions.can_manage_photos && (
                                        <div>
                                            <label className="flex items-center justify-center space-x-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-500 cursor-pointer transition-colors">
                                                <Upload className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-600">
                                                    {uploadingPhoto ? 'Uploading...' : 'Upload Photo (Max 20MB)'}
                                                </span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handlePhotoUpload}
                                                    className="hidden"
                                                    disabled={uploadingPhoto}
                                                />
                                            </label>
                                        </div>
                                    )}

                                    {transaction.photos && transaction.photos.length > 0 ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            {transaction.photos.map(photo => (
                                                <div key={photo.id} className="relative group">
                                                    <img
                                                        src={`/storage/${photo.file_path}`}
                                                        alt={photo.original_filename}
                                                        className="w-full h-48 object-cover rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                                                        {permissions.can_manage_photos && (
                                                            <button
                                                                onClick={() => handleDeletePhoto(photo.id)}
                                                                className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-500 truncate">
                                                        {photo.original_filename}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {(photo.file_size / 1024).toFixed(2)} KB
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            No photos uploaded yet
                                        </div>
                                    )}
                                </div>
                            )}

                            {selectedTab === 'history' && (
                                <div className="space-y-4">
                                    {transaction.change_logs && transaction.change_logs.length > 0 ? (
                                        <div className="space-y-4">
                                            {transaction.change_logs.map(log => (
                                                <div key={log.id} className="bg-gray-50 rounded-lg p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <History className="w-5 h-5 text-gray-400" />
                                                            <div>
                                                                <div className="font-medium text-gray-900">
                                                                    {log.action === 'created' && 'Transaction Created'}
                                                                    {log.action === 'updated' && 'Transaction Updated'}
                                                                    {log.action === 'deleted' && 'Transaction Deleted'}
                                                                    {log.action === 'photo_added' && 'Photo Added'}
                                                                    {log.action === 'photo_removed' && 'Photo Removed'}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    by {log.user?.name || 'Unknown'} • {format(parseISO(log.created_at), 'MMM dd, yyyy h:mm a')}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {log.changes?.diff && (
                                                        <div className="mt-3 space-y-1">
                                                            {Object.entries(log.changes.diff).map(([key, change]) => (
                                                                <div key={key} className="text-sm">
                                                                    <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>{' '}
                                                                    <span className="text-red-600">{formatChangeValue(key, change.from)}</span>
                                                                    {' → '}
                                                                    <span className="text-green-600">{formatChangeValue(key, change.to)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                    {log.changes?.filename && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            File: {log.changes.filename}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-gray-500">
                                            No history available
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
};

export default TransactionDetailModal;
