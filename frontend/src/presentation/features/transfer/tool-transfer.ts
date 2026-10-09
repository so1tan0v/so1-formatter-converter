/**
 * Imports from application
 */
import { formatText } from '@application/format-text';
import type { FormatterRegistry } from '@application/format-text';

/**
 * Imports from domain
 */
import { FORMATTER_IDS } from '@domain/formatter/types';
import type { FormatterId } from '@domain/formatter/types';
import { failure, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';
import { VIEWER_IDS } from '@domain/viewer/types';
import type { ViewerId } from '@domain/viewer/types';

/**
 * Imports from infrastructure
 */
import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';
import { parseLooseYaml } from '@infrastructure/formatters/yaml/yaml.parser';

/**
 * Imports from presentation
 */
import type { DifferDraft } from '@presentation/features/differ/differ-draft';
import {
  isDifferLanguage,
  type DifferLanguage,
} from '@presentation/features/differ/languages';
import { toFormatterOptions } from '@presentation/features/formatter/formatter-form';
import { loadFormatterOptions } from '@presentation/features/formatter/formatter-options';

const FAST_FORMATTER_KEY = 'so1-fmt.fast-formatter.v1';

export type TransferSide = 'original' | 'modified';

export interface FormatterHandoff {
  formatterId: FormatterId;
  source: string;
  from:
    | { tool: 'viewer'; viewerId: ViewerId }
    | { tool: 'differ'; side: TransferSide; draft: DifferDraft };
}

export interface ViewerHandoff {
  viewerId: ViewerId;
  source: string;
}

/**
 * Подбирает форматтер для языка подсветки Differ
 *
 * @param language Язык сравнения
 */
export function formatterIdForDifferLanguage(
  language: DifferLanguage,
): FormatterId | null {
  if (language === 'json' || language === 'json5') {
    return 'json';
  }

  if (
    language === 'yaml' ||
    language === 'sql' ||
    language === 'html' ||
    language === 'xml'
  ) {
    return language;
  }

  return null;
}

/**
 * Читает последний форматтер для кнопки Fast
 */
export function readFastFormatterId(): FormatterId {
  try {
    const raw = window.localStorage.getItem(FAST_FORMATTER_KEY);

    if (FORMATTER_IDS.some((id) => id === raw)) {
      return raw as FormatterId;
    }
  } catch {
    return 'json';
  }

  return 'json';
}

/**
 * Запоминает форматтер для кнопки Fast
 *
 * @param id Идентификатор форматтера
 */
export function writeFastFormatterId(id: FormatterId): void {
  try {
    window.localStorage.setItem(FAST_FORMATTER_KEY, id);
  } catch {
    return;
  }
}

/**
 * Читает текст, переданный в форматтер из Viewer или Differ
 *
 * @param state Состояние навигации
 * @param formatterId Форматтер, который сейчас открыт
 */
export function readFormatterHandoff(
  state: unknown,
  formatterId: FormatterId,
): FormatterHandoff | null {
  const handoff = readRecord(state)?.formatterHandoff;

  if (!isFormatterHandoff(handoff) || handoff.formatterId !== formatterId) {
    return null;
  }

  return handoff;
}

/**
 * Подставляет отформатированный текст в сторону, с которой открыли форматтер
 *
 * @param draft Черновик сравнения на момент перехода
 * @param side Сторона, которую форматировали
 * @param formatted Результат форматтера
 */
export function replaceDifferSide(
  draft: DifferDraft,
  side: TransferSide,
  formatted: string,
): DifferDraft {
  if (side === 'original') {
    return { ...draft, original: formatted };
  }

  return { ...draft, modified: formatted };
}

/**
 * Оставляет уже сохранённый предпросмотр, если в историю попадает тот же текст
 *
 * @param entries Записи просмотрщика
 * @param source Текст, который уходит в просмотрщик
 */
export function preservedViewerOutput(
  entries: readonly { source: string; output: string }[],
  source: string,
): string {
  const trimmed = source.trim();
  const previous = entries.find((entry) => entry.source.trim() === trimmed);

  return previous?.output ?? '';
}

/**
 * Читает текст, переданный в просмотрщик
 *
 * @param state Состояние навигации
 * @param viewerId Просмотрщик, который сейчас открыт
 */
export function readViewerHandoff(
  state: unknown,
  viewerId: ViewerId,
): string | null {
  const handoff = readRecord(state)?.viewerHandoff;

  if (!isViewerHandoff(handoff) || handoff.viewerId !== viewerId) {
    return null;
  }

  return handoff.source;
}

/**
 * Форматирует текст сохранёнными настройками форматтера
 *
 * @param registry Реестр форматтеров
 * @param id Идентификатор форматтера
 * @param source Исходный текст
 */
export function formatWithSavedOptions(
  registry: FormatterRegistry,
  id: FormatterId,
  source: string,
): Result<string> {
  const problem = strictParseError(id, source);

  if (problem) {
    return failure(problem);
  }

  // JSONPath из настроек вырезал бы значение, а Fast должен оставить документ.
  const saved = {
    ...loadFormatterOptions(id),
    query: '',
  };
  const options = toFormatterOptions(id, {
    source,
    ...saved,
  });

  return formatText(registry, id, source, options);
}

function strictParseError(id: FormatterId, source: string): string | null {
  if (id !== 'json' && id !== 'yaml') {
    return null;
  }

  try {
    if (id === 'json') {
      parseLooseJson(source);
    } else {
      parseLooseYaml(source);
    }

    return null;
  } catch (error) {
    return toErrorMessage(error);
  }
}

function readRecord(state: unknown): Record<string, unknown> | null {
  if (typeof state !== 'object' || state === null) {
    return null;
  }

  return state as Record<string, unknown>;
}

function isFormatterHandoff(value: unknown): value is FormatterHandoff {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  const from = record.from;

  if (
    !FORMATTER_IDS.some((id) => id === record.formatterId) ||
    typeof record.source !== 'string' ||
    typeof from !== 'object' ||
    from === null
  ) {
    return false;
  }

  const origin = from as Record<string, unknown>;

  if (origin.tool === 'viewer') {
    return isViewerId(origin.viewerId);
  }

  return (
    origin.tool === 'differ' &&
    (origin.side === 'original' || origin.side === 'modified') &&
    isDifferDraft(origin.draft)
  );
}

function isViewerHandoff(value: unknown): value is ViewerHandoff {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return isViewerId(record.viewerId) && typeof record.source === 'string';
}

function isViewerId(value: unknown): value is ViewerId {
  return VIEWER_IDS.some((id) => id === value);
}

function isDifferDraft(value: unknown): value is DifferDraft {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    typeof record.original === 'string' &&
    typeof record.modified === 'string' &&
    isDifferLanguage(record.language) &&
    typeof record.originalName === 'string' &&
    typeof record.modifiedName === 'string'
  );
}
