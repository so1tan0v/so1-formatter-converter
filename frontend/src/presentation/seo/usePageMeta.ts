/**
 * Imports from packages
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Imports from presentation
 */
import { pageMessages } from '@presentation/i18n/pages';
import { useLocale } from '@presentation/i18n/useLocale';

/**
 * Imports from relative
 */
import { SITE_NAME } from './page-meta';

/**
 * Обновляет title, description и canonical по текущему маршруту
 */
export function usePageMeta(): void {
  const { pathname } = useLocation();
  const { locale, t } = useLocale();

  useEffect(() => {
    const messages = pageMessages(pathname);
    const title = String(t(messages.title));
    const description = String(t(messages.description));
    const url = `${window.location.origin}${pathname}`;
    const documentTitle = `${title} — ${SITE_NAME}`;

    document.title = documentTitle;
    document.documentElement.lang = locale;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:title', documentTitle);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:locale', locale === 'ru' ? 'ru_RU' : 'en_US');
    upsertMeta('name', 'twitter:title', documentTitle);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', url);
  }, [locale, pathname, t]);
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
  const found = document.head.querySelector(selector);
  const element =
    found instanceof HTMLLinkElement ? found : document.createElement('link');

  if (!(found instanceof HTMLLinkElement)) {
    element.rel = rel;
    document.head.append(element);
  }

  element.href = href;
}
