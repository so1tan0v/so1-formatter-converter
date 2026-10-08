/**
 * Imports from packages
 */
import hljs from 'highlight.js/lib/core';
import bash from 'highlight.js/lib/languages/bash';
import go from 'highlight.js/lib/languages/go';
import javascript from 'highlight.js/lib/languages/javascript';
import json from 'highlight.js/lib/languages/json';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('go', go);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('xml', xml);

const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  html: 'xml',
  golang: 'go',
};

/**
 * Подсвечивает исходник fenced-блока
 *
 * @param source Текст блока
 * @param language Язык из метки блока
 */
export function highlightFence(source: string, language?: string): string {
  const resolved = resolveLanguage(language);

  if (!resolved) {
    return escapeHtml(source);
  }

  return hljs.highlight(source, { language: resolved }).value;
}

function resolveLanguage(language?: string): string | undefined {
  const normalized = language?.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  const resolved = ALIASES[normalized] ?? normalized;

  return hljs.getLanguage(resolved) ? resolved : undefined;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
