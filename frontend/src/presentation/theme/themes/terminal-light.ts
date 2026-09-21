/**
 * Imports from presentation
 */
import type { AppTheme } from '@presentation/theme/types';

/**
 * Светлая терминальная тема, согласованная с визиткой
 */
export const terminalLightTheme: AppTheme = {
  id: 'terminal-light',
  name: 'Terminal Light',
  colorScheme: 'light',
  tokens: {
    stage: '#e8e8e8',
    bg: '#fafafa',
    bgElevated: '#ffffff',
    fg: '#1e1e1e',
    fgMuted: '#6b7280',
    accent: '#3d8c40',
    accentDim: '#d7ead8',
    label: '#2b6cb0',
    warn: '#b7791f',
    inverseBg: '#3d8c40',
    inverseFg: '#fafafa',
    border: '#d0d4dc',
    danger: '#c53030',
    chrome: '#e0e0e0',
    fontMono: '"IBM Plex Mono", "Ubuntu Mono", ui-monospace, monospace',
    fontSize: '13px',
    radius: '0px',
    scanlineOpacity: '0.02',
  },
  decorations: {
    asciiFrames: true,
    scanlines: false,
    crtGlow: false,
    windowChrome: true,
  },
};
