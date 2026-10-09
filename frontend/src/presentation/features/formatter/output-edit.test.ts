/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { acceptOutputEdit, trackDisplayedOutput } from './output-edit';

describe('acceptOutputEdit', () => {
  it('не затирает input эхом после форматирования', () => {
    const shown = trackDisplayedOutput(
      { mirror: 'raw', ignoreNext: false },
      'pretty',
    );
    const echo = acceptOutputEdit(shown, 'pretty', false);

    expect(shown.ignoreNext).toBe(true);
    expect(echo.writeBack).toBeNull();
    expect(echo.state.ignoreNext).toBe(true);
    expect(echo.state.mirror).toBe('pretty');
  });

  it('записывает правку отформатированного текста во input', () => {
    const edited = acceptOutputEdit(
      { mirror: 'pretty', ignoreNext: false },
      'pretty!',
      false,
    );

    expect(edited.writeBack).toBe('pretty!');
    expect(edited.state.mirror).toBe('pretty!');
  });

  it('не записывает текст ошибки', () => {
    const shown = trackDisplayedOutput(
      { mirror: '', ignoreNext: false },
      'Bad JSON',
    );
    const echo = acceptOutputEdit(shown, 'Bad JSON', true);

    expect(echo.writeBack).toBeNull();
  });

  it('после внешнего обновления принимает следующую правку', () => {
    const shown = trackDisplayedOutput(
      { mirror: 'a', ignoreNext: false },
      'aa',
    );
    const released = { ...shown, ignoreNext: false };
    const edited = acceptOutputEdit(released, 'aab', false);

    expect(edited.writeBack).toBe('aab');
  });
});
