import type { ConverterRegistry } from '@application/convert-text';
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterId } from '@domain/converter/types';
import { failure } from '@domain/shared/result';

import { MarkdownJiraConverter } from './markdown-jira/markdown-jira.converter';

const PLACEHOLDERS: TextConverter[] = [
  {
    id: 'json-yaml',
    label: 'JSON ↔ YAML',
    available: false,
    convert: () => failure('JSON ↔ YAML converter is not available yet'),
  },
  {
    id: 'json-sql',
    label: 'JSON ↔ SQL',
    available: false,
    convert: () => failure('JSON ↔ SQL converter is not available yet'),
  },
];

export function createConverterRegistry(): ConverterRegistry {
  const converters: TextConverter[] = [
    new MarkdownJiraConverter(),
    ...PLACEHOLDERS,
  ];
  const byId = new Map(
    converters.map((converter) => [converter.id, converter]),
  );

  return {
    list: () => converters,
    get: (id: ConverterId) => byId.get(id),
  };
}
