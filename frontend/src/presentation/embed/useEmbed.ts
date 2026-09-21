/**
 * Imports from packages
 */
import { useContext } from 'react';

/**
 * Imports from presentation
 */
import {
  EmbedContext,
  type EmbedContextValue,
} from '@presentation/embed/embed-context';

/**
 * Возвращает признак режима встраивания в родительский сайт
 */
export function useEmbed(): EmbedContextValue {
  const context = useContext(EmbedContext);

  if (!context) {
    throw new Error('useEmbed must be used inside EmbedProvider');
  }

  return context;
}
