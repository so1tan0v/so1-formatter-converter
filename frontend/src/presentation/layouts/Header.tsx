/**
 * Imports from packages
 */
import { NavLink, useLocation, useMatch } from 'react-router-dom';

/**
 * Imports from app
 */
import {
  converterRegistry,
  formatterRegistry,
  viewerRegistry,
} from '@app/composition';

/**
 * Imports from presentation
 */
import { useEmbed } from '@presentation/embed/useEmbed';

/**
 * Верхняя панель с разделами Formatter, Converter и Viewer
 */
export function Header() {
  const location = useLocation();
  const { isEmbed } = useEmbed();
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
  const search = location.search;

  return (
    <header className="tui-header">
      {isEmbed ? null : (
        <p className="tui-prompt">
          <span className="tui-prompt__host">[so1tan0v@fmt]</span>{' '}
          <span className="tui-prompt__hash">#</span>{' '}
          <span className="tui-prompt__cmd">{command}</span>
          <span className="tui-cursor" aria-hidden="true" />
        </p>
      )}
      <nav className="tui-menu" aria-label="Modes">
        <div className="tui-menu__row">
          <NavLink
            to={{ pathname: '/formatter/json', search }}
            className={() =>
              `tui-tab ${formatterActive ? 'is-active' : ''}`.trim()
            }
          >
            Formatter
          </NavLink>
          <NavLink
            to={{ pathname: '/converter/markdown-jira', search }}
            className={() =>
              `tui-tab ${converterActive ? 'is-active' : ''}`.trim()
            }
          >
            Converter
          </NavLink>
          <NavLink
            to={{ pathname: '/viewer/markdown', search }}
            className={() =>
              `tui-tab ${viewerActive ? 'is-active' : ''}`.trim()
            }
          >
            Viewer
          </NavLink>
        </div>
        {formatterActive ? (
          <div className="tui-menu__row">
            {formatterRegistry.list().map((formatter) => (
              <NavLink
                key={formatter.id}
                to={{ pathname: `/formatter/${formatter.id}`, search }}
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
                  to={{ pathname: `/converter/${converter.id}`, search }}
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
