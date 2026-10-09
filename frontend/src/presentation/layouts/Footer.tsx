/**
 * Imports from packages
 */
import { useLocation } from 'react-router-dom';

/**
 * Imports from presentation
 */
import { useEmbed } from '@presentation/embed/useEmbed';
import { dispatchTuiCommand } from '@presentation/tui/commands';

/**
 * Нижняя панель с действиями Format, Convert, Diff и Copy
 */
export function Footer() {
  const location = useLocation();
  const { isEmbed } = useEmbed();
  const converterActive = location.pathname.startsWith('/converter');
  const viewerActive = location.pathname.startsWith('/viewer');
  const differActive = location.pathname.startsWith('/differ');
  const action = viewerActive
    ? 'render'
    : converterActive
      ? 'convert'
      : 'format';
  const actionLabel = viewerActive
    ? 'Render'
    : converterActive
      ? 'Convert'
      : 'Format';
  const actionVerb = viewerActive
    ? 'preview'
    : converterActive
      ? 'transform'
      : 'prettify';

  return (
    <footer className="tui-footer">
      <p className="tui-help" id="tui-help">
        {differActive ? (
          <>
            Paste text or click &quot;Open&quot; to load a file. Both sides
            scroll together. Click{' '}
            <button
              type="button"
              className="tui-inline-cmd"
              onClick={() => dispatchTuiCommand('sample')}
            >
              &quot;Example&quot;
            </button>{' '}
            for a sample.
          </>
        ) : (
          <>
            Click{' '}
            <button
              type="button"
              className="tui-inline-cmd"
              onClick={() => dispatchTuiCommand(action)}
            >
              &quot;{actionLabel}&quot;
            </button>{' '}
            to {actionVerb}. Click{' '}
            <button
              type="button"
              className="tui-inline-cmd"
              onClick={() => dispatchTuiCommand('sample')}
            >
              &quot;Example&quot;
            </button>{' '}
            for a sample.
          </>
        )}
        {isEmbed ? ' Copy with F4. Exit with Ctrl+C or ⌘C.' : null}
      </p>
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
