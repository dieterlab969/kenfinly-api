import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import api from '../utils/api';
import { getCategoryIcon } from '../constants/categories';

const AddTransactionModal = ({ isOpen, onClose, onSuccess }) => {
    const [type, setType] = useState('expense');
    const [formData, setFormData] = useState({
        amount: '',
        category_id: '',
        account_id: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0],
        receipt: null,
    });
    const [categories, setCategories] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [receiptPreview, setReceiptPreview] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
            fetchAccounts();
        }
    }, [isOpen, type]);

    const fetchCategories = async () => {
        try {
            const response = await api.get(`/categories?type=${type}`);
            setCategories(response.data.categories);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.accounts);
            if (response.data.accounts.length > 0 && !formData.account_id) {
                setFormData(prev => ({
                    ...prev,
                    account_id: response.data.accounts[0].id
                }));
            }
        } catch (err) {
            console.error('Failed to fetch accounts:', err);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, receipt: file });
            const reader = new FileReader();
            reader.onloadend = () => {
                setReceiptPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const submitData = new FormData();
            submitData.append('type', type);
            submitData.append('amount', formData.amount);
            submitData.append('category_id', formData.category_id);
            submitData.append('account_id', formData.account_id);
            submitData.append('transaction_date', formData.transaction_date);
            if (formData.notes) {
                submitData.append('notes', formData.notes);
            }
            if (formData.receipt) {
                submitData.append('receipt', formData.receipt);
            }

            await api.post('/transactions', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setFormData({
                amount: '',
                category_id: '',
                account_id: accounts[0]?.id || '',
                notes: '',
                transaction_date: new Date().toISOString().split('T')[0],
                receipt: null,
            });
            setReceiptPreview(null);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add transaction');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setType('expense');
                                    setFormData({ ...formData, category_id: '' });
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                                    type === 'expense'
                                        ? 'bg-red-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setType('income');
                                    setFormData({ ...formData, category_id: '' });
                                }}
                                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                                    type === 'income'
                                        ? 'bg-green-500 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Income
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (VND)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                step="1"
                                min="1"
                                required
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-500 font-medium">VND</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            required
                            value={formData.category_id}
                            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                                <React.Fragment key={category.id}>
                                    <option value={category.id}>
                                        {getCategoryIcon(category.slug)} {category.name}
                                    </option>
                                    {category.children && category.children.map((child) => (
                                        <option key={child.id} value={child.id}>
                                            &nbsp;&nbsp;{getCategoryIcon(child.slug)} {child.name}
                                        </option>
                                    ))}
                                </React.Fragment>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Account
                        </label>
                        <select
                            required
                            value={formData.account_id}
                            onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
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
                            required
                            value={formData.transaction_date}
                            onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="3"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Add notes about this transaction..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Receipt (Optional)
                        </label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition-colors">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                                id="receipt-upload"
                            />
                            <label
                                htmlFor="receipt-upload"
                                className="cursor-pointer flex flex-col items-center"
                            >
                                {receiptPreview ? (
                                    <img
                                        src={receiptPreview}
                                        alt="Receipt preview"
                                        className="max-h-32 mb-2 rounded"
                                    />
                                ) : (
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                )}
                                <span className="text-sm text-gray-600">
                                    {receiptPreview ? 'Change receipt' : 'Upload receipt'}
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                                loading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {loading ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTransactionModal;
