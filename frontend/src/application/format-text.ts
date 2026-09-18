import type { TextFormatter } from '@domain/formatter/ports';
import type { FormatterId, FormatterOptionsMap } from '@domain/formatter/types';
import type { Result } from '@domain/shared/result';
import { failure } from '@domain/shared/result';

export interface FormatterRegistry {
  list(): TextFormatter[];
  get(id: FormatterId): TextFormatter | undefined;
}

export function formatText<TId extends FormatterId>(
  registry: FormatterRegistry,
  id: TId,
  input: string,
  options: FormatterOptionsMap[TId],
): Result<string> {
  const formatter = registry.get(id);

  if (!formatter) {
    return failure(`Formatter "${id}" is not registered`);
  }

  return formatter.format(
    input,
    options as FormatterOptionsMap[typeof formatter.id],
  );
}
