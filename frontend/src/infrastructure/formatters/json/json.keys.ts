/**
 * Imports from domain
 */
import type { JsonKeyCase } from '@domain/formatter/types';

/**
 * Переводит имя ключа в выбранный регистр
 *
 * @param key Исходное имя ключа
 * @param keyCase Целевой регистр
 */
export function convertJsonKey(key: string, keyCase: JsonKeyCase): string {
  if (keyCase === 'as-is') {
    return key;
  }

  const prefix = /^_+/.exec(key)?.[0] ?? '';
  const words = key
    .replace(/^_+/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .split(/[^A-Za-z0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => part.toLowerCase());

  if (words.length === 0) {
    return key;
  }

  if (keyCase === 'snake') {
    return `${prefix}${words.join('_')}`;
  }

  const body =
    keyCase === 'camel' ? joinCamel(words) : words.map(capitalize).join('');

  return `${prefix}${body}`;
}

function joinCamel(words: string[]): string {
  const [first, ...rest] = words;

  return `${first}${rest.map(capitalize).join('')}`;
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}
