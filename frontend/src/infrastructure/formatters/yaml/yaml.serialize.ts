/**
 * Imports from packages
 */
import YAML from 'js-yaml';

/**
 * Imports from domain
 */
import type { JsonKeyCase, YamlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';

/**
 * Imports from infrastructure
 */
import { convertJsonKey } from '@infrastructure/formatters/json/json.keys';

/**
 * Сериализует значение в YAML-строку по выбранным настройкам
 *
 * @param value Разобранное YAML-значение
 * @param options Настройки форматирования YAML
 */
export function serializeYaml(
  value: unknown,
  options: YamlFormatOptions,
): string {
  const dumped = YAML.dump(renameYamlKeys(value, options.keyCase), {
    indent:
      indentString(options.indent) === '\t'
        ? 2
        : indentString(options.indent).length,
    lineWidth: options.mode === 'compact' ? -1 : options.lineWidth,
    sortKeys: options.sortKeys,
    quotingType: options.quoting === 'single' ? "'" : '"',
    forceQuotes: options.forceQuotes || options.quoting !== 'auto',
    noRefs: true,
    flowLevel: options.mode === 'pretty' ? -1 : 0,
    styles: {
      '!!null': nullStyleToYaml(options.nullStyle),
    },
  }).replace(/\n$/, '');

  const withDocument = applyDocumentMarkers(
    dumped,
    options.documentStart,
    options.documentEnd,
  );

  if (options.mode === 'escaped') {
    return JSON.stringify(withDocument);
  }

  return withDocument;
}

function renameYamlKeys(value: unknown, keyCase: JsonKeyCase): unknown {
  if (keyCase === 'as-is' || value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date || value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => renameYamlKeys(item, keyCase));
  }

  const next: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    next[convertJsonKey(key, keyCase)] = renameYamlKeys(item, keyCase);
  }

  return next;
}

function nullStyleToYaml(
  style: YamlFormatOptions['nullStyle'],
): 'lowercase' | 'canonical' | 'empty' {
  switch (style) {
    case 'null':
      return 'lowercase';
    case 'tilde':
      return 'canonical';
    case 'empty':
      return 'empty';
  }
}

function applyDocumentMarkers(
  text: string,
  documentStart: boolean,
  documentEnd: boolean,
): string {
  let output = text;

  if (documentStart && !output.startsWith('---')) {
    output = `---\n${output}`;
  }

  if (documentEnd && !output.endsWith('...')) {
    output = `${output}\n...`;
  }

  return output;
}
