/**
 * Imports from relative
 */
import { isDifferLanguage } from './languages';
import type { DifferLanguage } from './languages';

export const DIFFER_DRAFT_KEY = 'so1-fmt.differ.v1';

export interface DifferDraft {
  original: string;
  modified: string;
  language: DifferLanguage;
  originalName: string;
  modifiedName: string;
}

/**
 * Читает сохранённый черновик сравнения
 *
 * @param raw JSON из localStorage или null, если записи нет
 */
export function parseDifferDraft(raw: string | null): DifferDraft | null {
  if (!raw) {
    return null;
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!isDraftRecord(value)) {
      return null;
    }

    return {
      original: value.original,
      modified: value.modified,
      language: isDifferLanguage(value.language) ? value.language : 'plaintext',
      originalName:
        typeof value.originalName === 'string' && value.originalName
          ? value.originalName
          : 'text',
      modifiedName:
        typeof value.modifiedName === 'string' && value.modifiedName
          ? value.modifiedName
          : 'text',
    };
  } catch {
    return null;
  }
}

function isDraftRecord(value: unknown): value is {
  original: string;
  modified: string;
  language?: unknown;
  originalName?: unknown;
  modifiedName?: unknown;
} {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.original === 'string' && typeof record.modified === 'string'
  );
}
