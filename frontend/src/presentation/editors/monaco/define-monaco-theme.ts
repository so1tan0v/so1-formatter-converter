import type { Monaco } from '@monaco-editor/react';

import type { AppTheme } from '@presentation/theme/types';

export const MONACO_THEME_NAME = 'app-ui';

export function defineMonacoTheme(monaco: Monaco, theme: AppTheme): void {
  monaco.editor.defineTheme(MONACO_THEME_NAME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      {
        token: 'comment',
        foreground: hex(theme.tokens.fgMuted),
        fontStyle: 'italic',
      },
      { token: 'string', foreground: hex(theme.tokens.accent) },
      { token: 'keyword', foreground: hex(theme.tokens.warn) },
      { token: 'number', foreground: hex(theme.tokens.label) },
      { token: 'type', foreground: hex(theme.tokens.label) },
      { token: 'identifier', foreground: hex(theme.tokens.fg) },
      { token: 'delimiter', foreground: hex(theme.tokens.fgMuted) },
    ],
    colors: {
      'editor.background': theme.tokens.bg,
      'editor.foreground': theme.tokens.fg,
      'editorCursor.foreground': theme.tokens.accent,
      'editorLineNumber.foreground': theme.tokens.fgMuted,
      'editorLineNumber.activeForeground': theme.tokens.label,
      'editor.selectionBackground': `${theme.tokens.accentDim}99`,
      'editor.inactiveSelectionBackground': `${theme.tokens.accentDim}55`,
      'editor.lineHighlightBackground': '#ffffff08',
      'editorGutter.background': theme.tokens.bg,
      'editorWidget.background': theme.tokens.chrome,
      'editorWidget.border': theme.tokens.border,
      'editorSuggestWidget.background': theme.tokens.chrome,
      'editorSuggestWidget.border': theme.tokens.border,
      'editorSuggestWidget.foreground': theme.tokens.fg,
      'editorSuggestWidget.selectedBackground': theme.tokens.accentDim,
      'input.background': theme.tokens.bg,
      'input.foreground': theme.tokens.fg,
      'input.border': theme.tokens.border,
      focusBorder: '#00000000',
      'scrollbarSlider.background': `${theme.tokens.accentDim}88`,
      'scrollbarSlider.hoverBackground': theme.tokens.accentDim,
      'editorBracketMatch.border': theme.tokens.accent,
    },
  });
}

function hex(value: string): string {
  return value.replace('#', '');
}
