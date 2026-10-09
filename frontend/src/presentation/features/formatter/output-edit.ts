export interface OutputEchoState {
  mirror: string;
  ignoreNext: boolean;
}

/**
 * Запоминает текст, который пришёл в отформатированную панель снаружи,
 * и просит пропустить ответный onChange редактора
 *
 * @param state Текущее состояние зеркала
 * @param displayed Текст, который сейчас показывает панель
 */
export function trackDisplayedOutput(
  state: OutputEchoState,
  displayed: string,
): OutputEchoState {
  if (state.mirror === displayed) {
    return state;
  }

  return { mirror: displayed, ignoreNext: true };
}

/**
 * Решает, нужно ли записать правку отформатированного текста во input
 *
 * @param state Текущее состояние зеркала
 * @param next Текст после изменения редактора
 * @param hasError Панель показывает ошибку, а не отформатированный текст
 */
export function acceptOutputEdit(
  state: OutputEchoState,
  next: string,
  hasError: boolean,
): { state: OutputEchoState; writeBack: string | null } {
  if (state.ignoreNext || hasError || next === state.mirror) {
    return { state, writeBack: null };
  }

  return {
    state: { mirror: next, ignoreNext: false },
    writeBack: next,
  };
}
