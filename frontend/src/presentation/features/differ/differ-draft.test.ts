/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { parseDifferDraft } from './differ-draft';

describe('parseDifferDraft', () => {
  it('восстанавливает черновик', () => {
    expect(
      parseDifferDraft(
        JSON.stringify({
          original: 'a',
          modified: 'b',
          language: 'sql',
          originalName: 'old.sql',
          modifiedName: 'new.sql',
        }),
      ),
    ).toEqual({
      original: 'a',
      modified: 'b',
      language: 'sql',
      originalName: 'old.sql',
      modifiedName: 'new.sql',
    });
  });

  it('отбрасывает пустое и битое значение', () => {
    expect(parseDifferDraft(null)).toBeNull();
    expect(parseDifferDraft('{')).toBeNull();
    expect(parseDifferDraft('{"original":1}')).toBeNull();
  });

  it('подставляет text, если язык или имена неизвестны', () => {
    expect(
      parseDifferDraft(
        JSON.stringify({
          original: 'a',
          modified: 'b',
          language: 'brainfuck',
        }),
      ),
    ).toEqual({
      original: 'a',
      modified: 'b',
      language: 'plaintext',
      originalName: 'text',
      modifiedName: 'text',
    });
  });
});
