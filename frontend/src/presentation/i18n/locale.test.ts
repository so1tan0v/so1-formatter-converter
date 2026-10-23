/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import i18n from './i18n';
import { isLocale, localeFromSearch, normalizeLocale } from './locale';
import en from './locales/en.json';
import ru from './locales/ru.json';

describe('locale', () => {
  it('читает lang и locale из query', () => {
    expect(localeFromSearch('?embed=1&lang=ru')).toBe('ru');
    expect(localeFromSearch('?locale=en')).toBe('en');
    expect(localeFromSearch('?lang=de')).toBeNull();
    expect(isLocale('ru')).toBe(true);
    expect(normalizeLocale('ru-RU')).toBe('ru');
    expect(normalizeLocale('de')).toBe('en');
  });

  it('держит одинаковые ключи словарей и переводит через i18next', async () => {
    expect(leafKeys(ru).sort()).toEqual(leafKeys(en).sort());

    await i18n.changeLanguage('ru');
    expect(i18n.t('input')).toBe('Ввод');
    expect(i18n.t('notReady', { label: 'XML' })).toBe('XML ещё не готов.');
    expect(i18n.t('lines', { count: 2 })).toBe('2 строки');
    expect(i18n.t('lines', { count: 5 })).toBe('5 строк');

    await i18n.changeLanguage('en');
    expect(i18n.t('lines', { count: 1 })).toBe('1 line');
  });
});

function leafKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    leafKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}
