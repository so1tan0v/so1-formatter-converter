import { useLocation } from 'react-router-dom';

import { dispatchTuiCommand } from '@presentation/tui/commands';

export function Footer() {
  const location = useLocation();
  const converterActive = location.pathname.startsWith('/converter');
  const viewerActive = location.pathname.startsWith('/viewer');
  const action = converterActive ? 'convert' : 'format';
  const actionLabel = converterActive ? 'Convert' : 'Format';

  return (
    <footer className="tui-footer">
      <p className="tui-help" id="tui-help">
        {viewerActive ? (
          'Markdown viewer is coming soon.'
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
            to {converterActive ? 'transform' : 'prettify'}. Click{' '}
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
      </p>
      <div className="tui-statusbar">
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
