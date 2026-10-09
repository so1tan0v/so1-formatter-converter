/**
 * Imports from packages
 */
import { useFormikContext } from 'formik';
import { useEffect, type MutableRefObject } from 'react';

interface DebouncedSubmitProps {
  signature: string;
  skip?: MutableRefObject<boolean>;
  delay?: number;
}

/**
 * Отправляет форму, когда меняется подпись значений, с короткой задержкой
 *
 * @param signature Слепок значений, от которых зависит результат
 * @param skip Если true, ближайшее изменение пропускается и флаг сбрасывается
 * @param delay Задержка перед отправкой, мс
 */
export function DebouncedSubmit({
  signature,
  skip,
  delay = 200,
}: DebouncedSubmitProps) {
  const { submitForm } = useFormikContext();

  useEffect(() => {
    if (skip?.current) {
      skip.current = false;

      return;
    }

    const timer = window.setTimeout(() => {
      void submitForm();
    }, delay);

    return () => window.clearTimeout(timer);
  }, [delay, signature, skip, submitForm]);

  return null;
}
