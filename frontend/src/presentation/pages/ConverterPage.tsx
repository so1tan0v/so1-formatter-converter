/**
 * Imports from packages
 */
import { useParams } from 'react-router-dom';

/**
 * Imports from app
 */
import { converterRegistry } from '@app/composition';

/**
 * Imports from domain
 */
import { CONVERTER_IDS, type ConverterId } from '@domain/converter/types';

/**
 * Imports from presentation
 */
import { SoonPanel } from '@presentation/components/SoonPanel';
import { ConverterWorkspace } from '@presentation/features/converter/ConverterWorkspace';
import { Redirect } from '@presentation/routing/Redirect';

/**
 * Страница конвертера, подставляет тип из маршрута
 */
export function ConverterPage() {
  const { type } = useParams();
  const fallback = converterRegistry.list().find((item) => item.available);
  const fallbackPath = `/converter/${fallback?.id ?? 'markdown-jira'}`;

  if (!type) {
    return <Redirect to={fallbackPath} />;
  }

  if (!isConverterId(type)) {
    return <Redirect to={fallbackPath} />;
  }

  const converter = converterRegistry.get(type);

  if (!converter) {
    return <Redirect to={fallbackPath} />;
  }

  if (!converter.available) {
    return (
      <SoonPanel
        title="Converter"
        hint={converter.label}
        message={`${converter.label} is not ready yet.`}
      />
    );
  }

  return <ConverterWorkspace converterId={converter.id} />;
}

function isConverterId(value: string): value is ConverterId {
  return CONVERTER_IDS.some((id) => id === value);
}
