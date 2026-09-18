import type { Result } from '@domain/shared/result';

import type { FormatterId, FormatterOptionsMap } from './types';

export interface TextFormatter<TId extends FormatterId = FormatterId> {
  readonly id: TId;
  readonly label: string;
  format(input: string, options: FormatterOptionsMap[TId]): Result<string>;
}
