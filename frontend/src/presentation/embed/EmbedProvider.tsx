/**
 * Imports from packages
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * Imports from presentation
 */
import { EmbedContext } from '@presentation/embed/embed-context';
import {
  createConverterEmbedExitMessage,
  isConverterEmbedThemeMessage,
  isEmbedExitShortcut,
  parentOriginFromReferrer,
} from '@presentation/embed/protocol';
import {
  applyEmbedFlag,
  readBootAppearance,
  readEmbedFlag,
  themeIdFromScheme,
} from '@presentation/embed/query';
import { useTheme } from '@presentation/theme/useTheme';

interface EmbedProviderProps {
  children: ReactNode;
}

/**
 * Провайдер iframe-режима: скрывает окно, синхронизирует тему и сообщает родителю о выходе
 *
 * @param children Дочерние элементы приложения
 */
export function EmbedProvider({ children }: EmbedProviderProps) {
  const { setThemeId } = useTheme();
  const [isEmbed] = useState(() => {
    const boot = readBootAppearance(window.location.search);

    return boot.isEmbed || readEmbedFlag();
  });
  const value = useMemo(() => ({ isEmbed }), [isEmbed]);

  useEffect(() => {
    applyEmbedFlag(isEmbed);
  }, [isEmbed]);

  useEffect(() => {
    if (!isEmbed) {
      return;
    }

    const parentOrigin = parentOriginFromReferrer(document.referrer);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isEmbedExitShortcut(event)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage(
        createConverterEmbedExitMessage(),
        parentOrigin,
      );
    };

    const onMessage = (event: MessageEvent) => {
      if (!isConverterEmbedThemeMessage(event.data)) {
        return;
      }

      setThemeId(themeIdFromScheme(event.data.theme));
    };

    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('message', onMessage);
    };
  }, [isEmbed, setThemeId]);

  return (
    <EmbedContext.Provider value={value}>{children}</EmbedContext.Provider>
  );
}
