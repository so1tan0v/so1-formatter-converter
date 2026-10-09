/**
 * Imports from packages
 */
import type { editor } from 'monaco-editor';

/**
 * Настройки миникарты в духе CodeGlance: схема файла справа от редактора
 *
 * @param enabled Показывать схему. На узком экране её прячем
 */
export function codeGlanceMinimap(
  enabled: boolean,
): editor.IEditorMinimapOptions {
  return {
    enabled,
    autohide: false,
    side: 'right',
    size: 'proportional',
    showSlider: 'always',
    renderCharacters: true,
    maxColumn: 120,
    scale: 1,
    showRegionSectionHeaders: true,
    showMarkSectionHeaders: true,
  };
}
