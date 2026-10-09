/**
 * Imports from domain
 */
import { defaultOptionsFor } from '@domain/formatter/types';
import type { FormatterId } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { optionDefaults } from './formatter-form';
import type { FormatterOptionValues } from './formatter-form';

const STORAGE_KEY = 'so1-fmt.formatter-options.v1';

/**
 * Накладывает сохраненные настройки на значения по умолчанию
 *
 * @param id Идентификатор форматтера
 * @param bag Разобранный JSON из хранилища
 */
export function overlayFormatterOptions(
  id: FormatterId,
  bag: unknown,
): FormatterOptionValues {
  const defaults = optionDefaults(defaultOptionsFor(id));

  if (!isRecord(bag) || !isRecord(bag[id])) {
    return defaults;
  }

  const saved = bag[id];
  const next = { ...defaults };

  for (const key of Object.keys(defaults) as (keyof FormatterOptionValues)[]) {
    const value = saved[key];

    if (typeof defaults[key] === 'number') {
      const numeric = Number(value);

      if (Number.isFinite(numeric)) {
        next[key] = numeric as never;
      }

      continue;
    }

    if (typeof value === typeof defaults[key]) {
      next[key] = value as never;
    }
  }

  return next;
}

/**
 * Читает настройки форматтера из localStorage
 *
 * @param id Идентификатор форматтера
 */
export function loadFormatterOptions(id: FormatterId): FormatterOptionValues {
  return overlayFormatterOptions(id, readBag());
}

/**
 * Запоминает настройки форматтера
 *
 * @param id Идентификатор форматтера
 * @param values Текущие поля формы без исходного текста
 */
export function saveFormatterOptions(
  id: FormatterId,
  values: FormatterOptionValues,
): void {
  const bag = readBag();
  const defaults = optionDefaults(defaultOptionsFor(id));
  const next: Record<string, unknown> = {};

  for (const key of Object.keys(defaults)) {
    next[key] = values[key as keyof FormatterOptionValues];
  }

  bag[id] = next;
  writeBag(bag);
}

/**
 * Сбрасывает сохраненные настройки форматтера
 *
 * @param id Идентификатор форматтера
 */
export function clearFormatterOptions(id: FormatterId): void {
  const bag = readBag();

  delete bag[id];
  writeBag(bag);
}

function readBag(): Record<string, unknown> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);

    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeBag(bag: Record<string, unknown>): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bag));
  } catch {
    return;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
