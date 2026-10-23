/**
 * Imports from packages
 */
import { useRef } from 'react';

/**
 * Imports from infrastructure
 */
import { trackAction } from '@infrastructure/analytics/metrics';

/**
 * Imports from presentation
 */
import { useLocale } from '@presentation/i18n/useLocale';
import { readTextFile } from '@presentation/files/text-file';

interface FileOpenButtonProps {
  onLoad: (text: string, fileName: string) => void;
  onLoadFile?: (file: File) => boolean | Promise<boolean>;
}

/**
 * Кнопка открытия локального текстового файла
 *
 * @param onLoad Текст и имя выбранного файла
 * @param onLoadFile Свой разбор файла, если вернул true
 */
export function FileOpenButton({ onLoad, onLoadFile }: FileOpenButtonProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="tui-inline-cmd"
        onClick={() => inputRef.current?.click()}
      >
        {`"${t('open')}"`}
      </button>
      <input
        ref={inputRef}
        type="file"
        className="file-input"
        aria-label={t('openFile')}
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.target.value = '';

          if (!file) {
            return;
          }

          trackAction('open');

          void (async () => {
            if (onLoadFile && (await onLoadFile(file))) {
              return;
            }

            onLoad(await readTextFile(file), file.name);
          })();
        }}
      />
    </>
  );
}
