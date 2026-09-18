import { terminalTheme } from '@presentation/theme/themes/terminal';
import type { AppTheme } from '@presentation/theme/types';

export const themes: AppTheme[] = [terminalTheme];

export const defaultTheme = terminalTheme;

export function getTheme(id: string): AppTheme {
  return themes.find((theme) => theme.id === id) ?? defaultTheme;
}
