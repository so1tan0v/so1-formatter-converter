/**
 * Imports from packages
 */
import type { ReactNode } from 'react';

/**
 * Imports from presentation
 */
import { useMediaQuery } from '@presentation/hooks/useMediaQuery';
import { usePersistedWindowSize } from '@presentation/hooks/usePersistedWindowSize';
import { Footer } from '@presentation/layouts/Footer';
import { Header } from '@presentation/layouts/Header';

interface AppShellProps {
  children: ReactNode;
}

/**
 * Оболочка приложения: окно, шапка, подвал и основная область
 *
 * @param children Содержимое рабочей области
 */
export function AppShell({ children }: AppShellProps) {
  const isPhone = useMediaQuery('(max-width: 767.98px)');
  const { size, onGripPointerDown } = usePersistedWindowSize(!isPhone);

  return (
    <div className="app-stage">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div
        className={`term-window ${isPhone ? 'term-window--phone' : ''}`.trim()}
        style={
          isPhone
            ? undefined
            : {
                width: size.width,
                height: size.height,
              }
        }
      >
        <div className="term-window__chrome" aria-hidden="true">
          <span className="term-window__dots">
            <i />
            <i />
            <i />
          </span>
          <span className="term-window__title">so1tan0v@fmt:~</span>
        </div>
        <div className="term-screen">
          <Header />
          <main id="main" className="term-screen__main">
            {children}
          </main>
          <Footer />
        </div>
        {isPhone ? null : (
          <button
            type="button"
            className="term-window__grip"
            aria-label="Resize window"
            onPointerDown={onGripPointerDown}
          />
        )}
      </div>
    </div>
  );
}
