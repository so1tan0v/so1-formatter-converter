import YAML from 'js-yaml';

import { parseLooseJson } from '@infrastructure/formatters/json/json.parser';
import { toErrorMessage } from '@domain/shared/result';

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
