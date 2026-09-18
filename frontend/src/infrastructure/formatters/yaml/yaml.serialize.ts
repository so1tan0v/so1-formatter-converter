import YAML from 'js-yaml';

import type { YamlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';

export function serializeYaml(
  value: unknown,
  options: YamlFormatOptions,
): string {
  const dumped = YAML.dump(value, {
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
