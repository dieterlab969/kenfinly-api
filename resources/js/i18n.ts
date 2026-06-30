import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      vi: { translation: vi },
    },

    // Default to English; falls back to the key itself (which is already English)
    // when no translation is found for the active locale.
    lng: 'en',
    fallbackLng: 'en',

    interpolation: {
      // React already escapes output — no need for i18next to double-escape.
      escapeValue: false,
    },
  });

export default i18n;
