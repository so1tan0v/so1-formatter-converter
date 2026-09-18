export interface KeyValueStorage {
  /**
   * Читает значение по ключу
   *
   * @param key Ключ записи
   */
  getItem(key: string): string | null;

  /**
   * Записывает значение по ключу
   *
   * @param key Ключ записи
   * @param value Строковое значение
   */
  setItem(key: string, value: string): void;
}
