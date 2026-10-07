/**
 * Imports from relative
 */
import { INDEXABLE_PAGES } from './page-meta';

/**
 * Публичный адрес сайта без завершающего слэша.
 */
export const SITE_ORIGIN = 'https://conv.soltanov.dev';

/**
 * Собирает sitemap.xml из страниц, которые должны попасть в поиск
 *
 * @param origin Публичный адрес сайта
 */
export function sitemapXml(origin: string = SITE_ORIGIN): string {
  const urls = INDEXABLE_PAGES.map(
    (page) => `  <url><loc>${origin}${page.path}</loc></url>`,
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
