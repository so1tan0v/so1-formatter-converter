/**
 * Imports from packages
 */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Imports from infrastructure
 */
import {
  ensureVisit,
  setMetricsContext,
  trackAction,
} from '@infrastructure/analytics/metrics';

/**
 * Imports from presentation
 */
import { useEmbed } from '@presentation/embed/useEmbed';
import { useLocale } from '@presentation/i18n/useLocale';
import { TUI_COMMAND_EVENT, type TuiCommand } from '@presentation/tui/commands';

/**
 * Отправляет визит, просмотры разделов и команды интерфейса
 */
export function MetricsListener() {
  const { pathname } = useLocation();
  const { locale } = useLocale();
  const { isEmbed } = useEmbed();

  useEffect(() => {
    setMetricsContext({ lang: locale, embed: isEmbed });
  }, [isEmbed, locale]);

  useEffect(() => {
    ensureVisit(pathname);
    trackAction('view', pathname);
  }, [pathname]);

  useEffect(() => {
    const onCommand = (event: Event) => {
      const command = (event as CustomEvent<TuiCommand>).detail;

      trackAction(command);
    };

    document.addEventListener(TUI_COMMAND_EVENT, onCommand);

    return () => {
      document.removeEventListener(TUI_COMMAND_EVENT, onCommand);
    };
  }, []);

  return null;
}
