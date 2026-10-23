/**
 * Imports from packages
 */
import { useTranslation } from 'react-i18next';

/**
 * Imports from relative
 */
import { normalizeLocale, type Locale } from './locale';

/**
 * Возвращает перевод, текущий язык и смену языка через i18next
 */
export function useLocale() {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage ?? i18n.language);

  return {
    t,
    locale,
    setLocale: (next: Locale) => {
      void i18n.changeLanguage(next);
    },
  };
}
