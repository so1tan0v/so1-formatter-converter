/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { languageFromFileName } from './languages';

describe('languageFromFileName', () => {
  it('берёт язык из расширения', () => {
    expect(languageFromFileName('config.YAML')).toBe('yaml');
    expect(languageFromFileName('notes/readme.md')).toBe('markdown');
    expect(languageFromFileName('C:\\dump\\query.sql')).toBe('sql');
  });

  it('возвращает null, если расширения нет или оно неизвестно', () => {
    expect(languageFromFileName('Makefile')).toBeNull();
    expect(languageFromFileName('.gitignore')).toBeNull();
    expect(languageFromFileName('archive.tar.gz')).toBeNull();
    expect(languageFromFileName('data.bin')).toBeNull();
  });
});
