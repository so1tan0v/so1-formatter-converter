/**
 * Imports from domain
 */
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Преобразует непустой текст и оборачивает ошибки в Result
 *
 * @param input Исходный текст
 * @param transform Функция преобразования
 */
export function convertSource(
  input: string,
  transform: (source: string) => string,
): Result<string> {
  const source = input.trim();

  if (!source) {
    return failure('Empty input');
  }

  try {
    return success(transform(input));
  } catch (error) {
    return failure(toErrorMessage(error));
  }
}
