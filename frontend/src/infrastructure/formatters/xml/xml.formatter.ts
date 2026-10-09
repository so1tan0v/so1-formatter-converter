/**
 * Imports from packages
 */
import beautify from 'js-beautify';

/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { XmlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { xmlError } from './xml.validate';

export class XmlFormatter implements TextFormatter<'xml'> {
  /**
   * Идентификатор XML-форматтера
   */
  readonly id = 'xml' as const;

  /**
   * Подпись XML-форматтера в интерфейсе
   */
  readonly label = 'XML';

  /**
   * Форматирует XML-документ
   *
   * @param input Исходный текст
   * @param options Настройки форматирования XML
   */
  format(input: string, options: XmlFormatOptions): Result<string> {
    const source = input.replace(/^\uFEFF/, '').trim();

    if (!source) {
      return failure('Empty input');
    }

    const problem = validateXml(source);

    if (problem) {
      return failure(problem);
    }

    try {
      const formatted =
        options.mode === 'compact'
          ? compactXml(source)
          : prettyXml(source, options);

      return success(formatted);
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}

function validateXml(source: string): string | null {
  return xmlError(source);
}

function prettyXml(source: string, options: XmlFormatOptions): string {
  const useTabs = options.indent === 'tab';
  const indentSize = useTabs ? 4 : indentString(options.indent).length;
  const formatted = beautify.html(source, {
    indent_size: indentSize,
    indent_char: useTabs ? '\t' : ' ',
    indent_with_tabs: useTabs,
    wrap_line_length: 0,
    wrap_attributes: options.wrapAttributes,
    wrap_attributes_indent_size: indentSize,
    indent_inner_html: true,
    extra_liners: [],
    inline: [],
    unformatted: [],
    content_unformatted: [],
    preserve_newlines: true,
    max_preserve_newlines: 2,
    end_with_newline: options.endWithNewline,
  });

  if (options.endWithNewline) {
    return formatted.endsWith('\n') ? formatted : `${formatted}\n`;
  }

  return formatted.replace(/\n$/, '');
}

function compactXml(source: string): string {
  return source.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();
}
