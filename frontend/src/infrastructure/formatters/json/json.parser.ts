/**
 * Imports from packages
 */
import JSON5 from 'json5';

/**
 * Imports from domain
 */
import { toErrorMessage } from '@domain/shared/result';

/**
 * Разбирает JSON, допуская упрощенный объектный синтаксис в духе JSON5
 *
 * @param input Исходный текст
 */
export function parseLooseJson(input: string): unknown {
  const source = input.trim();

  try {
    return JSON.parse(source);
  } catch {
    try {
      return JSON5.parse(source);
    } catch (error) {
      throw new Error(`Invalid JSON: ${toErrorMessage(error)}`);
    }
  }
}
