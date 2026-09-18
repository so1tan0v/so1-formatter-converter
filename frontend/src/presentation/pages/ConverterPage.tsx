import { Navigate, useParams } from 'react-router-dom';

import { converterRegistry } from '@app/composition';
import { CONVERTER_IDS, type ConverterId } from '@domain/converter/types';
import { SoonPanel } from '@presentation/components/SoonPanel';
import { ConverterWorkspace } from '@presentation/features/converter/ConverterWorkspace';

export function ConverterPage() {
  const { type } = useParams();
  const fallback = converterRegistry.list().find((item) => item.available);

  if (!type) {
    return (
      <Navigate to={`/converter/${fallback?.id ?? 'markdown-jira'}`} replace />
    );
  }

  if (!isConverterId(type)) {
    return (
      <Navigate to={`/converter/${fallback?.id ?? 'markdown-jira'}`} replace />
    );
  }

  const converter = converterRegistry.get(type);

  if (!converter) {
    return (
      <Navigate to={`/converter/${fallback?.id ?? 'markdown-jira'}`} replace />
    );
  }

  if (!converter.available) {
    return (
      <SoonPanel
        title="Converter"
        hint={converter.label}
        message={`${converter.label} is not ready yet. Markdown → Jira is available now.`}
      />
    );
  }

  return <ConverterWorkspace converterId={converter.id} />;
}

function isConverterId(value: string): value is ConverterId {
  return CONVERTER_IDS.some((id) => id === value);
}
