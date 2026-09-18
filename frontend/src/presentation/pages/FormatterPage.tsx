import { Navigate, useParams } from 'react-router-dom';

import { FORMATTER_IDS, type FormatterId } from '@domain/formatter/types';
import { FormatterWorkspace } from '@presentation/features/formatter/FormatterWorkspace';

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
