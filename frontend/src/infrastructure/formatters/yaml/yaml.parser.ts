/**
 * Imports from packages
 */
import YAML from 'js-yaml';

/**
 * Imports from domain
 */
import { toErrorMessage } from '@domain/shared/result';

/**
 * Imports from infrastructure
 */
import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';

/**
 * Разбирает YAML и при неудаче пробует разобрать текст как JSON
 *
 * @param input Исходный текст
 */
export function parseLooseYaml(input: string): unknown {
  const source = input.trim();

  try {
    const parsed = YAML.load(source);

    if (typeof parsed === 'undefined') {
      throw new Error('YAML document is empty');
    }

    return parsed;
  } catch (yamlError) {
    try {
      return parseLooseJson(source);
    } catch {
      throw new Error(`Invalid YAML: ${toErrorMessage(yamlError)}`);
    }
  }
}
