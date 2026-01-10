import React, {useState, useEffect, useRef} from 'react';
import axios from 'axios';

/**
 * Component to manage website favicon upload and preview.
 *
 * Handles fetching the current favicon, validating new uploads,
 * previewing the image, and submitting the updated favicon to the backend.
 *
 * @component
 * @returns {JSX.Element} The favicon management UI.
 */
const FaviconManager = () => {
    const [favicon, setFavicon] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [message, setMessage] = useState({type: '', text: ''});
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef(null);

    /**
     * Generates axios config with authorization header.
     *
     * @returns {object} Axios request configuration with JWT token header.
     */
    const getAxiosConfig = () => {
        const token = localStorage.getItem('token');
        return {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
    };

    useEffect(() => {
        fetchCurrentFavicon();
    }, []);

    // Cleanup preview URL on unmount or when preview changes to avoid memory leaks
    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    /**
     * Fetches the current favicon URL from the backend.
     * Sets the preview URL if favicon exists.
     */
    const fetchCurrentFavicon = async () => {
        try {
            const response = await axios.get('/api/admin/favicon', getAxiosConfig());
            if (response.data.favicon) {
                // Check if the response is already a full URL (starts with http)
                const faviconUrl = response.data.favicon.startsWith('http')
                    ? response.data.favicon
                    : `/storage/${response.data.favicon}`;
                setPreviewUrl(faviconUrl);
            }
        } catch (error) {
            console.error('Error fetching favicon:', error);
            setMessage({
                type: 'error',
                text: 'Failed to load current favicon. Please try again later.',
            });
        }
    };

    /**
     * Handles file input change event.
     * Validates image aspect ratio and minimum size.
     *
     * @param {React.ChangeEvent<HTMLInputElement>} event The file input change event.
     */
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Create preview URL and set file
        const objectUrl = URL.createObjectURL(file);
        setFavicon(file);
        setPreviewUrl(objectUrl);

        // Validate image dimensions
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(img.src);

            // Validate square aspect ratio
            if (img.width !== img.height) {
                setMessage({
                    type: 'error',
                    text: 'The favicon must have a 1:1 aspect ratio (square image).',
                });
                resetFileInput();
                return;
            }

            // Validate minimum size
            if (img.width < 8 || img.height < 8) {
                setMessage({
                    type: 'error',
                    text: 'The favicon must be at least 8×8 pixels.',
                });
                resetFileInput();
                return;
            }

            setMessage({type: '', text: ''});
        };

        img.onerror = () => {
            setMessage({
                type: 'error',
                text: 'Invalid image file. Please select a valid image.',
            });
            resetFileInput();
        };

        img.src = objectUrl;
    };

    /**
     * Resets the file input and clears preview and favicon state.
     */
    const resetFileInput = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setFavicon(null);
        setPreviewUrl('');
    };

    /**
     * Handles form submission to upload the favicon.
     * Validates before sending and updates favicon in browser tabs on success.
     *
     * @param {React.FormEvent<HTMLFormElement>} event The form submit event.
     */
    const handleSubmit = async (event) => {
        event.preventDefault();

        // Disable submit if validation error or no file selected
        if (!favicon) {
            setMessage({type: 'error', text: 'Please select a favicon image.'});
            return;
        }
        if (message.type === 'error') {
            return;
        }

        const formData = new FormData();
        formData.append('favicon', favicon);

        setIsUploading(true);

        try {
            // Include JWT token in the request
            const baseConfig = getAxiosConfig();
            const config = {
                ...baseConfig,
                headers: {
                    ...baseConfig.headers,
                    'Content-Type': 'multipart/form-data',
                },
            };

            const response = await axios.post('/api/admin/favicon', formData, config);

            setMessage({type: 'success', text: response.data.message});

            // Update favicon in browser tabs without refresh
            const faviconUrl = response.data.favicon.startsWith('http')
                ? response.data.favicon
                : `/storage/${response.data.favicon}`;
            const faviconHref = `${faviconUrl}?t=${new Date().getTime()}`;
            
            const faviconLinks = document.querySelectorAll("link[rel='icon']");
            if (faviconLinks.length) {
                faviconLinks.forEach((link) => {
                    link.href = faviconHref;
                });
            } else {
                const link = document.createElement('link');
                link.rel = 'icon';
                link.href = faviconHref;
                document.head.appendChild(link);
            }
        } catch (error) {
            console.error('Error uploading favicon:', error);
            let errorMsg = 'An error occurred while uploading the favicon.';
            if (error.response?.data?.message) {
                errorMsg = error.response.data.message;
            } else if (!error.response) {
                errorMsg = 'Network error. Please check your connection.';
            }
            setMessage({type: 'error', text: errorMsg});
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Manage Website Favicon</h3>
            </div>
            <div className="p-6">
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="favicon" className="block text-sm font-medium text-gray-700 mb-2">
                            Upload Favicon (Square image, minimum 8×8 px, recommended 48×48 px or larger)
                        </label>
                        <input
                            type="file"
                            id="favicon"
                            ref={fileInputRef}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            accept="image/*"
                            onChange={handleFileChange}
                            aria-describedby="favicon-help"
                        />
                        <p id="favicon-help" className="mt-2 text-sm text-gray-500">
                            For best results, use a PNG or ICO file with a transparent background.
                        </p>
                    </div>
                    {message.text && (
                        <div
                            aria-live="polite"
                            className={`p-4 mb-6 rounded-md ${
                                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                            }`}
                        >
                            {message.text}
                        </div>
                    )}
                    <div className="mb-6">
                        <div className="p-4 border border-gray-200 rounded-md">
                            <h5 className="text-sm font-medium text-gray-700 mb-3">Preview:</h5>
                            {previewUrl ? (
                                <div className="flex items-center">
                                    <img
                                        src={previewUrl}
                                        alt="Favicon preview"
                                        className="mr-4"
                                        style={{maxWidth: '48px', maxHeight: '48px'}}
                                    />
                                    <div>
                                        <div className="flex items-center mb-2">
                                            <div className="w-4 h-4 mr-2 overflow-hidden">
                                                <img src={previewUrl} alt="Small preview" className="w-full h-full"/>
                                            </div>
                                            <span className="text-sm text-gray-600">Browser tab appearance</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">No favicon selected.</p>
                            )}
                        </div>
                    </div>
                    <button
                        type="submit"
                        className={`px-4 py-2 rounded-md text-sm font-medium text-white ${
                            !favicon || isUploading || message.type === 'error'
                                ? 'bg-blue-300 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                        disabled={!favicon || isUploading || message.type === 'error'}
                    >
                        {isUploading ? (
                            <span className="flex items-center">
                <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                  <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                  ></circle>
                  <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Uploading...
              </span>
                        ) : (
                            'Update Favicon'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FaviconManager;
