/**
 * Imports from packages
 */
import { useContext } from 'react';

/**
 * Imports from presentation
 */
import {
  ThemeContext,
  type ThemeContextValue,
} from '@presentation/theme/theme-context';

/**
 * Возвращает текущую тему и список доступных тем
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return context;
}
