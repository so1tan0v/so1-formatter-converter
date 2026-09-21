/**
 * Imports from packages
 */
import { Navigate, useLocation } from 'react-router-dom';

interface RedirectProps {
  to: string;
}

/**
 * Перенаправление, которое сохраняет query-параметры embed и theme
 *
 * @param to Путь назначения без query-строки
 */
export function Redirect({ to }: RedirectProps) {
  const { search } = useLocation();

  return <Navigate to={{ pathname: to, search }} replace />;
}
