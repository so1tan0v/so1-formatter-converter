export interface ThemeTokens {
  bg: string;
  bgElevated: string;
  fg: string;
  fgMuted: string;
  accent: string;
  accentDim: string;
  label: string;
  warn: string;
  inverseBg: string;
  inverseFg: string;
  border: string;
  danger: string;
  chrome: string;
  fontMono: string;
  fontSize: string;
  radius: string;
  scanlineOpacity: string;
}

export interface ThemeDecorations {
  asciiFrames: boolean;
  scanlines: boolean;
  crtGlow: boolean;
  windowChrome: boolean;
}

export interface AppTheme {
  id: string;
  name: string;
  tokens: ThemeTokens;
  decorations: ThemeDecorations;
}
