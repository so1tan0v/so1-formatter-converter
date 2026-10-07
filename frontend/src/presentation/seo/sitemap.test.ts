/**
 * Imports from packages
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { INDEXABLE_PAGES } from './page-meta';
import { SITE_ORIGIN, sitemapXml } from './sitemap';

const publicSitemap = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../public/sitemap.xml',
);

describe('sitemapXml', () => {
  it('включает каждую индексируемую страницу', () => {
    const xml = sitemapXml();

    for (const page of INDEXABLE_PAGES) {
      expect(xml).toContain(`${SITE_ORIGIN}${page.path}`);
    }
  });

  it('совпадает с файлом public/sitemap.xml', () => {
    expect(readFileSync(publicSitemap, 'utf8')).toBe(sitemapXml());
  });
});
