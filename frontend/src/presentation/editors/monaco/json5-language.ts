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
    defaultToken: '',
    tokenPostfix: '.json5',
    tokenizer: {
      root: [
        { include: '@whitespace' },
        { include: '@comments' },
        [/[{}[\]]/, 'delimiter.bracket'],
        [/[,:]/, 'delimiter'],
        [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/, 'number'],
        [/\b(?:true|false|null|undefined|NaN|Infinity)\b/, 'keyword'],
        [/"/, 'string', '@stringDouble'],
        [/'/, 'string', '@stringSingle'],
        [/[A-Za-z_][\w]*/, 'type'],
      ],
      whitespace: [[/[ \t\r\n]+/, 'white']],
      comments: [
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@commentBody'],
      ],
      commentBody: [
        [/[^/*]+/, 'comment'],
        [/\*\//, 'comment', '@pop'],
        [/./, 'comment'],
      ],
      stringDouble: [
        [/[^\\"]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      stringSingle: [
        [/[^\\']+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration('json5', {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/'],
    },
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
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
  });
}
