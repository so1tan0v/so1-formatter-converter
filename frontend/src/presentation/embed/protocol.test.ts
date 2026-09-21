/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from presentation
 */
import {
  createConverterEmbedExitMessage,
  createConverterEmbedThemeMessage,
  isConverterColorScheme,
  isConverterEmbedExitMessage,
  isConverterEmbedThemeMessage,
  isEmbedExitShortcut,
  parentOriginFromReferrer,
} from '@presentation/embed/protocol';

describe('converter embed protocol', () => {
  it('accepts dark and light schemes only', () => {
    expect(isConverterColorScheme('dark')).toBe(true);
    expect(isConverterColorScheme('light')).toBe(true);
    expect(isConverterColorScheme('terminal')).toBe(false);
  });

  it('recognizes exit and theme messages', () => {
    expect(isConverterEmbedExitMessage(createConverterEmbedExitMessage())).toBe(
      true,
    );
    expect(
      isConverterEmbedThemeMessage(createConverterEmbedThemeMessage('light')),
    ).toBe(true);
    expect(isConverterEmbedExitMessage({ source: 'other', type: 'exit' })).toBe(
      false,
    );
  });

  it('reads parent origin from referrer', () => {
    expect(parentOriginFromReferrer('https://alex.soltanov.dev/')).toBe(
      'https://alex.soltanov.dev',
    );
    expect(parentOriginFromReferrer('')).toBe('*');
  });

  it('detects Ctrl+C and Command+C without modifiers', () => {
    expect(
      isEmbedExitShortcut({
        key: 'c',
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      isEmbedExitShortcut({
        key: 'c',
        ctrlKey: false,
        metaKey: true,
        altKey: false,
        shiftKey: false,
      }),
    ).toBe(true);
    expect(
      isEmbedExitShortcut({
        key: 'c',
        ctrlKey: true,
        metaKey: false,
        altKey: false,
        shiftKey: true,
      }),
    ).toBe(false);
  });
});
