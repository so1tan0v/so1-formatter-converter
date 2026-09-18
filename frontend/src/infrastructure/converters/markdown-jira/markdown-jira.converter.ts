import type { TextConverter } from '@domain/converter/ports';
import type { ConverterOptions } from '@domain/converter/types';
import type { Result } from '@domain/shared/result';
import { failure, success } from '@domain/shared/result';

import { markdownToJira } from './markdown-to-jira';

export class MarkdownJiraConverter implements TextConverter {
  readonly id = 'markdown-jira' as const;
  readonly label = 'Markdown → Jira';
  readonly available = true;

  convert(input: string, _options: ConverterOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    return success(markdownToJira(input));
  }
}
