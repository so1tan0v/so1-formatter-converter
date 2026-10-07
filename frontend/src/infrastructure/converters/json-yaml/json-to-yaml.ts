/**
 * Imports from domain
 */
import { DEFAULT_YAML_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from infrastructure
 */
import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';
import { serializeYaml } from '@infrastructure/formatters/yaml/yaml.serialize';

/**
 * Преобразует JSON в YAML
 *
 * @param input Исходный JSON-текст
 */
export function jsonToYaml(input: string): string {
  return serializeYaml(parseLooseJson(input), DEFAULT_YAML_OPTIONS);
}
