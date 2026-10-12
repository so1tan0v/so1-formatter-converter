/**
 * Собирает имя скачиваемого файла из открытого имени или запасного
 *
 * @param openedName Имя открытого файла, если пользователь его выбирал
 * @param fallbackStem Имя без расширения, когда файл ещё не открывали
 * @param extension Расширение без точки
 */
export function fileNameFor(
  openedName: string | null,
  fallbackStem: string,
  extension: string,
): string {
  const stem = stemOf(openedName) ?? fallbackStem;

  return `${stem}.${extension}`;
}

/**
 * Читает локальный файл как текст
 *
 * @param file Файл, выбранный пользователем
 */
export function readTextFile(file: File): Promise<string> {
  return file.text();
}

/**
 * Скачивает текст как файл в браузере
 *
 * @param fileName Имя сохраняемого файла
 * @param text Содержимое файла
 */
export function downloadTextFile(fileName: string, text: string): void {
  downloadBlob(
    fileName,
    new Blob([text], { type: 'text/plain;charset=utf-8' }),
  );
}

/**
 * Скачивает байты как файл в браузере
 *
 * @param fileName Имя сохраняемого файла
 * @param bytes Содержимое файла
 * @param mime MIME-тип содержимого
 */
export function downloadBytes(
  fileName: string,
  bytes: Uint8Array,
  mime: string,
): void {
  const copy = new Uint8Array(bytes);

  downloadBlob(fileName, new Blob([copy], { type: mime }));
}

function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function stemOf(name: string | null): string | null {
  if (!name) {
    return null;
  }

  const base = name.split(/[/\\]/).pop() ?? name;
  const dot = base.lastIndexOf('.');

  if (dot <= 0) {
    return base || null;
  }

  return base.slice(0, dot);
}
