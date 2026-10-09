/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import {
  oppositeConverter,
  pairForConverter,
  readConverterHandoff,
} from './pairs';

describe('converter pairs', () => {
  it('находит обратное направление', () => {
    expect(oppositeConverter('json-yaml')).toBe('yaml-json');
    expect(oppositeConverter('yaml-json')).toBe('json-yaml');
    expect(pairForConverter('markdown-html')?.label).toBe('Markdown ↔ HTML');
  });

  it('принимает текст только для того конвертера, которому его передали', () => {
    expect(
      readConverterHandoff(
        { converterId: 'yaml-json', source: 'a: 1' },
        'yaml-json',
      ),
    ).toBe('a: 1');
    expect(
      readConverterHandoff(
        { converterId: 'yaml-json', source: 'a: 1' },
        'json-yaml',
      ),
    ).toBeNull();
  });
});
