/**
 * Imports from packages
 */
import { useRef } from 'react';

/**
 * Imports from presentation
 */
import { readTextFile } from '@presentation/files/text-file';

interface FileOpenButtonProps {
  onLoad: (text: string, fileName: string) => void;
}

/**
 * Кнопка открытия локального текстового файла
 *
 * @param onLoad Текст и имя выбранного файла
 */
export function FileOpenButton({ onLoad }: FileOpenButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        className="tui-inline-cmd"
        onClick={() => inputRef.current?.click()}
      >
        &quot;Open&quot;
      </button>
      <input
        ref={inputRef}
        type="file"
        className="file-input"
        aria-label="Open file"
        onChange={(event) => {
          const file = event.target.files?.[0];

          event.target.value = '';

          if (!file) {
            return;
          }

          void readTextFile(file).then((text) => {
            onLoad(text, file.name);
          });
        }}
      />
    </>
  );
}
