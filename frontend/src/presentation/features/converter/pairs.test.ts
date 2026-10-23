/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { CONVERTER_GROUPS } from './converter-groups';
import {
  CONVERTER_PAIRS,
  oppositeConverter,
  pairForConverter,
  readConverterHandoff,
} from './pairs';

describe('converter pairs', () => {
  it('находит обратное направление', () => {
    expect(oppositeConverter('json-yaml')).toBe('yaml-json');
    expect(oppositeConverter('yaml-json')).toBe('json-yaml');
    expect(pairForConverter('markdown-html')?.label).toBe('Markdown ↔ HTML');
    expect(oppositeConverter('json-excel')).toBe('excel-json');
    expect(oppositeConverter('excel-json')).toBe('json-excel');
    expect(pairForConverter('json-excel')?.label).toBe('JSON ↔ Excel');
    const grouped = CONVERTER_GROUPS.flatMap((group) =>
      group.pairs.map((pair) => pair.forward),
    );

    expect(grouped).toEqual([
      'json-yaml',
      'json-excel',
      'json-sql',
      'markdown-html',
      'markdown-jira',
    ]);
    expect([...grouped].sort()).toEqual(
      CONVERTER_PAIRS.map((pair) => pair.forward).sort(),
    );
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
