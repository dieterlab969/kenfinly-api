import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Language {
  code: string;
  name: string;
  dir: 'ltr' | 'rtl';
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// ─── Supported languages ──────────────────────────────────────────────────────

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en-US', name: 'English (US)',  dir: 'ltr' },
  { code: 'en-GB', name: 'English (UK)',  dir: 'ltr' },
  { code: 'vi',    name: 'Vietnamese',    dir: 'ltr' },
  { code: 'hi',    name: 'Hindi',         dir: 'ltr' },
  { code: 'es',    name: 'Spanish',       dir: 'ltr' },
  { code: 'fr',    name: 'French',        dir: 'ltr' },
  { code: 'ar',    name: 'Arabic',        dir: 'rtl' },
  { code: 'bn',    name: 'Bengali',       dir: 'ltr' },
  { code: 'ru',    name: 'Russian',       dir: 'ltr' },
  { code: 'zh',    name: 'Chinese',       dir: 'ltr' },
  { code: 'ja',    name: 'Japanese',      dir: 'ltr' },
  { code: 'ko',    name: 'Korean',        dir: 'ltr' },
];

const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0];
const STORAGE_KEY = 'app_language';

// ─── Context ──────────────────────────────────────────────────────────────────

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Language;
        return SUPPORTED_LANGUAGES.find((l) => l.code === parsed.code) ?? DEFAULT_LANGUAGE;
      }
    } catch {
      // ignore parse errors
    }
    return DEFAULT_LANGUAGE;
  });

  // Apply language to document immediately when it changes
  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(language));
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within a LanguageProvider');
  return ctx;
};
