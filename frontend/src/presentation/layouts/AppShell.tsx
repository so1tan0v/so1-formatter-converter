/**
 * Imports from packages
 */
import type { ReactNode } from 'react';

/**
 * Imports from presentation
 */
import { useEmbed } from '@presentation/embed/useEmbed';
import { useMediaQuery } from '@presentation/hooks/useMediaQuery';
import { usePersistedWindowSize } from '@presentation/hooks/usePersistedWindowSize';
import { Footer } from '@presentation/layouts/Footer';
import { Header } from '@presentation/layouts/Header';
import { usePageMeta } from '@presentation/seo/usePageMeta';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Оболочка приложения: окно, шапка, подвал и основная область
 *
 * @param children Содержимое рабочей области
 */
export function AppShell({ children }: AppShellProps) {
  const { isEmbed } = useEmbed();

  usePageMeta();
  const isPhone = useMediaQuery('(max-width: 767.98px)');
  const framed = !isPhone && !isEmbed;
  const { size, onGripPointerDown } = usePersistedWindowSize(framed);

  return (
    <div className="app-stage">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div
        className={`term-window ${isPhone || isEmbed ? 'term-window--phone' : ''}`.trim()}
        style={
          framed
            ? {
                width: size.width,
                height: size.height,
              }
            : undefined
        }
      >
        {isEmbed ? null : (
          <div className="term-window__chrome" aria-hidden="true">
            <span className="term-window__dots">
              <i />
              <i />
              <i />
            </span>
            <span className="term-window__title">so1tan0v@fmt:~</span>
          </div>
        )}
        <div className="term-screen">
          <Header />
          <main id="main" className="term-screen__main">
            {children}
          </main>
          <Footer />
        </div>
        {framed ? (
          <button
            type="button"
            className="term-window__grip"
            aria-label="Resize window"
            onPointerDown={onGripPointerDown}
          />
        ) : null}
      </div>
    </div>
  );
}
