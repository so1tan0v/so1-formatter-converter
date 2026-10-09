/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from infrastructure
 */
import { createFormatterRegistry } from '@infrastructure/formatters/registry';

/**
 * Imports from relative
 */
import {
  formatWithSavedOptions,
  formatterIdForDifferLanguage,
  readFormatterHandoff,
  readViewerHandoff,
} from './tool-transfer';

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
            from: { tool: 'differ', side: 'modified' },
          },
        },
        'yaml',
      ),
    ).toEqual({
      formatterId: 'yaml',
      source: 'a: 1',
      from: { tool: 'differ', side: 'modified' },
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
});
