import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslation } from '../../contexts/TranslationContext';

function LanguageSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const { currentLanguage, languages, changeLanguage, t } = useTranslation();


  const languageIcons = {
    en: '🇬🇧',
    vi: '🇻🇳',
  };

  const handleLanguageChange = async (languageId, languageCode) => {
    await changeLanguage(languageId, languageCode);
    setIsOpen(false);
    // Return focus to the toggle button after selection
    buttonRef.current?.focus();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard handling: close dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!currentLanguage || !languages) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Desktop Dropdown */}
      <div
        ref={dropdownRef}
        className="hidden md:block relative"
        role="menu"
        aria-label="Language selector"
      >
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-controls="language-menu"
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          id="language-menu-button"
          type="button"
        >
          <span aria-hidden="true">{languageIcons[currentLanguage.code] || '🌐'}</span>
          <span>{currentLanguage.code.toUpperCase()}</span>
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>
        {isOpen && (
          <div
            id="language-menu"
            role="menu"
            aria-labelledby="language-menu-button"
            tabIndex={-1}
            className="absolute right-0 mt-2 w-48 bg-gray-800 text-white rounded-lg shadow-lg z-50 overflow-hidden"
          >
            {languages.map((lang, index) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageChange(lang.id, lang.code)}
                className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${
                  currentLanguage.code === lang.code ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
                role="menuitem"
                tabIndex={0}
                aria-current={currentLanguage.code === lang.code ? 'true' : undefined}
                type="button"
              >
                <span className="text-lg" aria-hidden="true">
                  {languageIcons[lang.code] || '🌐'}
                </span>
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
      <div className="md:hidden flex gap-1 bg-gray-200 rounded-lg p-1" role="group" aria-label="Language selector">
        {languages.map((lang) => (
          <button
            key={lang.id}
            onClick={() => handleLanguageChange(lang.id, lang.code)}
            className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
              currentLanguage.code === lang.code ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-300'
            }`}
            aria-pressed={currentLanguage.code === lang.code}
            type="button"
          >
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LanguageSwitcher;
