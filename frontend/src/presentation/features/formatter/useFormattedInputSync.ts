/**
 * Imports from packages
 */
import { useCallback, useEffect, useRef } from 'react';

/**
 * Imports from relative
 */
import { acceptOutputEdit, trackDisplayedOutput } from './output-edit';
import type { OutputEchoState } from './output-edit';

/**
 * Возвращает обработчик правок отформатированной панели.
 * Внешняя подстановка результата пропускается, ручная правка пишется во input
 *
 * @param displayed Текст, который сейчас показывает панель
 * @param hasError Панель показывает ошибку, а не отформатированный текст
 * @param onUserEdit Запись пользовательской правки во input и в результат
 */
export function useFormattedInputSync(
  displayed: string,
  hasError: boolean,
  onUserEdit: (next: string) => void,
): (next: string) => void {
  const stateRef = useRef<OutputEchoState>({
    mirror: displayed,
    ignoreNext: false,
  });
  const hasErrorRef = useRef(hasError);
  const onUserEditRef = useRef(onUserEdit);

  stateRef.current = trackDisplayedOutput(stateRef.current, displayed);
  hasErrorRef.current = hasError;
  onUserEditRef.current = onUserEdit;

  useEffect(() => {
    if (!stateRef.current.ignoreNext) {
      return;
    }

    stateRef.current = { ...stateRef.current, ignoreNext: false };
  }, [displayed]);

  return useCallback((next: string) => {
    const result = acceptOutputEdit(
      stateRef.current,
      next,
      hasErrorRef.current,
    );

    stateRef.current = result.state;

    if (result.writeBack !== null) {
      onUserEditRef.current(result.writeBack);
    }
  }, []);
}
