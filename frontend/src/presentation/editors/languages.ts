import type { FormatterId } from '@domain/formatter/types';

export type EditorLanguage =
  | 'json'
  | 'json5'
  | 'yaml'
  | 'sql'
  | 'markdown'
  | 'plaintext';

export function inputLanguageFor(id: FormatterId): EditorLanguage {
  switch (id) {
    case 'json':
      return 'json5';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
  }
}

export function outputLanguageFor(
  id: FormatterId,
  hasError: boolean,
): EditorLanguage {
  if (hasError) {
    return 'plaintext';
  }

  switch (id) {
    case 'json':
      return 'json';
    case 'yaml':
      return 'yaml';
    case 'sql':
      return 'sql';
  }
}
