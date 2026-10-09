/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { locateError } from './error-location';

describe('locateError', () => {
  it('читает строку и колонку', () => {
    expect(locateError('bad at line 3, column 8', '')).toEqual({
      line: 3,
      column: 8,
    });
    expect(locateError("JSON5: invalid character '}' at 2:4", '')).toEqual({
      line: 2,
      column: 4,
    });
  });

  it('переводит позицию в символах в строку исходника', () => {
    expect(locateError('Unexpected token at position 4', 'abc\nde')).toEqual({
      line: 2,
      column: 1,
    });
  });

  it('возвращает null, если места в тексте нет', () => {
    expect(locateError('Empty input', '{}')).toBeNull();
  });
});
