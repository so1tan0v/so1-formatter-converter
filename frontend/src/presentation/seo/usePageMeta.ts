/**
 * Imports from packages
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Imports from relative
 */
import { documentTitle, pageMetaForPath } from './page-meta';

/**
 * Обновляет title, description и canonical по текущему маршруту
 */
export function usePageMeta(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = pageMetaForPath(pathname);
    const url = `${window.location.origin}${page.path}`;

    document.title = documentTitle(page);
    upsertMeta('name', 'description', page.description);
    upsertMeta('property', 'og:title', document.title);
    upsertMeta('property', 'og:description', page.description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('name', 'twitter:title', document.title);
    upsertMeta('name', 'twitter:description', page.description);
    upsertLink('canonical', url);
  }, [pathname]);
}

function upsertMeta(
  attribute: 'name' | 'property',
  key: string,
  content: string,
): void {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.append(element);
  }

  element.setAttribute('content', content);
}

function upsertLink(rel: string, href: string): void {
  const selector = `link[rel="${rel}"]`;
  let element = document.head.querySelector(selector);

  if (!(element instanceof HTMLLinkElement)) {
    element = document.createElement('link');
    element.rel = rel;
    document.head.append(element);
  }

  element.href = href;
}
