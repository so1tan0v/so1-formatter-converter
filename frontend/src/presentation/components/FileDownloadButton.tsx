/**
 * Imports from presentation
 */
import { downloadTextFile } from '@presentation/files/text-file';

interface FileDownloadButtonProps {
  fileName: string;
  text: string;
  disabled?: boolean;
}

/**
 * Кнопка скачивания текста как файла
 *
 * @param fileName Имя сохраняемого файла
 * @param text Содержимое файла
 * @param disabled Признак, что скачивание сейчас недоступно
 */
export function FileDownloadButton({
  fileName,
  text,
  disabled = false,
}: FileDownloadButtonProps) {
  return (
    <button
      type="button"
      className="tui-inline-cmd"
      disabled={disabled || text.length === 0}
      onClick={() => downloadTextFile(fileName, text)}
    >
      &quot;Download&quot;
    </button>
  );
}
