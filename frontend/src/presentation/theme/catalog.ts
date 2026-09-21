/**
 * Imports from presentation
 */
import { terminalTheme } from '@presentation/theme/themes/terminal';
import { terminalLightTheme } from '@presentation/theme/themes/terminal-light';
import type { AppTheme } from '@presentation/theme/types';

/**
 * Идентификатор тёмной темы
 */
export const THEME_ID_DARK = terminalTheme.id;

/**
 * Идентификатор светлой темы
 */
export const THEME_ID_LIGHT = terminalLightTheme.id;

/**
 * Каталог доступных тем
 */
export const themes: AppTheme[] = [terminalTheme, terminalLightTheme];

/**
 * Тема по умолчанию
 */
export const defaultTheme = terminalTheme;

/**
 * Возвращает тему по идентификатору или тему по умолчанию
 *
 * @param id Идентификатор темы
 */
export function getTheme(id: string): AppTheme {
  return themes.find((theme) => theme.id === id) ?? defaultTheme;
}
