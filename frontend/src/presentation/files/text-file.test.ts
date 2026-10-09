/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { fileNameFor } from './text-file';

describe('fileNameFor', () => {
  it('подставляет запасное имя, если файл не открывали', () => {
    expect(fileNameFor(null, 'formatted', 'json')).toBe('formatted.json');
  });

  it('сохраняет имя открытого файла и меняет расширение', () => {
    expect(fileNameFor('notes/readme.md', 'input', 'jira')).toBe('readme.jira');
    expect(fileNameFor('C:\\dump\\query.sql', 'output', 'json')).toBe(
      'query.json',
    );
  });

  it('оставляет имя без расширения как основу', () => {
    expect(fileNameFor('Makefile', 'input', 'txt')).toBe('Makefile.txt');
  });
});
