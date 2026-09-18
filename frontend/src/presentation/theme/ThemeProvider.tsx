/**
 * Imports from packages
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Imports from presentation
 */
import { applyTheme } from '@presentation/theme/apply-theme';
import { defaultTheme, getTheme, themes } from '@presentation/theme/catalog';
import { ThemeContext } from '@presentation/theme/theme-context';

interface ThemeProviderProps {
  children: ReactNode;
  initialThemeId?: string;
}

/**
 * Провайдер темы приложения
 *
 * @param children Дочерние элементы, которым нужна тема
 * @param initialThemeId Необязательный идентификатор стартовой темы
 */
export function ThemeProvider({
  children,
  initialThemeId,
}: ThemeProviderProps) {
  const [themeId, setThemeId] = useState(initialThemeId ?? defaultTheme.id);
  const theme = useMemo(() => getTheme(themeId), [themeId]);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      themes,
      setThemeId,
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
