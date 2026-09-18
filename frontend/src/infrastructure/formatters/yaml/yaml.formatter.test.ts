/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { DEFAULT_YAML_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { YamlFormatter } from './yaml.formatter';

const formatter = new YamlFormatter();

describe('YamlFormatter', () => {
  it('pretty prints yaml from a js object literal', () => {
    const result = formatter.format(
      "{name: 'tonus', enabled: true}",
      DEFAULT_YAML_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('name: tonus\nenabled: true');
    }
  });

  it('prints a compact flow document', () => {
    const result = formatter.format('name: tonus\nenabled: true', {
      ...DEFAULT_YAML_OPTIONS,
      mode: 'compact',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('{name: tonus, enabled: true}');
    }
  });

  it('escapes yaml as a json string', () => {
    const result = formatter.format('key: value', {
      ...DEFAULT_YAML_OPTIONS,
      mode: 'escaped',
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('"{key: value}"');
    }
  });

  it('can sort keys and add a document start marker', () => {
    const result = formatter.format('b: 2\na: 1', {
      ...DEFAULT_YAML_OPTIONS,
      sortKeys: true,
      documentStart: true,
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('---\na: 1\nb: 2');
    }
  });
});
