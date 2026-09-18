/**
 * Imports from presentation
 */
import { terminalTheme } from '@presentation/theme/themes/terminal';
import type { AppTheme } from '@presentation/theme/types';

/**
 * Каталог доступных тем
 */
export const themes: AppTheme[] = [terminalTheme];

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
