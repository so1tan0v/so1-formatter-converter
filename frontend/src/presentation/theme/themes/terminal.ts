/**
 * Imports from presentation
 */
import type { AppTheme } from '@presentation/theme/types';

/**
 * Тема терминального интерфейса
 */
export const terminalTheme: AppTheme = {
  id: 'terminal',
  name: 'Terminal',
  colorScheme: 'dark',
  tokens: {
    stage: '#2c2c2e',
    bg: '#191919',
    bgElevated: '#191919',
    fg: '#d5dae4',
    fgMuted: '#8a93a6',
    accent: '#8fbc6b',
    accentDim: '#2a3a22',
    label: '#6ba3d8',
    warn: '#e0a15c',
    inverseBg: '#8fbc6b',
    inverseFg: '#191919',
    border: '#3d4658',
    danger: '#e05d62',
    chrome: '#191919',
    fontMono: '"IBM Plex Mono", "Ubuntu Mono", ui-monospace, monospace',
    fontSize: '13px',
    radius: '0px',
    scanlineOpacity: '0.03',
  },
  decorations: {
    asciiFrames: true,
    scanlines: false,
    crtGlow: false,
    windowChrome: true,
  },
};
