import JSON5 from 'json5';

import { toErrorMessage } from '@domain/shared/result';

export function parseLooseJson(input: string): unknown {
  const source = input.trim();

  try {
    return JSON.parse(source);
  } catch {
    try {
      return JSON5.parse(source);
    } catch (error) {
      throw new Error(`Invalid JSON: ${toErrorMessage(error)}`);
    }
  }
}
