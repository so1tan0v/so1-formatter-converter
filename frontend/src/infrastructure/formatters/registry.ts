/**
 * Imports from application
 */
import type { FormatterRegistry } from '@application/format-text';

/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { FormatterId } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { HtmlFormatter } from './html/html.formatter';
import { JsonFormatter } from './json/json.formatter';
import { SqlFormatter } from './sql/sql.formatter';
import { XmlFormatter } from './xml/xml.formatter';
import { YamlFormatter } from './yaml/yaml.formatter';

/**
 * Создает реестр форматтеров JSON, YAML, SQL и HTML
 */
export function createFormatterRegistry(): FormatterRegistry {
  const formatters: TextFormatter[] = [
    new JsonFormatter(),
    new YamlFormatter(),
    new SqlFormatter(),
    new HtmlFormatter(),
    new XmlFormatter(),
  ];
  const byId = new Map(
    formatters.map((formatter) => [formatter.id, formatter]),
  );

  return {
    list: () => formatters,
    get: (id: FormatterId) => byId.get(id),
  };
}
