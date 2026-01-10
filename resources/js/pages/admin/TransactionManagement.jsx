import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { Search, Eye } from 'lucide-react';

/**
 * TransactionManagement component allows viewing and filtering transactions.
 * Supports searching, filtering by type, and viewing transaction details.
 */
const TransactionManagement = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    // Fetch transactions on component mount and whenever searchTerm or typeFilter changes
    useEffect(function () {
        fetchTransactions();
    }, [searchTerm, typeFilter]);

    /**
     * Fetches transactions from the API based on search term and type filter.
     * Updates transactions state or logs error if fetching fails.
     */
    function fetchTransactions() {
        var params = new URLSearchParams();
        if (searchTerm) {
            params.append('search', searchTerm);
        }
        if (typeFilter !== 'all') {
            params.append('type', typeFilter);
        }

        api.get('/admin/transactions?' + params.toString())
            .then(function (response) {
                if (response.data && response.data.success) {
                    setTransactions(response.data.data.data);
                }
            })
            .catch(function (error) {
                console.error('Failed to fetch transactions:', error);
            })
            .finally(function () {
                setLoading(false);
            });
    }

    /**
     * Fetches detailed information for a specific transaction.
     * Opens the detail modal with the fetched data.
     * @param {number|string} transactionId - The ID of the transaction to view
     */
    function handleViewDetails(transactionId) {
        api.get('/admin/transactions/' + transactionId)
            .then(function (response) {
                if (response.data && response.data.success) {
                    setSelectedTransaction(response.data.data);
                    setShowDetailModal(true);
                }
            })
            .catch(function () {
                alert('Failed to load transaction details');
            });
    }

    // Check if transactions is an array before mapping
    var transactionsList = [];
    if (transactions && typeof transactions.map === 'function') {
        transactionsList = transactions;
    } else {
        console.error('transactions is not an array or does not support map method:', transactions);
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                {/* Search input and type filter */}
                <div className="flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={function (e) { setSearchTerm(e.target.value); }}
                            className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={function (e) { setTypeFilter(e.target.value); }}
                        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    >
                        <option value="all">All Types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>

                {/* Transactions table */}
                <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactionsList.map(function (transaction) {
                                return (
                                    <tr key={transaction.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={
                                                'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' +
                                                (transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                            }>
                                                {transaction.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                {(transaction.type === 'income' ? '+' : '-') + transaction.amount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(transaction.category && transaction.category.name) || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(transaction.account && transaction.account.name) || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={function () { handleViewDetails(transaction.id); }}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction detail modal */}
            {showDetailModal && selectedTransaction && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div
                            className="fixed inset-0 bg-gray-500 bg-opacity-75"
                            onClick={function () {
                                setShowDetailModal(false);
                                setSelectedTransaction(null);
                            }}
                        ></div>
                        <div className="relative bg-white rounded-lg p-6 max-w-2xl w-full">
                            <h3 className="text-lg font-medium mb-4">Transaction Details</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Description</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedTransaction.description}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Type</label>
                                        <span className={
                                            'mt-1 inline-flex px-2 text-xs leading-5 font-semibold rounded-full ' +
                                            (selectedTransaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                                        }>
                                            {selectedTransaction.type}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Amount</label>
                                        <p className={
                                            'mt-1 text-sm font-semibold ' +
                                            (selectedTransaction.type === 'income' ? 'text-green-600' : 'text-red-600')
                                        }>
                                            {(selectedTransaction.type === 'income' ? '+' : '-') + selectedTransaction.amount}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Category</label>
                                        <p className="mt-1 text-sm text-gray-900">{(selectedTransaction.category && selectedTransaction.category.name) || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Account</label>
                                        <p className="mt-1 text-sm text-gray-900">{(selectedTransaction.account && selectedTransaction.account.name) || '-'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Date</label>
                                        <p className="mt-1 text-sm text-gray-900">{new Date(selectedTransaction.transaction_date).toLocaleString()}</p>
                                    </div>
                                    {selectedTransaction.notes && (
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-500">Notes</label>
                                            <p className="mt-1 text-sm text-gray-900">{selectedTransaction.notes}</p>
                                        </div>
                                    )}
                                </div>
                                {selectedTransaction.photos && selectedTransaction.photos.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-2">Photos</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {selectedTransaction.photos.map(function (photo, index) {
                                                return (
                                                    <img
                                                        key={index}
                                                        src={photo.url}
                                                        alt={'Transaction photo ' + (index + 1)}
                                                        className="w-full h-24 object-cover rounded"
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end mt-6">
                                <button
                                    onClick={function () {
                                        setShowDetailModal(false);
                                        setSelectedTransaction(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

export default TransactionManagement;
