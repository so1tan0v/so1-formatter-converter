/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { defaultOptionsFor } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { optionDefaults } from './formatter-form';
import { overlayFormatterOptions } from './formatter-options';

describe('overlayFormatterOptions', () => {
  it('оставляет значения по умолчанию, если записи нет', () => {
    expect(overlayFormatterOptions('yaml', null)).toEqual(
      optionDefaults(defaultOptionsFor('yaml')),
    );
  });

  it('подставляет только известные поля и числа из строк', () => {
    const options = overlayFormatterOptions('yaml', {
      yaml: { keyCase: 'camel', lineWidth: '40', unknown: true, mode: 1 },
    });

    expect(options.keyCase).toBe('camel');
    expect(options.lineWidth).toBe(40);
    expect(options.mode).toBe('pretty');
  });

  it('не переносит настройки другого типа', () => {
    const options = overlayFormatterOptions('sql', {
      json: { keywordCase: 'lower' },
    });

    expect(options.keywordCase).toBe('upper');
  });
});
