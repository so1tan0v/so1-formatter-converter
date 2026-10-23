/**
 * Imports from packages
 */
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

/**
 * Imports from relative
 */
import { localeFromSearch, LOCALE_STORAGE_KEY } from './locale';
import en from './locales/en.json';
import ru from './locales/ru.json';

const queryLocale =
  typeof window === 'undefined'
    ? null
    : localeFromSearch(window.location.search);

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
    },
    lng: queryLocale ?? undefined,
    fallbackLng: 'en',
    showSupportNotice: false,
    supportedLngs: ['en', 'ru'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    react: { useSuspense: false },
  });

export default i18n;
