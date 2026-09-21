/**
 * Imports from presentation
 */
import {
  isConverterColorScheme,
  type ConverterColorScheme,
} from '@presentation/embed/protocol';
import { THEME_ID_DARK, THEME_ID_LIGHT } from '@presentation/theme/catalog';

export interface BootAppearance {
  isEmbed: boolean;
  themeId: string;
  scheme: ConverterColorScheme | null;
}

/**
 * Возвращает идентификатор темы приложения по схеме родителя
 *
 * @param scheme Светлая или тёмная схема
 */
export function themeIdFromScheme(scheme: ConverterColorScheme): string {
  return scheme === 'light' ? THEME_ID_LIGHT : THEME_ID_DARK;
}

/**
 * Читает флаги встраивания и темы из query-строки
 *
 * @param search Search-часть URL, включая '?' или без неё
 */
export function readBootAppearance(search: string): BootAppearance {
  const params = new URLSearchParams(
    search.startsWith('?') ? search.slice(1) : search,
  );
  const embedValue = params.get('embed');
  const isEmbed = embedValue === '1' || embedValue === 'true';
  const themeParam = params.get('theme');
  const scheme = isConverterColorScheme(themeParam) ? themeParam : null;

  return {
    isEmbed,
    scheme,
    themeId: scheme ? themeIdFromScheme(scheme) : THEME_ID_DARK,
  };
}

/**
 * Применяет data-атрибут встраивания к корневому элементу документа
 *
 * @param isEmbed Признак iframe-режима
 */
export function applyEmbedFlag(isEmbed: boolean): void {
  const root = document.documentElement;

  if (isEmbed) {
    root.dataset.embed = 'true';

    return;
  }

  delete root.dataset.embed;
}

/**
 * Возвращает, открыто ли приложение во встроенном режиме
 */
export function readEmbedFlag(): boolean {
  return document.documentElement.dataset.embed === 'true';
}
