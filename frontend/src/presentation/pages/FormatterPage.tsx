/**
 * Imports from packages
 */
import { Navigate, useParams } from 'react-router-dom';

/**
 * Imports from domain
 */
import { FORMATTER_IDS, type FormatterId } from '@domain/formatter/types';

/**
 * Imports from presentation
 */
import { FormatterWorkspace } from '@presentation/features/formatter/FormatterWorkspace';

/**
 * Страница форматтера, подставляет тип из маршрута
 */
export function FormatterPage() {
  const { type } = useParams();

  if (!isFormatterId(type)) {
    return <Navigate to="/formatter/json" replace />;
  }

  return <FormatterWorkspace formatterId={type} />;
}

function isFormatterId(value: string | undefined): value is FormatterId {
  return FORMATTER_IDS.some((id) => id === value);
}
