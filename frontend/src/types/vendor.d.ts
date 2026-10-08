declare module 'js-beautify' {
  export interface HtmlBeautifyOptions {
    indent_size?: number;
    indent_char?: string;
    indent_with_tabs?: boolean;
    wrap_line_length?: number;
    wrap_attributes?:
      | 'auto'
      | 'force'
      | 'force-aligned'
      | 'force-expand-multiline'
      | 'aligned-multiple'
      | 'preserve'
      | 'preserve-aligned';
    wrap_attributes_min_attrs?: number;
    wrap_attributes_indent_size?: number;
    end_with_newline?: boolean;
    preserve_newlines?: boolean;
    max_preserve_newlines?: number;
    indent_inner_html?: boolean;
    indent_head_inner_html?: boolean;
    indent_body_inner_html?: boolean;
    indent_scripts?: 'normal' | 'keep' | 'separate';
    extra_liners?: string[];
    indent_handlebars?: boolean;
    inline_custom_elements?: boolean;
    templating?: string[];
    content_unformatted?: string[];
  }

  interface JsBeautify {
    html(source: string, options?: HtmlBeautifyOptions): string;
  }

  const beautify: JsBeautify;

  export default beautify;
}

declare module 'jira2md' {
  const J2M: {
    to_jira(input: string): string;
    to_markdown(input: string): string;
  };

  export default J2M;
}

declare module 'sql-formatter' {
  export type SqlLanguage =
    'sql' | 'postgresql' | 'mysql' | 'sqlite' | 'clickhouse' | 'transactsql';

  export interface FormatOptions {
    language?: SqlLanguage;
    tabWidth?: number;
    useTabs?: boolean;
    keywordCase?: 'upper' | 'lower' | 'preserve';
    identifierCase?: 'upper' | 'lower' | 'preserve';
    functionCase?: 'upper' | 'lower' | 'preserve';
    logicalOperatorNewline?: 'before' | 'after';
    paramTypes?: {
      positional?: boolean;
      custom?: Array<{ regex: string }>;
    };
  }

  export function format(sql: string, options?: FormatOptions): string;
}
