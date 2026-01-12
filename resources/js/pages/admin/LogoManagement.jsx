import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';
import AdminLayout from '../../components/admin/AdminLayout';

const LogoManagement = () => {
    const { t } = useTranslation();
    const [logo, setLogo] = useState(null);
    const [logoUrl, setLogoUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const response = await axios.get('/api/logo');
            if (response.data.success) {
                setLogoUrl(response.data.logo_url);
            }
        } catch (error) {
            console.error('Error fetching logo:', error);
        }
    };

    const handleFileChange = (e) => {
        setLogo(e.target.files[0]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!logo) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('logo', logo);

        try {
            const response = await axios.post('/api/logo/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                setLogoUrl(response.data.logo_url);
                setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
                setLogo(null);
                // Trigger a global logo refresh event if needed
                window.dispatchEvent(new CustomEvent('logo-updated', { detail: response.data.logo_url }));
            }
        } catch (error) {
            setMessage({ 
                type: 'error', 
                text: error.response?.data?.message || 'Error uploading logo.' 
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Logo Management</h1>
                
                <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
                    <div className="mb-8">
                        <h2 className="text-lg font-semibold mb-4">Current Logo</h2>
                        <div className="border rounded-lg p-4 bg-gray-50 flex items-center justify-center min-h-[200px]">
                            {logoUrl ? (
                                <img src={logoUrl} alt="Site Logo" className="max-h-32 object-contain" />
                            ) : (
                                <p className="text-gray-500 italic">No logo uploaded yet</p>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleUpload}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upload New Logo
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                Recommended: PNG or SVG with transparent background. Max size 2MB.
                            </p>
                        </div>

                        {message.text && (
                            <div className={`mb-4 p-3 rounded-md flex items-center space-x-2 ${
                                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}>
                                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <span>{message.text}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!logo || uploading}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            {uploading ? (
                                <span>Uploading...</span>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    <span>Upload Logo</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

export default LogoManagement;
