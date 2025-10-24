import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { InitOptions } from 'i18next';

const config: InitOptions = {
  // Language settings
  fallbackLng: 'en',
  supportedLngs: ['en', 'es', 'pl'],
  
  // Debug settings
  debug: false,
  
  // Namespace settings
  defaultNS: 'translation',
  
  // Interpolation settings
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  
  // Backend options
  backend: {
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },
  
  // Detection options
  detection: {
    // Order of language detection
    order: ['path', 'querystring', 'cookie', 'localStorage', 'navigator', 'htmlTag'],
    
    // Cache settings
    caches: ['localStorage', 'cookie'],
    
    // Path detection settings
    lookupFromPathIndex: 0,
    
    // Cookie settings
    cookieMinutes: 10080, // 7 days
    cookieDomain: 'localhost',
    
    // Query string settings
    lookupQuerystring: 'lng',
    
    // Local storage settings
    lookupLocalStorage: 'i18nextLng',
  }
};

i18n
  // Load translations from public/locales/{lng}/translation.json
  .use(Backend)
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init(config);

export default i18n;