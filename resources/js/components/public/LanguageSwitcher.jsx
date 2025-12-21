import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { currentLanguage, languages, changeLanguage } = useTranslation();

    const languageIcons = {
        en: '🇬🇧',
        vi: '🇻🇳'
    };

    const handleLanguageChange = async (languageId, languageCode) => {
        await changeLanguage(languageId, languageCode);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentLanguage || !languages) return null;

    return (
        <div className="flex items-center gap-2">
            {/* Desktop Dropdown */}
            <div ref={dropdownRef} className="hidden md:block relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                    <span>{languageIcons[currentLanguage.code] || '🌐'}</span>
                    <span>{currentLanguage.code.toUpperCase()}</span>
                    <ChevronDown className="w-4 h-4" />
                </button>

                {isOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50 overflow-hidden">
                        {languages.map((lang) => (
                            <button
                                key={lang.id}
                                onClick={() => handleLanguageChange(lang.id, lang.code)}
                                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${
                                    currentLanguage.code === lang.code
                                        ? 'bg-blue-600'
                                        : 'hover:bg-gray-700'
                                }`}
                            >
                                <span className="text-lg">{languageIcons[lang.code] || '🌐'}</span>
                                <div>
                                    <div className="font-semibold">{lang.name}</div>
                                    <div className="text-xs opacity-75">{lang.native_name}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile/Tablet Toggle */}
            <div className="md:hidden flex gap-1 bg-gray-200 rounded-lg p-1">
                {languages.map((lang) => (
                    <button
                        key={lang.id}
                        onClick={() => handleLanguageChange(lang.id, lang.code)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                            currentLanguage.code === lang.code
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-300'
                        }`}
                    >
                        {lang.code.toUpperCase()}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default LanguageSwitcher;
