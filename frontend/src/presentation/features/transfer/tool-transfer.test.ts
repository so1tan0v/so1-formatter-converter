/**
 * Imports from packages
 */
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * Imports from domain
 */
import { defaultOptionsFor } from '@domain/formatter/types';

/**
 * Imports from infrastructure
 */
import { createFormatterRegistry } from '@infrastructure/formatters/registry';

/**
 * Imports from presentation
 */
import { optionDefaults } from '@presentation/features/formatter/formatter-form';
import { saveFormatterOptions } from '@presentation/features/formatter/formatter-options';

/**
 * Imports from relative
 */
import {
  formatWithSavedOptions,
  formatterIdForDifferLanguage,
  preservedViewerOutput,
  readFormatterHandoff,
  readViewerHandoff,
  replaceDifferSide,
} from './tool-transfer';

const DIFFER_DRAFT = {
  original: '{a:1}',
  modified: 'a: 1',
  language: 'json5' as const,
  originalName: 'before.json5',
  modifiedName: 'after.yaml',
};

describe('formatterIdForDifferLanguage', () => {
  it('связывает язык сравнения с форматтером', () => {
    expect(formatterIdForDifferLanguage('json5')).toBe('json');
    expect(formatterIdForDifferLanguage('xml')).toBe('xml');
    expect(formatterIdForDifferLanguage('markdown')).toBeNull();
  });
});

describe('readFormatterHandoff', () => {
  it('принимает текст того же форматтера', () => {
    expect(
      readFormatterHandoff(
        {
          formatterHandoff: {
            formatterId: 'yaml',
            source: 'a: 1',
            from: { tool: 'differ', side: 'modified', draft: DIFFER_DRAFT },
          },
        },
        'yaml',
      ),
    ).toEqual({
      formatterId: 'yaml',
      source: 'a: 1',
      from: { tool: 'differ', side: 'modified', draft: DIFFER_DRAFT },
    });
  });

  it('отбрасывает чужой форматтер и битое состояние', () => {
    expect(
      readFormatterHandoff(
        {
          formatterHandoff: {
            formatterId: 'json',
            source: '{}',
            from: { tool: 'viewer', viewerId: 'markdown' },
          },
        },
        'xml',
      ),
    ).toBeNull();
    expect(readFormatterHandoff(null, 'json')).toBeNull();
    expect(
      readFormatterHandoff(
        {
          formatterHandoff: {
            formatterId: 'yaml',
            source: 'a: 1',
            from: { tool: 'differ', side: 'modified' },
          },
        },
        'yaml',
      ),
    ).toBeNull();
  });
});

describe('replaceDifferSide', () => {
  it('подставляет результат в выбранную сторону и сохраняет язык', () => {
    expect(
      replaceDifferSide(DIFFER_DRAFT, 'original', '{\n  "a": 1\n}'),
    ).toEqual({
      ...DIFFER_DRAFT,
      original: '{\n  "a": 1\n}',
    });
  });
});

describe('preservedViewerOutput', () => {
  it('оставляет готовый предпросмотр того же текста', () => {
    expect(
      preservedViewerOutput(
        [{ source: '# Hi\n', output: '<h1>Hi</h1>' }],
        '# Hi\n',
      ),
    ).toBe('<h1>Hi</h1>');
  });

  it('не подставляет чужой предпросмотр', () => {
    expect(
      preservedViewerOutput(
        [{ source: '# Hi', output: '<h1>Hi</h1>' }],
        '# Bye',
      ),
    ).toBe('');
  });
});

describe('readViewerHandoff', () => {
  it('возвращает текст текущего просмотрщика', () => {
    expect(
      readViewerHandoff(
        { viewerHandoff: { viewerId: 'jira', source: 'h1. Hi' } },
        'jira',
      ),
    ).toBe('h1. Hi');
    expect(
      readViewerHandoff(
        { viewerHandoff: { viewerId: 'jira', source: 'h1. Hi' } },
        'markdown',
      ),
    ).toBeNull();
  });
});

describe('formatWithSavedOptions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('форматирует текст настройками по умолчанию', () => {
    const result = formatWithSavedOptions(
      createFormatterRegistry(),
      'json',
      "{key: 'Value'}",
    );

    expect(result).toEqual({
      ok: true,
      value: '{\n  "key": "Value"\n}',
    });
  });

  it('не подменяет текст, который не разбирается', () => {
    const result = formatWithSavedOptions(
      createFormatterRegistry(),
      'json',
      '# Release notes',
    );

    expect(result.ok).toBe(false);
  });

  it('не вырезает JSON по сохранённому пути', () => {
    const bag = new Map<string, string>();

    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => bag.get(key) ?? null,
        setItem: (key: string, value: string) => {
          bag.set(key, value);
        },
      },
    });
    saveFormatterOptions('json', {
      ...optionDefaults(defaultOptionsFor('json')),
      query: 'user.name',
    });

    const result = formatWithSavedOptions(
      createFormatterRegistry(),
      'json',
      '{"user":{"name":"Ada"}}',
    );

    expect(result).toEqual({
      ok: true,
      value: '{\n  "user": {\n    "name": "Ada"\n  }\n}',
    });
  });
});
