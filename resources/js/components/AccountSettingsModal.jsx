import React, { useState, useEffect } from 'react';
import { X, User, Mail, CheckCircle, AlertCircle, Edit2, Save, Loader2 } from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';
import api from '../utils/api';

const AccountSettingsModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.get('/profile');
            if (response.data.success) {
                setProfile(response.data.profile);
                setEditedName(response.data.profile.name);
            }
        } catch (err) {
            setError(t('account.fetch_error') || 'Failed to load profile information.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!editedName.trim()) {
            setError(t('account.name_required') || 'Name is required.');
            return;
        }

        if (editedName.trim().length < 2) {
            setError(t('account.name_too_short') || 'Name must be at least 2 characters.');
            return;
        }

        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await api.put('/profile', { name: editedName.trim() });
            if (response.data.success) {
                setProfile(response.data.profile);
                setEditing(false);
                setSuccessMessage(t('account.update_success') || 'Profile updated successfully.');
                setTimeout(() => setSuccessMessage(null), 3000);
            }
        } catch (err) {
            if (err.response?.data?.errors?.name) {
                setError(err.response.data.errors.name[0]);
            } else {
                setError(t('account.update_error') || 'Failed to update profile.');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setEditing(false);
        setEditedName(profile?.name || '');
        setError(null);
    };

    const handleClose = () => {
        setEditing(false);
        setError(null);
        setSuccessMessage(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
                    <h2 className="text-xl font-bold text-gray-900">
                        {t('account.title') || 'Account Information'}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                        </div>
                    ) : error && !profile ? (
                        <div className="text-center py-8">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                            <p className="text-red-600 mb-4">{error}</p>
                            <button
                                onClick={fetchProfile}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {t('common.try_again') || 'Try Again'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {successMessage && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{successMessage}</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            {t('account.full_name') || 'Full Name'}
                                        </div>
                                    </label>
                                    {editing ? (
                                        <input
                                            type="text"
                                            value={editedName}
                                            onChange={(e) => setEditedName(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={t('account.enter_name') || 'Enter your name'}
                                            maxLength={100}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                                            <span className="text-gray-900">{profile?.name}</span>
                                            <button
                                                onClick={() => setEditing(true)}
                                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                                title={t('common.edit') || 'Edit'}
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {t('account.email') || 'Email Address'}
                                        </div>
                                    </label>
                                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
                                        <span className="text-gray-900">{profile?.email}</span>
                                        {profile?.email_verified ? (
                                            <div className="flex items-center gap-1 text-green-600" title={t('account.email_verified') || 'Email Verified'}>
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-xs font-medium">
                                                    {t('account.verified') || 'Verified'}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-amber-600" title={t('account.email_not_verified') || 'Email Not Verified'}>
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-xs font-medium">
                                                    {t('account.not_verified') || 'Not Verified'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t('account.email_readonly') || 'Email address cannot be changed.'}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('account.account_status') || 'Account Status'}
                                    </label>
                                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                            profile?.status === 'active' 
                                                ? 'bg-green-100 text-green-800'
                                                : profile?.status === 'pending'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {profile?.status === 'active' && (t('account.status_active') || 'Active')}
                                            {profile?.status === 'pending' && (t('account.status_pending') || 'Pending')}
                                            {profile?.status === 'suspended' && (t('account.status_suspended') || 'Suspended')}
                                        </span>
                                    </div>
                                </div>

                                {profile?.roles && profile.roles.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('account.roles') || 'Roles'}
                                        </label>
                                        <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                            <div className="flex flex-wrap gap-2">
                                                {profile.roles.map((role, index) => (
                                                    <span
                                                        key={index}
                                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('account.member_since') || 'Member Since'}
                                    </label>
                                    <div className="px-4 py-2 bg-gray-50 rounded-lg">
                                        <span className="text-gray-900">
                                            {profile?.created_at && new Date(profile.created_at).toLocaleDateString(undefined, {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t">
                                {editing ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            disabled={saving}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                        >
                                            {t('common.cancel') || 'Cancel'}
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 ${
                                                saving
                                                    ? 'bg-blue-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    {t('common.saving') || 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    {t('common.save') || 'Save'}
                                                </>
                                            )}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {t('common.close') || 'Close'}
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccountSettingsModal;
