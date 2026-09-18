/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { DEFAULT_JSON_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { JsonFormatter } from './json.formatter';

const formatter = new JsonFormatter();

describe('JsonFormatter', () => {
  it('accepts javascript object literals', () => {
    const result = formatter.format("{key: 'Value'}", DEFAULT_JSON_OPTIONS);

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{\n  "key": "Value"\n}');
    }
  });

  it('formats compact json with spaces after colons', () => {
    const result = formatter.format('{key: "value"}', {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'compact',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{"key": "value"}');
    }
  });

  it('escapes compact json as a string', () => {
    const result = formatter.format('{key: "value"}', {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'escaped',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('"{\\"key\\": \\"value\\"}"');
    }
  });

  it('uses tab indentation when requested', () => {
    const result = formatter.format('{key: 1}', {
      ...DEFAULT_JSON_OPTIONS,
      indent: 'tab',
      mode: 'pretty',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{\n\t"key": 1\n}');
    }
  });

  it('rejects empty input', () => {
    const result = formatter.format('   ', DEFAULT_JSON_OPTIONS);

    expect(result.ok).toBe(false);
  });

  it('sorts object keys when requested', () => {
    const result = formatter.format('{zeta: 1, alpha: 2}', {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'compact',
      sortKeys: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{"alpha": 2, "zeta": 1}');
    }
  });

  it('drops null object fields when requested', () => {
    const result = formatter.format('{keep: 1, empty: null}', {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'compact',
      dropNulls: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{"keep": 1}');
    }
  });

  it('keeps nulls inside arrays when dropping object nulls', () => {
    const result = formatter.format('{list: [1, null]}', {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'compact',
      dropNulls: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{"list": [1, null]}');
    }
  });

  it('escapes non-ascii characters', () => {
    const result = formatter.format("{msg: 'Привет'}", {
      ...DEFAULT_JSON_OPTIONS,
      mode: 'compact',
      escapeUnicode: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(
        '{"msg": "\\u041f\\u0440\\u0438\\u0432\\u0435\\u0442"}',
      );
    }
  });

  it('appends a trailing newline when requested', () => {
    const result = formatter.format('{key: 1}', {
      ...DEFAULT_JSON_OPTIONS,
      trailingNewline: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{\n  "key": 1\n}\n');
    }
  });
});
