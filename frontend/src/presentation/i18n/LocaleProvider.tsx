/**
 * Imports from packages
 */
import { useEffect, type ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';

/**
 * Imports from relative
 */
import i18n from './i18n';
import { normalizeLocale, type Locale } from './locale';

interface LocaleProviderProps {
  children: ReactNode;
  initialQueryLocale?: Locale | null;
}

/**
 * Подключает i18next и записывает язык документа
 *
 * @param children Дочерние элементы
 * @param initialQueryLocale Язык из query-строки встроенного режима
 */
export function LocaleProvider({
  children,
  initialQueryLocale = null,
}: LocaleProviderProps) {
  useEffect(() => {
    if (initialQueryLocale) {
      void i18n.changeLanguage(initialQueryLocale);
    }
  }, [initialQueryLocale]);

  useEffect(() => {
    const apply = (language: string) => {
      document.documentElement.lang = normalizeLocale(language);
    };

    apply(i18n.resolvedLanguage ?? i18n.language);
    i18n.on('languageChanged', apply);

    return () => {
      i18n.off('languageChanged', apply);
    };
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
