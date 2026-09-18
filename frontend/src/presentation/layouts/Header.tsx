import { NavLink, useLocation, useMatch } from 'react-router-dom';

import {
  converterRegistry,
  formatterRegistry,
  viewerRegistry,
} from '@app/composition';

export function Header() {
  const location = useLocation();
  const formatterMatch = useMatch('/formatter/:type');
  const converterMatch = useMatch('/converter/:type');
  const viewerMatch = useMatch('/viewer/:type');
  const formatterActive = location.pathname.startsWith('/formatter');
  const converterActive = location.pathname.startsWith('/converter');
  const viewerActive = location.pathname.startsWith('/viewer');
  const command = formatterActive
    ? `formatter ${formatterMatch?.params.type ?? 'json'}`
    : converterActive
      ? `converter ${converterMatch?.params.type ?? 'markdown-jira'}`
      : `viewer ${viewerMatch?.params.type ?? 'markdown'}`;

  return (
    <header className="tui-header">
      <p className="tui-prompt">
        <span className="tui-prompt__host">[so1tan0v@fmt]</span>{' '}
        <span className="tui-prompt__hash">#</span>{' '}
        <span className="tui-prompt__cmd">{command}</span>
        <span className="tui-cursor" aria-hidden="true" />
      </p>
      <nav className="tui-menu" aria-label="Modes">
        <div className="tui-menu__row">
          <NavLink
            to="/formatter/json"
            className={() =>
              `tui-tab ${formatterActive ? 'is-active' : ''}`.trim()
            }
          >
            Formatter
          </NavLink>
          <NavLink
            to="/converter/markdown-jira"
            className={() =>
              `tui-tab ${converterActive ? 'is-active' : ''}`.trim()
            }
          >
            Converter
          </NavLink>
          <NavLink
            to="/viewer/markdown"
            className={() => `tui-tab ${viewerActive ? 'is-active' : ''}`.trim()}
          >
            Viewer
          </NavLink>
        </div>
        {formatterActive ? (
          <div className="tui-menu__row">
            {formatterRegistry.list().map((formatter) => (
              <NavLink
                key={formatter.id}
                to={`/formatter/${formatter.id}`}
                className={({ isActive }) =>
                  `tui-type ${isActive ? 'is-active' : ''}`.trim()
                }
              >
                {formatter.label}
              </NavLink>
            ))}
          </div>
        ) : null}
        {converterActive ? (
          <div className="tui-menu__row">
            {converterRegistry.list().map((converter) =>
              converter.available ? (
                <NavLink
                  key={converter.id}
                  to={`/converter/${converter.id}`}
                  className={({ isActive }) =>
                    `tui-type ${isActive ? 'is-active' : ''}`.trim()
                  }
                >
                  {converter.label}
                </NavLink>
              ) : (
                <span key={converter.id} className="tui-type is-disabled">
                  {converter.label}
                  <span className="tui-soon">soon</span>
                </span>
              ),
            )}
          </div>
        ) : null}
        {viewerActive ? (
          <div className="tui-menu__row">
            {viewerRegistry.list().map((viewer) => (
              <span key={viewer.id} className="tui-type is-disabled">
                {viewer.label}
                <span className="tui-soon">soon</span>
              </span>
            ))}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
