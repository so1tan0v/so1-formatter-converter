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

  it('pretty prints an incomplete mapping instead of failing', () => {
    const result = formatter.format(
      '{"name": "tonus", "enabled": tru',
      DEFAULT_YAML_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toContain('"name": "tonus"');
      expect(result.value).toContain('"enabled": tru');
    }
  });

  it('переводит ключи из snake_case в CamelCase и обратно', () => {
    const toCamel = formatter.format(
      'user_name: Ada\nprofile:\n  api_key: 1\n',
      {
        ...DEFAULT_YAML_OPTIONS,
        keyCase: 'camel',
      },
    );
    const toPascal = formatter.format('user_name: Ada\n', {
      ...DEFAULT_YAML_OPTIONS,
      keyCase: 'pascal',
    });
    const toSnake = formatter.format('userName: Ada\nHTMLParser: true\n', {
      ...DEFAULT_YAML_OPTIONS,
      keyCase: 'snake',
    });

    expect(toCamel.ok && toCamel.value).toBe(
      'userName: Ada\nprofile:\n  apiKey: 1',
    );
    expect(toPascal.ok && toPascal.value).toBe('UserName: Ada');
    expect(toSnake.ok && toSnake.value).toBe(
      'user_name: Ada\nhtml_parser: true',
    );
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
