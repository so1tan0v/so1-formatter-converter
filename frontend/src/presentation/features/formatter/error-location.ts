export interface SourceLocation {
  line: number;
  column: number;
}

/**
 * Достает строку и колонку из текста ошибки форматтера
 *
 * @param message Текст ошибки
 * @param source Исходный текст, нужен для ошибок с позицией в символах
 */
export function locateError(
  message: string,
  source: string,
): SourceLocation | null {
  const lineColumn =
    /line\s+(\d+)\s*,\s*column\s+(\d+)/i.exec(message) ??
    /at\s+(\d+):(\d+)/.exec(message);

  if (lineColumn?.[1] && lineColumn[2]) {
    return {
      line: Number(lineColumn[1]),
      column: Number(lineColumn[2]),
    };
  }

  const position = /position\s+(\d+)/i.exec(message);

  if (!position?.[1]) {
    return null;
  }

  return locationAt(source, Number(position[1]));
}

function locationAt(source: string, index: number): SourceLocation {
  let line = 1;
  let column = 1;
  const end = Math.min(Math.max(index, 0), source.length);

  for (let cursor = 0; cursor < end; cursor += 1) {
    if (source[cursor] === '\n') {
      line += 1;
      column = 1;
    } else {
      column += 1;
    }
  }

  return { line, column };
}
