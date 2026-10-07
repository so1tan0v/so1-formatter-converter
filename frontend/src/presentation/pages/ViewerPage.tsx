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
import { ViewerWorkspace } from '@presentation/features/viewer/ViewerWorkspace';
import { Redirect } from '@presentation/routing/Redirect';

/**
 * Страница просмотрщика, подставляет тип из маршрута
 */
export function ViewerPage() {
  const { type } = useParams();
  const fallback = viewerRegistry.list().find((item) => item.available);
  const fallbackPath = `/viewer/${fallback?.id ?? 'markdown'}`;

  if (!type) {
    return <Redirect to={fallbackPath} />;
  }

  if (!isViewerId(type)) {
    return <Redirect to={fallbackPath} />;
  }

  const viewer = viewerRegistry.get(type);

  if (!viewer) {
    return <Redirect to={fallbackPath} />;
  }

  if (!viewer.available) {
    return (
      <SoonPanel
        title="Viewer"
        hint={viewer.label}
        message={`${viewer.label} viewer is not ready yet.`}
      />
    );
  }

  return <ViewerWorkspace viewerId={viewer.id} />;
}

function isViewerId(value: string): value is ViewerId {
  return VIEWER_IDS.some((id) => id === value);
}
