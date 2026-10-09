/**
 * Imports from packages
 */
import { NavLink, useLocation, useMatch } from 'react-router-dom';

/**
 * Imports from app
 */
import { formatterRegistry, viewerRegistry } from '@app/composition';

/**
 * Imports from domain
 */
import type { ConverterId } from '@domain/converter/types';

/**
 * Imports from presentation
 */
import {
  CONVERTER_PAIRS,
  pairForConverter,
} from '@presentation/features/converter/pairs';
import { FORMATTER_GROUPS } from '@presentation/features/formatter/formatter-groups';
import { useEmbed } from '@presentation/embed/useEmbed';

/**
 * Верхняя панель с разделами Formatter, Converter, Viewer и Differ
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
  const differActive = location.pathname.startsWith('/differ');
  const command = formatterActive
    ? `formatter ${formatterMatch?.params.type ?? 'json'}`
    : converterActive
      ? `converter ${converterMatch?.params.type ?? 'markdown-jira'}`
      : viewerActive
        ? `viewer ${viewerMatch?.params.type ?? 'markdown'}`
        : 'differ';
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
          <NavLink
            to={{ pathname: '/differ', search }}
            className={() =>
              `tui-tab ${differActive ? 'is-active' : ''}`.trim()
            }
          >
            Differ
          </NavLink>
        </div>
        {formatterActive ? (
          <div className="tui-menu__row">
            {FORMATTER_GROUPS.map((group) => (
              <span className="tui-type-group" key={group.label}>
                <span className="tui-type-group__label">{group.label}</span>
                {group.ids.map((id) => {
                  const formatter = formatterRegistry.get(id);

                  if (!formatter) {
                    return null;
                  }

                  return (
                    <NavLink
                      key={formatter.id}
                      to={{ pathname: `/formatter/${formatter.id}`, search }}
                      className={({ isActive }) =>
                        `tui-type ${isActive ? 'is-active' : ''}`.trim()
                      }
                    >
                      {formatter.label}
                    </NavLink>
                  );
                })}
              </span>
            ))}
          </div>
        ) : null}
        {converterActive ? (
          <div className="tui-menu__row">
            {CONVERTER_PAIRS.map((pair) => {
              const current = converterMatch?.params.type;
              const active = Boolean(
                current && pairForConverter(current as ConverterId) === pair,
              );
              const target = active && current ? current : pair.forward;

              return (
                <NavLink
                  key={pair.forward}
                  to={{ pathname: `/converter/${target}`, search }}
                  className={() =>
                    `tui-type ${active ? 'is-active' : ''}`.trim()
                  }
                >
                  {pair.label}
                </NavLink>
              );
            })}
          </div>
        ) : null}
        {viewerActive ? (
          <div className="tui-menu__row">
            {viewerRegistry.list().map((viewer) =>
              viewer.available ? (
                <NavLink
                  key={viewer.id}
                  to={{ pathname: `/viewer/${viewer.id}`, search }}
                  className={({ isActive }) =>
                    `tui-type ${isActive ? 'is-active' : ''}`.trim()
                  }
                >
                  {viewer.label}
                </NavLink>
              ) : (
                <span key={viewer.id} className="tui-type is-disabled">
                  {viewer.label}
                  <span className="tui-soon">soon</span>
                </span>
              ),
            )}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
