import type { ReactNode } from 'react';

interface AsciiFrameProps {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  fill?: boolean;
}

export function AsciiFrame({
  title,
  hint,
  actions,
  children,
  fill = false,
}: AsciiFrameProps) {
  return (
    <section
      className={`tui-panel ${fill ? 'tui-panel--fill' : ''}`.trim()}
    >
      <header className="tui-panel__bar">
        <span className="tui-panel__corner" aria-hidden="true">
          ┌
        </span>
        <span className="tui-panel__title">
          {` ${title}${hint ? ` — ${hint}` : ''} `}
        </span>
        <span className="tui-panel__rule" aria-hidden="true">
          {'─'.repeat(160)}
        </span>
        {actions ? <div className="tui-panel__actions">{actions}</div> : null}
        <span className="tui-panel__corner" aria-hidden="true">
          ┐
        </span>
      </header>
      <div className="tui-panel__body">{children}</div>
    </section>
  );
}
