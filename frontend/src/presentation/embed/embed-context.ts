/**
 * Imports from packages
 */
import { createContext } from 'react';

export interface EmbedContextValue {
  isEmbed: boolean;
}

/**
 * React-контекст режима встраивания в родительский сайт
 */
export const EmbedContext = createContext<EmbedContextValue | null>(null);
