/**
 * Imports from packages
 */
import type { Monaco } from '@monaco-editor/react';

/**
 * Регистрирует язык json5 в Monaco для упрощенного JSON
 *
 * @param monaco Экземпляр Monaco
 */
export function registerJson5Language(monaco: Monaco): void {
  const alreadyRegistered = monaco.languages
    .getLanguages()
    .some((language) => language.id === 'json5');

  if (alreadyRegistered) {
    return;
  }

  monaco.languages.register({ id: 'json5' });

  monaco.languages.setMonarchTokensProvider('json5', {
    tokenizer: {
      root: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@comment'],
        [/"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/, 'string'],
        [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number'],
        [/[{}[\]]/, 'delimiter.bracket'],
        [/[,:]/, 'delimiter'],
        [/\b(?:true|false|null|undefined)\b/, 'keyword'],
        [/[A-Za-z_$][\w$]*/, 'type'],
      ],
      comment: [
        [/[^*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('json5', {
    brackets: [
      ['{', '}'],
      ['[', ']'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}
