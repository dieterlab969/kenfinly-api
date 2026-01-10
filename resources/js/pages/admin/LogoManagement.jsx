import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../utils/api';
import { Upload, Trash2, Image, AlertCircle, CheckCircle } from 'lucide-react';

const LogoManagement = () => {
    const [logos, setLogos] = useState({ logo_1x: '', logo_2x: '', logo_4x: '' });
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState({ '1x': false, '2x': false, '4x': false });
    const [message, setMessage] = useState(null);
    
    const fileInputRefs = {
        '1x': useRef(null),
        '2x': useRef(null),
        '4x': useRef(null)
    };

    useEffect(() => {
        fetchLogos();
    }, []);

    const fetchLogos = async () => {
        try {
            const response = await api.get('/admin/logos');
            if (response.data.success) {
                setLogos(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch logos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (version, file) => {
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setMessage({ type: 'error', text: 'Invalid file type. Allowed: PNG, JPG, SVG, WebP' });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'File size exceeds 5MB limit' });
            return;
        }

        setUploading(prev => ({ ...prev, [version]: true }));
        setMessage(null);

        const formData = new FormData();
        formData.append('logo', file);
        formData.append('version', version);

        try {
            const response = await api.post('/admin/logos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                fetchLogos();
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Upload failed' });
        } finally {
            setUploading(prev => ({ ...prev, [version]: false }));
        }
    };

    const handleDelete = async (version) => {
        if (!confirm(`Are you sure you want to delete the ${version} logo?`)) return;

        try {
            const response = await api.request({
                method: 'DELETE',
                url: '/admin/logos',
                data: { version }
            });
            if (response.data.success) {
                setMessage({ type: 'success', text: response.data.message });
                fetchLogos();
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Delete failed' });
        }
    };

    const logoVersions = [
        { version: '1x', label: 'Logo (1x)', desc: 'Default resolution - standard screens' },
        { version: '2x', label: 'Logo (2x)', desc: 'Retina resolution - high-density screens' },
        { version: '4x', label: 'Logo (4x)', desc: 'High resolution - 4K displays' }
    ];

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Logo Management</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Upload and manage your website logos for different screen resolutions.
                    </p>
                </div>

                {message && (
                    <div className={`flex items-center p-4 rounded-md ${
                        message.type === 'success' 
                            ? 'bg-green-50 text-green-800 border border-green-200' 
                            : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                            <AlertCircle className="h-5 w-5 mr-2" />
                        )}
                        {message.text}
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                        <div className="text-sm text-blue-800">
                            <p className="font-medium">Supported formats:</p>
                            <p>PNG, JPG, SVG, WebP (max 5MB per file)</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {logoVersions.map(({ version, label, desc }) => (
                        <div key={version} className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{label}</h3>
                            <p className="text-sm text-gray-500 mb-4">{desc}</p>
                            
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4 min-h-[120px] flex items-center justify-center bg-gray-50">
                                {logos[`logo_${version}`] ? (
                                    <img 
                                        src={logos[`logo_${version}`].startsWith('/') ? logos[`logo_${version}`] : `/${logos[`logo_${version}`]}`}
                                        alt={`Logo ${version}`}
                                        className="max-h-24 max-w-full object-contain"
                                    />
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <Image className="h-12 w-12 mx-auto mb-2" />
                                        <p className="text-sm">No logo uploaded</p>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRefs[version]}
                                onChange={(e) => handleUpload(version, e.target.files[0])}
                                accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
                                className="hidden"
                            />

                            <div className="flex space-x-2">
                                <button
                                    onClick={() => fileInputRefs[version].current?.click()}
                                    disabled={uploading[version]}
                                    className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    {uploading[version] ? 'Uploading...' : 'Upload'}
                                </button>
                                
                                {logos[`logo_${version}`] && (
                                    <button
                                        onClick={() => handleDelete(version)}
                                        className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        This is how your logo will appear on the website. The correct version will be displayed based on screen resolution.
                    </p>
                    <div className="bg-gray-100 p-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#94edfd' }}>
                        {logos.logo_1x ? (
                            <img 
                                src={logos.logo_1x.startsWith('/') ? logos.logo_1x : `/${logos.logo_1x}`}
                                srcSet={[
                                    logos.logo_1x && `${logos.logo_1x.startsWith('/') ? logos.logo_1x : '/' + logos.logo_1x} 1x`,
                                    logos.logo_2x && `${logos.logo_2x.startsWith('/') ? logos.logo_2x : '/' + logos.logo_2x} 2x`,
                                    logos.logo_4x && `${logos.logo_4x.startsWith('/') ? logos.logo_4x : '/' + logos.logo_4x} 4x`
                                ].filter(Boolean).join(', ')}
                                alt="Logo Preview"
                                className="max-h-20 object-contain"
                            />
                        ) : (
                            <p className="text-gray-500">No logo uploaded</p>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default LogoManagement;
