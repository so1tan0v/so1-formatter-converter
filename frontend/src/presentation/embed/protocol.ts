export const CONVERTER_EMBED_SOURCE = 'so1-converter' as const;

export type ConverterColorScheme = 'dark' | 'light';

export interface ConverterEmbedExitMessage {
  readonly source: typeof CONVERTER_EMBED_SOURCE;
  readonly type: 'exit';
}

export interface ConverterEmbedThemeMessage {
  readonly source: typeof CONVERTER_EMBED_SOURCE;
  readonly type: 'set-theme';
  readonly theme: ConverterColorScheme;
}

/**
 * Проверяет, что значение является тёмной или светлой схемой
 *
 * @param value Произвольное значение из URL или postMessage
 */
export function isConverterColorScheme(
  value: unknown,
): value is ConverterColorScheme {
  return value === 'dark' || value === 'light';
}

/**
 * Собирает сообщение о выходе из встроенного режима
 */
export function createConverterEmbedExitMessage(): ConverterEmbedExitMessage {
  return { source: CONVERTER_EMBED_SOURCE, type: 'exit' };
}

/**
 * Собирает сообщение о смене темы во встроенном режиме
 *
 * @param theme Схема темы родительского приложения
 */
export function createConverterEmbedThemeMessage(
  theme: ConverterColorScheme,
): ConverterEmbedThemeMessage {
  return { source: CONVERTER_EMBED_SOURCE, type: 'set-theme', theme };
}

/**
 * Проверяет, что сообщение просит закрыть встроенный конвертер
 *
 * @param value Данные события postMessage
 */
export function isConverterEmbedExitMessage(
  value: unknown,
): value is ConverterEmbedExitMessage {
  return isEmbedRecord(value) && value.type === 'exit';
}

/**
 * Проверяет, что сообщение задаёт тему встроенного конвертера
 *
 * @param value Данные события postMessage
 */
export function isConverterEmbedThemeMessage(
  value: unknown,
): value is ConverterEmbedThemeMessage {
  return (
    isEmbedRecord(value) &&
    value.type === 'set-theme' &&
    isConverterColorScheme(value.theme)
  );
}

/**
 * Определяет комбинацию Ctrl+C или Command+C для выхода из embed
 *
 * @param event Клавиатурное событие
 */
export function isEmbedExitShortcut(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}): boolean {
  return (
    event.key.toLowerCase() === 'c' &&
    (event.ctrlKey || event.metaKey) &&
    !event.altKey &&
    !event.shiftKey
  );
}

/**
 * Возвращает origin родителя по document.referrer или '*'
 *
 * @param referrer Значение document.referrer
 */
export function parentOriginFromReferrer(referrer: string): string {
  try {
    if (!referrer) {
      return '*';
    }

    return new URL(referrer).origin;
  } catch {
    return '*';
  }
}

function isEmbedRecord(value: unknown): value is Record<string, unknown> & {
  source: typeof CONVERTER_EMBED_SOURCE;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { source?: unknown }).source === CONVERTER_EMBED_SOURCE
  );
}
