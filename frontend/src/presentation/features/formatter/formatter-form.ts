/**
 * Imports from domain
 */
import {
  DEFAULT_HTML_OPTIONS,
  XML_WRAP_ATTRIBUTES,
  type FormatterId,
  type FormatterOptionsMap,
  type HtmlScriptIndent,
  type HtmlTemplating,
  type HtmlWrapAttributes,
  type JsonKeyCase,
  type OutputMode,
  type SqlKeywordCase,
  type YamlNullStyle,
  type YamlQuoting,
} from '@domain/formatter/types';
import type { IndentStyle } from '@domain/shared/indent';

export interface FormatterFormValues {
  source: string;
  indent: IndentStyle;
  mode: OutputMode;
  keyCase: JsonKeyCase;
  sortKeys: boolean;
  dropNulls: boolean;
  escapeUnicode: boolean;
  trailingNewline: boolean;
  query: string;
  quoting: YamlQuoting;
  forceQuotes: boolean;
  documentStart: boolean;
  documentEnd: boolean;
  lineWidth: number;
  nullStyle: YamlNullStyle;
  keywordCase: SqlKeywordCase;
  wrapAttributes: HtmlWrapAttributes;
  wrapAttributesMin: number;
  wrapLineLength: number;
  indentInnerHtml: boolean;
  indentHead: boolean;
  indentBody: boolean;
  preserveNewlines: boolean;
  maxPreserveNewlines: number;
  endWithNewline: boolean;
  indentScripts: HtmlScriptIndent;
  extraLiners: boolean;
  indentHandlebars: boolean;
  inlineCustomElements: boolean;
  templating: HtmlTemplating;
  formatPre: boolean;
}

export type FormatterOptionValues = Omit<FormatterFormValues, 'source'>;

/**
 * Собирает поля формы из настроек форматтера
 *
 * @param options Настройки выбранного типа
 */
export function optionDefaults(
  options: FormatterOptionsMap[FormatterId],
): FormatterOptionValues {
  const jsonLike =
    'mode' in options
      ? options
      : {
          indent: options.indent,
          mode: 'pretty' as const,
        };

  const html = 'templating' in options ? options : DEFAULT_HTML_OPTIONS;

  return {
    indent: jsonLike.indent,
    mode: jsonLike.mode,
    keyCase: 'keyCase' in options ? options.keyCase : 'as-is',
    sortKeys: 'sortKeys' in options ? options.sortKeys : false,
    dropNulls: 'dropNulls' in options ? options.dropNulls : false,
    escapeUnicode: 'escapeUnicode' in options ? options.escapeUnicode : false,
    trailingNewline:
      'trailingNewline' in options ? options.trailingNewline : false,
    query: 'query' in options ? options.query : '',
    quoting: 'quoting' in options ? options.quoting : 'auto',
    forceQuotes: 'forceQuotes' in options ? options.forceQuotes : false,
    documentStart: 'documentStart' in options ? options.documentStart : false,
    documentEnd: 'documentEnd' in options ? options.documentEnd : false,
    lineWidth: 'lineWidth' in options ? options.lineWidth : 80,
    nullStyle: 'nullStyle' in options ? options.nullStyle : 'null',
    keywordCase: 'keywordCase' in options ? options.keywordCase : 'upper',
    wrapAttributes:
      'wrapAttributes' in options
        ? options.wrapAttributes
        : html.wrapAttributes,
    wrapAttributesMin: html.wrapAttributesMin,
    wrapLineLength: html.wrapLineLength,
    indentInnerHtml: html.indentInnerHtml,
    indentHead: html.indentHead,
    indentBody: html.indentBody,
    preserveNewlines: html.preserveNewlines,
    maxPreserveNewlines: html.maxPreserveNewlines,
    endWithNewline:
      'endWithNewline' in options
        ? options.endWithNewline
        : html.endWithNewline,
    indentScripts: html.indentScripts,
    extraLiners: html.extraLiners,
    indentHandlebars: html.indentHandlebars,
    inlineCustomElements: html.inlineCustomElements,
    templating: html.templating,
    formatPre: html.formatPre,
  };
}

/**
 * Собирает настройки форматтера из полей формы
 *
 * @param id Идентификатор форматтера
 * @param values Поля формы
 */
export function toFormatterOptions(
  id: FormatterId,
  values: FormatterFormValues,
): FormatterOptionsMap[typeof id] {
  if (id === 'json') {
    return {
      indent: values.indent,
      mode: values.mode,
      keyCase: values.keyCase,
      sortKeys: values.sortKeys,
      dropNulls: values.dropNulls,
      escapeUnicode: values.escapeUnicode,
      trailingNewline: values.trailingNewline,
      query: values.query,
    };
  }

  if (id === 'sql') {
    return {
      indent: values.indent,
      keywordCase: values.keywordCase,
    };
  }

  if (id === 'xml') {
    const wrapAttributes = XML_WRAP_ATTRIBUTES.find(
      (value) => value === values.wrapAttributes,
    );

    return {
      indent: values.indent,
      mode: values.mode === 'escaped' ? 'pretty' : values.mode,
      wrapAttributes: wrapAttributes ?? 'auto',
      endWithNewline: values.endWithNewline,
    };
  }

  if (id === 'html') {
    return {
      indent: values.indent,
      wrapAttributes: values.wrapAttributes,
      wrapAttributesMin: Number(values.wrapAttributesMin),
      wrapLineLength: Number(values.wrapLineLength),
      indentInnerHtml: values.indentInnerHtml,
      indentHead: values.indentHead,
      indentBody: values.indentBody,
      preserveNewlines: values.preserveNewlines,
      maxPreserveNewlines: Number(values.maxPreserveNewlines),
      endWithNewline: values.endWithNewline,
      indentScripts: values.indentScripts,
      extraLiners: values.extraLiners,
      indentHandlebars: values.indentHandlebars,
      inlineCustomElements: values.inlineCustomElements,
      templating: values.templating,
      formatPre: values.formatPre,
    };
  }

  return {
    indent: values.indent,
    mode: values.mode,
    sortKeys: values.sortKeys,
    keyCase: values.keyCase,
    quoting: values.quoting,
    forceQuotes: values.forceQuotes,
    documentStart: values.documentStart,
    documentEnd: values.documentEnd,
    lineWidth: Number(values.lineWidth) || 80,
    nullStyle: values.nullStyle,
  };
}
