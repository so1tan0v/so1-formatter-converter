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
