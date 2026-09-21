/**
 * Imports from packages
 */
import { useParams } from 'react-router-dom';

/**
 * Imports from domain
 */
import { FORMATTER_IDS, type FormatterId } from '@domain/formatter/types';

/**
 * Imports from presentation
 */
import { FormatterWorkspace } from '@presentation/features/formatter/FormatterWorkspace';
import { Redirect } from '@presentation/routing/Redirect';

/**
 * Страница форматтера, подставляет тип из маршрута
 */
export function FormatterPage() {
  const { type } = useParams();

  if (!isFormatterId(type)) {
    return <Redirect to="/formatter/json" />;
  }

  return <FormatterWorkspace formatterId={type} />;
}

function isFormatterId(value: string | undefined): value is FormatterId {
  return FORMATTER_IDS.some((id) => id === value);
}
