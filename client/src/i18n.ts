import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  // Load translations from public/locales/{lng}/translation.json
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'pl'],
    debug: import.meta.env.DEV,
    
    interpolation: {
      // React already does escaping
      escapeValue: false,
    },
    
    // Backend options
    backend: {
      // Path to load translations from
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    // Detection options
    detection: {
      // Order of sources to detect user language
      order: ['querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
      // Cache user language
      caches: ['localStorage', 'cookie'],
    }
  });

export default i18n;