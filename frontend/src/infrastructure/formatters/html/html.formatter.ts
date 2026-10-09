/**
 * Imports from packages
 */
import beautify from 'js-beautify';

/**
 * Imports from domain
 */
import type { TextFormatter } from '@domain/formatter/ports';
import type { HtmlFormatOptions } from '@domain/formatter/types';
import { indentString } from '@domain/shared/indent';
import { failure, success, toErrorMessage } from '@domain/shared/result';
import type { Result } from '@domain/shared/result';

/**
 * Imports from relative
 */
import { shieldScriptEndTags } from './shield-script-end-tags';

export class HtmlFormatter implements TextFormatter<'html'> {
  /**
   * Идентификатор HTML-форматтера
   */
  readonly id = 'html' as const;

  /**
   * Подпись HTML-форматтера в интерфейсе
   */
  readonly label = 'HTML';

  /**
   * Форматирует HTML через js-beautify
   *
   * @param input Исходный текст
   * @param options Настройки форматирования HTML
   */
  format(input: string, options: HtmlFormatOptions): Result<string> {
    const source = input.trim();

    if (!source) {
      return failure('Empty input');
    }

    const useTabs = options.indent === 'tab';
    // js-beautify ведёт колонки в пробелах и считает таб за 4.
    // indent_size: 1 он подменяет на 4, но явный wrap_attributes_indent_size: 1
    // остаётся и добавляет пробел после таба.
    const indentSize = useTabs ? 4 : indentString(options.indent).length;

    try {
      return success(
        beautify.html(shieldScriptEndTags(source), {
          indent_size: indentSize,
          indent_char: useTabs ? '\t' : ' ',
          indent_with_tabs: useTabs,
          wrap_line_length: bounded(options.wrapLineLength, 0, 400, 0),
          wrap_attributes: options.wrapAttributes,
          wrap_attributes_min_attrs: bounded(
            options.wrapAttributesMin,
            1,
            20,
            2,
          ),
          wrap_attributes_indent_size: indentSize,
          indent_inner_html: options.indentInnerHtml,
          indent_head_inner_html: options.indentHead,
          indent_body_inner_html: options.indentBody,
          preserve_newlines: options.preserveNewlines,
          max_preserve_newlines: options.preserveNewlines
            ? bounded(options.maxPreserveNewlines, 0, 20, 2)
            : 0,
          end_with_newline: options.endWithNewline,
          indent_scripts: options.indentScripts,
          extra_liners: options.extraLiners ? ['head', 'body', '/html'] : [],
          indent_handlebars:
            options.templating !== 'none' && options.indentHandlebars,
          inline_custom_elements: options.inlineCustomElements,
          templating: [options.templating],
          content_unformatted: options.formatPre
            ? ['textarea']
            : ['pre', 'textarea'],
        }),
      );
    } catch (error) {
      return failure(toErrorMessage(error));
    }
  }
}

function bounded(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(value)));
}
