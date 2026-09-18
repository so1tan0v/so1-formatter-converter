import type { TextConverter } from '@domain/converter/ports';
import type { ConverterId, ConverterOptions } from '@domain/converter/types';
import type { Result } from '@domain/shared/result';
import { failure } from '@domain/shared/result';

export interface ConverterRegistry {
  list(): TextConverter[];
  get(id: ConverterId): TextConverter | undefined;
}

export function convertText(
  registry: ConverterRegistry,
  id: ConverterId,
  input: string,
  options: ConverterOptions,
): Result<string> {
  const converter = registry.get(id);

  if (!converter) {
    return failure(`Converter "${id}" is not registered`);
  }

  if (!converter.available) {
    return failure(`Converter "${converter.label}" is not available yet`);
  }

  return converter.convert(input, options);
}
