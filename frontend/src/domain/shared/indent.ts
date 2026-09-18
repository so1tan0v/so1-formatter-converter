export const INDENT_STYLES = [
  '1-space',
  '2-space',
  '3-space',
  '4-space',
  'tab',
] as const;

export type IndentStyle = (typeof INDENT_STYLES)[number];

export const INDENT_STYLE_LABELS: Record<IndentStyle, string> = {
  '1-space': '1 space',
  '2-space': '2 spaces',
  '3-space': '3 spaces',
  '4-space': '4 spaces',
  tab: 'tab',
};

export function indentString(style: IndentStyle): string {
  switch (style) {
    case '1-space':
      return ' ';
    case '2-space':
      return '  ';
    case '3-space':
      return '   ';
    case '4-space':
      return '    ';
    case 'tab':
      return '\t';
  }
}

export function indentUnit(style: IndentStyle, depth: number): string {
  return indentString(style).repeat(depth);
}
