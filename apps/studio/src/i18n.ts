import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh';
import en from './locales/en';

export const defaultNS = 'common';
export const resources = {
  zh,
  en,
} as const;

// Read saved language from localStorage or fallback to zh
const savedLanguage = typeof window !== 'undefined' ? localStorage.getItem('focusflow_locale') || 'zh' : 'zh';

i18n.use(initReactI18next).init({
  lng: savedLanguage,
  fallbackLng: 'zh',
  defaultNS,
  fallbackNS: 'common',
  resources,
  interpolation: {
    escapeValue: false, // React already escapes values
  },
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage;
}

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
  }
});

export default i18n;
