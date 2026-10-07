/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { documentTitle, pageMetaForPath } from './page-meta';

describe('pageMetaForPath', () => {
  it('возвращает описание известного инструмента', () => {
    expect(pageMetaForPath('/formatter/json').title).toBe('JSON formatter');
    expect(pageMetaForPath('/converter/markdown-jira').title).toBe(
      'Markdown to Jira',
    );
  });

  it('для неизвестного пути отдаёт описание сайта', () => {
    expect(pageMetaForPath('/missing').path).toBe('/formatter/json');
  });

  it('собирает заголовок вкладки', () => {
    expect(documentTitle(pageMetaForPath('/formatter/sql'))).toBe(
      'SQL formatter — so1tan0v@fmt',
    );
  });
});
