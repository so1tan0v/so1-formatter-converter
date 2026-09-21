/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from presentation
 */
import { THEME_ID_DARK, THEME_ID_LIGHT } from '@presentation/theme/catalog';
import {
  readBootAppearance,
  themeIdFromScheme,
} from '@presentation/embed/query';

describe('readBootAppearance', () => {
  it('detects embed mode and light theme from query', () => {
    expect(readBootAppearance('?embed=1&theme=light')).toEqual({
      isEmbed: true,
      scheme: 'light',
      themeId: THEME_ID_LIGHT,
    });
  });

  it('defaults to dark theme outside embed', () => {
    expect(readBootAppearance('')).toEqual({
      isEmbed: false,
      scheme: null,
      themeId: THEME_ID_DARK,
    });
  });

  it('maps parent schemes to theme ids', () => {
    expect(themeIdFromScheme('dark')).toBe(THEME_ID_DARK);
    expect(themeIdFromScheme('light')).toBe(THEME_ID_LIGHT);
  });
});
