/**
 * Imports from packages
 */
import { createContext } from 'react';

/**
 * Imports from presentation
 */
import type { AppTheme } from '@presentation/theme/types';

export interface ThemeContextValue {
  theme: AppTheme;
  themes: AppTheme[];
  setThemeId: (id: string) => void;
}

/**
 * React-контекст активной темы
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null);
