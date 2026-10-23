const PAGES: Record<string, { title: string; description: string }> = {
  '/formatter/json': {
    title: 'meta.formatter.json.title',
    description: 'meta.formatter.json.description',
  },
  '/formatter/yaml': {
    title: 'meta.formatter.yaml.title',
    description: 'meta.formatter.yaml.description',
  },
  '/formatter/sql': {
    title: 'meta.formatter.sql.title',
    description: 'meta.formatter.sql.description',
  },
  '/formatter/html': {
    title: 'meta.formatter.html.title',
    description: 'meta.formatter.html.description',
  },
  '/formatter/xml': {
    title: 'meta.formatter.xml.title',
    description: 'meta.formatter.xml.description',
  },
  '/converter/markdown-jira': {
    title: 'meta.converter.markdownJira.title',
    description: 'meta.converter.markdownJira.description',
  },
  '/converter/jira-markdown': {
    title: 'meta.converter.jiraMarkdown.title',
    description: 'meta.converter.jiraMarkdown.description',
  },
  '/converter/markdown-html': {
    title: 'meta.converter.markdownHtml.title',
    description: 'meta.converter.markdownHtml.description',
  },
  '/converter/html-markdown': {
    title: 'meta.converter.htmlMarkdown.title',
    description: 'meta.converter.htmlMarkdown.description',
  },
  '/converter/json-yaml': {
    title: 'meta.converter.jsonYaml.title',
    description: 'meta.converter.jsonYaml.description',
  },
  '/converter/yaml-json': {
    title: 'meta.converter.yamlJson.title',
    description: 'meta.converter.yamlJson.description',
  },
  '/converter/json-sql': {
    title: 'meta.converter.jsonSql.title',
    description: 'meta.converter.jsonSql.description',
  },
  '/converter/sql-json': {
    title: 'meta.converter.sqlJson.title',
    description: 'meta.converter.sqlJson.description',
  },
  '/converter/json-excel': {
    title: 'meta.converter.jsonExcel.title',
    description: 'meta.converter.jsonExcel.description',
  },
  '/converter/excel-json': {
    title: 'meta.converter.excelJson.title',
    description: 'meta.converter.excelJson.description',
  },
  '/viewer/markdown': {
    title: 'meta.viewer.markdown.title',
    description: 'meta.viewer.markdown.description',
  },
  '/viewer/jira': {
    title: 'meta.viewer.jira.title',
    description: 'meta.viewer.jira.description',
  },
  '/differ': {
    title: 'meta.differ.title',
    description: 'meta.differ.description',
  },
};

/**
 * Возвращает ключи заголовка и описания страницы в словаре i18next
 *
 * @param pathname Путь без query и hash
 */
export function pageMessages(pathname: string): {
  title: string;
  description: string;
} {
  return (
    PAGES[pathname] ?? {
      title: 'meta.site.title',
      description: 'meta.site.description',
    }
  );
}
