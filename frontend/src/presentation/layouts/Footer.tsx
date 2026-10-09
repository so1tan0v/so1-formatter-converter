/**
 * Imports from packages
 */
import { useLocation } from 'react-router-dom';

/**
 * Imports from presentation
 */
import { useEmbed } from '@presentation/embed/useEmbed';
import { useAppSelector } from '@presentation/store/hooks';
import { dispatchTuiCommand } from '@presentation/tui/commands';
import type { TuiCommand } from '@presentation/tui/commands';

/**
 * Нижняя панель с командами и числом строк
 */
export function Footer() {
  const location = useLocation();
  const { isEmbed } = useEmbed();
  const source = useAppSelector((state) => state.workspace.source);
  const output = useAppSelector((state) => state.workspace.output);
  const error = useAppSelector((state) => state.workspace.error);
  const converterActive = location.pathname.startsWith('/converter');
  const viewerActive = location.pathname.startsWith('/viewer');
  const differActive = location.pathname.startsWith('/differ');
  const action: TuiCommand = viewerActive
    ? 'render'
    : converterActive
      ? 'convert'
      : 'format';
  const actionLabel = viewerActive
    ? 'Render'
    : converterActive
      ? 'Convert'
      : 'Format';
  const lines = source.length === 0 ? 0 : source.split('\n').length;
  const lineLabel = lines === 1 ? '1 line' : `${lines} lines`;
  const copyDisabled = !differActive && (!output || Boolean(error));

  return (
    <footer className="tui-footer">
      <div className="tui-fnbar" aria-label="Commands">
        {differActive ? null : (
          <button
            type="button"
            className="tui-fn"
            onClick={() => dispatchTuiCommand(action)}
          >
            <span className="tui-fn__key">F2</span>
            <span className="tui-fn__label">{actionLabel}</span>
          </button>
        )}
        <button
          type="button"
          className="tui-fn"
          onClick={() => dispatchTuiCommand('sample')}
        >
          <span className="tui-fn__key">F3</span>
          <span className="tui-fn__label">Example</span>
        </button>
        <button
          type="button"
          className="tui-fn"
          disabled={copyDisabled}
          onClick={() => dispatchTuiCommand('copy')}
        >
          <span className="tui-fn__key">F4</span>
          <span className="tui-fn__label">Copy</span>
        </button>
        <span className="tui-fn tui-fn--meta">
          <span className="tui-fn__label">{lineLabel}</span>
        </span>
      </div>
      <div className="tui-statusbar">
        {isEmbed ? (
          <span className="tui-statusbar__credit">
            <span className="tui-fetch__key">Exit:</span>
            <span className="tui-fetch__val">Ctrl+C / ⌘C</span>
          </span>
        ) : null}
        <a
          href="https://t.me/so1tan0v"
          target="_blank"
          rel="noreferrer"
          className="tui-statusbar__link"
        >
          <span className="tui-fetch__key">Telegram:</span>
          <span className="tui-fetch__val">@so1tan0v</span>
        </a>
        <a
          href="https://alex.soltanov.dev"
          target="_blank"
          rel="noreferrer"
          className="tui-statusbar__link"
        >
          <span className="tui-fetch__key">Site:</span>
          <span className="tui-fetch__val">alex.soltanov.dev</span>
        </a>
        <span className="tui-statusbar__credit">
          <span className="tui-fetch__key">Powered by:</span>
          <span className="tui-fetch__val tui-fetch__val--warn">Tonus</span>
        </span>
      </div>
    </footer>
  );
}
