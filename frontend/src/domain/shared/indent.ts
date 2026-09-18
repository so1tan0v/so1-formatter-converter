/**
 * Доступные стили отступа: пробелы или табуляция
 */
export const INDENT_STYLES = [
  '1-space',
  '2-space',
  '3-space',
  '4-space',
  'tab',
] as const;

export type IndentStyle = (typeof INDENT_STYLES)[number];

/**
 * Подписи стилей отступа для интерфейса
 */
export const INDENT_STYLE_LABELS: Record<IndentStyle, string> = {
  '1-space': '1 space',
  '2-space': '2 spaces',
  '3-space': '3 spaces',
  '4-space': '4 spaces',
  tab: 'tab',
};

/**
 * Возвращает строку отступа для выбранного стиля
 *
 * @param style Стиль отступа: пробелы или табуляция
 */
export function indentString(style: IndentStyle): string {
  switch (style) {
    case '1-space':
      return ' ';
    case '2-space':
      return '  ';
    case '3-space':
      return '   ';
    case '4-space':
      return '    ';
    case 'tab':
      return '\t';
  }
}

/**
 * Повторяет отступ нужное число раз
 *
 * @param style Стиль отступа: пробелы или табуляция
 * @param depth Число уровней вложенности
 */
export function indentUnit(style: IndentStyle, depth: number): string {
  return indentString(style).repeat(depth);
}
