export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

/**
 * Собирает успешный результат с полезным значением
 *
 * @param value Значение успешной операции
 */
export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

/**
 * Собирает неуспешный результат с текстом ошибки
 *
 * @param error Текст ошибки
 */
export function failure<T = never>(error: string): Result<T> {
  return { ok: false, error };
}

/**
 * Превращает неизвестное исключение в читаемое сообщение
 *
 * @param error Исходная ошибка или произвольное значение
 */
export function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unknown error';
}
