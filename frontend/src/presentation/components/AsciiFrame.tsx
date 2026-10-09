/**
 * Imports from packages
 */
import type { ReactNode } from 'react';

interface AsciiFrameProps {
  title: string;
  hint?: string;
  actions?: ReactNode;
  children: ReactNode;
  fill?: boolean;
  collapsed?: boolean;
}

/**
 * Панель с ASCII-рамкой для блока рабочей области
 *
 * @param title Заголовок панели
 * @param hint Необязательная подпись рядом с заголовком
 * @param actions Дополнительные элементы в шапке панели
 * @param children Содержимое панели
 * @param fill Признак растягивания панели на доступную высоту
 * @param collapsed Признак, что тело панели скрыто
 */
export function AsciiFrame({
  title,
  hint,
  actions,
  children,
  fill = false,
  collapsed = false,
}: AsciiFrameProps) {
  const classes = [
    'tui-panel',
    fill ? 'tui-panel--fill' : '',
    collapsed ? 'tui-panel--collapsed' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section className={classes}>
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
      {collapsed ? null : <div className="tui-panel__body">{children}</div>}
    </section>
  );
}
