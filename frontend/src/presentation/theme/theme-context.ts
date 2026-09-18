import { createContext } from 'react';

import type { AppTheme } from '@presentation/theme/types';

export interface ThemeContextValue {
  theme: AppTheme;
  themes: AppTheme[];
  setThemeId: (id: string) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
