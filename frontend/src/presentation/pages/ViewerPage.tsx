import { Navigate, useParams } from 'react-router-dom';

import { viewerRegistry } from '@app/composition';
import { VIEWER_IDS, type ViewerId } from '@domain/viewer/types';
import { SoonPanel } from '@presentation/components/SoonPanel';

export function ViewerPage() {
  const { type } = useParams();
  const fallback = viewerRegistry.list()[0];

  if (!type) {
    return <Navigate to={`/viewer/${fallback?.id ?? 'markdown'}`} replace />;
  }

  if (!isViewerId(type)) {
    return <Navigate to={`/viewer/${fallback?.id ?? 'markdown'}`} replace />;
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
