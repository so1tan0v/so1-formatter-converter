export const LOCALES = ['en', 'ru'] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = 'so1-fmt.locale';

/**
 * Проверяет, что строка — поддерживаемый язык интерфейса
 *
 * @param value Значение из URL, хранилища или сообщения родителя
 */
export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ru';
}

/**
 * Читает язык из query-строки: lang, затем locale
 *
 * @param search Search-часть URL, включая '?' или без неё
 */
export function localeFromSearch(search: string): Locale | null {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const value = params.get('lang') ?? params.get('locale');

  return isLocale(value) ? value : null;
}

/**
 * Оставляет только en или ru из кода, который вернул детектор
 *
 * @param language Код языка браузера или хранилища
 */
export function normalizeLocale(language: string | undefined): Locale {
  return language?.toLowerCase().startsWith('ru') ? 'ru' : 'en';
}
