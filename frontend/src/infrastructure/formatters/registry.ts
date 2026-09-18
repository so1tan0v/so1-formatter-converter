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
import { JsonFormatter } from './json/json.formatter';
import { SqlFormatter } from './sql/sql.formatter';
import { YamlFormatter } from './yaml/yaml.formatter';

/**
 * Создает реестр форматтеров JSON, YAML и SQL
 */
export function createFormatterRegistry(): FormatterRegistry {
  const formatters: TextFormatter[] = [
    new JsonFormatter(),
    new YamlFormatter(),
    new SqlFormatter(),
  ];
  const byId = new Map(
    formatters.map((formatter) => [formatter.id, formatter]),
  );

  return {
    list: () => formatters,
    get: (id: FormatterId) => byId.get(id),
  };
}
