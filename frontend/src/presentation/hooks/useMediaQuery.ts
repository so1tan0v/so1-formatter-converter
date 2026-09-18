/**
 * Imports from packages
 */
import { useEffect, useState } from 'react';

/**
 * Подписывается на CSS media query и возвращает текущее совпадение
 *
 * @param query Строка media query
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);

    onChange();
    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
