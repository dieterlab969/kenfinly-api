import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import translationManifest from '@assets/lang/translations.json';

const TranslationContext = createContext();

const FALLBACK_TRANSLATIONS = {
    en: {},
    vi: {}
};

for (const key in translationManifest) {
    FALLBACK_TRANSLATIONS.en[key] = translationManifest[key].en;
    FALLBACK_TRANSLATIONS.vi[key] = translationManifest[key].vi;
}

export const useTranslation = () => {
    const context = useContext(TranslationContext);
    if (!context) {
        throw new Error('useTranslation must be used within TranslationProvider');
    }
    return context;
};

export const TranslationProvider = ({ children }) => {
    const [currentLanguage, setCurrentLanguage] = useState(null);
    const [translations, setTranslations] = useState({});
    const [languages, setLanguages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        initializeTranslations();
    }, []);

    const initializeTranslations = async () => {
        try {
            setLoading(true);
            setError(null);
            
            await loadLanguages();
            
            const savedLanguage = localStorage.getItem('language_code') || 'en';
            await loadTranslations(savedLanguage);
        } catch (err) {
            console.error('Failed to initialize translations from API, falling back to manifest:', err);
            
            const fallbackLang = localStorage.getItem('language_code') || 'en';
            setTranslations(FALLBACK_TRANSLATIONS[fallbackLang] || FALLBACK_TRANSLATIONS.en);
            setCurrentLanguage({
                id: fallbackLang === 'en' ? 1 : 2,
                code: fallbackLang,
                name: fallbackLang === 'en' ? 'English' : 'Vietnamese',
                native_name: fallbackLang === 'en' ? 'English' : 'Tiếng Việt'
            });
            setLanguages([
                { id: 1, code: 'en', name: 'English', native_name: 'English' },
                { id: 2, code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt' }
            ]);
            setError('Working offline with cached translations');
        } finally {
            setLoading(false);
        }
    };

    const loadLanguages = async () => {
        try {
            const response = await api.get('/languages');
            setLanguages(response.data.languages);
        } catch (error) {
            console.error('Failed to load languages:', error);
            throw error;
        }
    };

    const loadTranslations = async (languageCode) => {
        try {
            const response = await api.get(`/languages/${languageCode}/translations`);
            setTranslations(response.data.translations);
            setCurrentLanguage(response.data.language);
            localStorage.setItem('language_code', languageCode);
        } catch (error) {
            console.error('Failed to load translations:', error);
            throw error;
        }
    };

    const changeLanguage = async (languageId, languageCode) => {
        await loadTranslations(languageCode);
        
        const token = localStorage.getItem('token');
        if (token) {
            try {
                await api.post('/user/language', { language_id: languageId });
            } catch (error) {
                console.error('Failed to update user language preference:', error);
            }
        }
    };

    const getFallbackText = (key) => {
        const lang = localStorage.getItem('language_code') || 'en';
        return FALLBACK_TRANSLATIONS[lang]?.[key] || FALLBACK_TRANSLATIONS['en'][key];
    };

    const t = (key, variables = null) => {
        let text = null;
        
        if (translations[key]) {
            text = translations[key];
        } else {
            text = getFallbackText(key);
        }
        
        if (!text) {
            return variables?.default || key;
        }
        
        // Interpolate variables into the translation string
        if (variables && typeof variables === 'object') {
            Object.keys(variables).forEach(varName => {
                // Support both {{var}} and {var} formats
                const regex = new RegExp(`({{\\s*${varName}\\s*}}|{\\s*${varName}\\s*})`, 'g');
                text = text.replace(regex, variables[varName]);
            });
        }
        
        return text;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    </div>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">{getFallbackText('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="fixed top-4 right-4 z-50 bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4 max-w-md">
                    <div className="flex items-start gap-3">
                        <div className="text-yellow-600 text-xl">⚠️</div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-900 mb-1">Offline Mode</p>
                            <p className="text-xs text-yellow-700">{error}</p>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            )}
            <TranslationContext.Provider value={{ t, currentLanguage, languages, changeLanguage, loading, error }}>
                {children}
            </TranslationContext.Provider>
        </>
    );
};
