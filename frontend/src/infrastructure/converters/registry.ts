/**
 * Imports from application
 */
import type { ConverterRegistry } from '@application/convert-text';

/**
 * Imports from domain
 */
import type { TextConverter } from '@domain/converter/ports';
import type { ConverterId } from '@domain/converter/types';

/**
 * Imports from relative
 */
import { defineConverter } from './define-converter';
import { jsonToYaml } from './json-yaml/json-to-yaml';
import { yamlToJson } from './json-yaml/yaml-to-json';
import { jsonToSql } from './json-sql/json-to-sql';
import { sqlToJson } from './json-sql/sql-to-json';
import { HtmlMarkdownConverter } from './markdown-html/html-markdown.converter';
import { MarkdownHtmlConverter } from './markdown-html/markdown-html.converter';
import { JiraMarkdownConverter } from './markdown-jira/jira-markdown.converter';
import { MarkdownJiraConverter } from './markdown-jira/markdown-jira.converter';

/**
 * Создает реестр конвертеров приложения
 */
export function createConverterRegistry(): ConverterRegistry {
  const converters: TextConverter[] = [
    new MarkdownJiraConverter(),
    new JiraMarkdownConverter(),
    new MarkdownHtmlConverter(),
    new HtmlMarkdownConverter(),
    defineConverter(
      'json-yaml',
      'JSON → YAML',
      'json',
      'yaml',
      'JSON',
      'YAML',
      jsonToYaml,
    ),
    defineConverter(
      'yaml-json',
      'YAML → JSON',
      'yaml',
      'json',
      'YAML',
      'JSON',
      yamlToJson,
    ),
    defineConverter(
      'json-sql',
      'JSON → SQL',
      'json',
      'sql',
      'JSON',
      'SQL',
      jsonToSql,
    ),
    defineConverter(
      'sql-json',
      'SQL → JSON',
      'sql',
      'json',
      'SQL',
      'JSON',
      sqlToJson,
    ),
  ];
  const byId = new Map(
    converters.map((converter) => [converter.id, converter]),
  );

  return {
    list: () => converters,
    get: (id: ConverterId) => byId.get(id),
  };
}
