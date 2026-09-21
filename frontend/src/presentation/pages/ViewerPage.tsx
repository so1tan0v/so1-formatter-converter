/**
 * Imports from packages
 */
import { useParams } from 'react-router-dom';

/**
 * Imports from app
 */
import { viewerRegistry } from '@app/composition';

/**
 * Imports from domain
 */
import { VIEWER_IDS, type ViewerId } from '@domain/viewer/types';

/**
 * Imports from presentation
 */
import { SoonPanel } from '@presentation/components/SoonPanel';
import { Redirect } from '@presentation/routing/Redirect';

/**
 * Страница просмотрщика, пока показывает заглушку
 */
export function ViewerPage() {
  const { type } = useParams();
  const fallback = viewerRegistry.list()[0];
  const fallbackPath = `/viewer/${fallback?.id ?? 'markdown'}`;

  if (!type) {
    return <Redirect to={fallbackPath} />;
  }

  if (!isViewerId(type)) {
    return <Redirect to={fallbackPath} />;
  }

  const viewer = viewerRegistry.get(type);

  return (
    <SoonPanel
      title="Viewer"
      hint={viewer?.label ?? 'Markdown'}
      message="This section will render documents in place. Markdown is first in line."
    />
  );
}

function isViewerId(value: string): value is ViewerId {
  return VIEWER_IDS.some((id) => id === value);
}
