/**
 * Imports from presentation
 */
import type { AppTheme } from '@presentation/theme/types';

const tokenVars: Record<keyof AppTheme['tokens'], string> = {
  bg: '--app-bg',
  bgElevated: '--app-bg-elevated',
  fg: '--app-fg',
  fgMuted: '--app-fg-muted',
  accent: '--app-accent',
  accentDim: '--app-accent-dim',
  label: '--app-label',
  warn: '--app-warn',
  inverseBg: '--app-inverse-bg',
  inverseFg: '--app-inverse-fg',
  border: '--app-border',
  danger: '--app-danger',
  chrome: '--app-chrome',
  fontMono: '--app-font-mono',
  fontSize: '--app-font-size',
  radius: '--app-radius',
  scanlineOpacity: '--app-scanline-opacity',
};

/**
 * Применяет токены темы к корневому элементу документа
 *
 * @param theme Активная тема приложения
 */
export function applyTheme(theme: AppTheme): void {
  const root = document.documentElement;

  root.dataset.theme = theme.id;
  root.dataset.ascii = String(theme.decorations.asciiFrames);
  root.dataset.scanlines = String(theme.decorations.scanlines);
  root.dataset.crt = String(theme.decorations.crtGlow);
  root.dataset.window = String(theme.decorations.windowChrome);

  for (const [token, cssVar] of Object.entries(tokenVars)) {
    root.style.setProperty(
      cssVar,
      theme.tokens[token as keyof AppTheme['tokens']],
    );
  }
}
