/**
 * Imports from domain
 */
import { DEFAULT_JSON_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from infrastructure
 */
import { serializeJson } from '@infrastructure/formatters/json/json.serialize';
import { parseLooseYaml } from '@infrastructure/formatters/yaml/yaml.parser';

/**
 * Преобразует YAML в JSON
 *
 * @param input Исходный YAML-текст
 */
export function yamlToJson(input: string): string {
  return serializeJson(parseLooseYaml(input), DEFAULT_JSON_OPTIONS);
}
