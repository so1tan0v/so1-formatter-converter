/**
 * Имя пользовательского события для команд интерфейса
 */
export const TUI_COMMAND_EVENT = 'tui-command';

export type TuiCommand = 'format' | 'convert' | 'sample' | 'copy';

/**
 * Отправляет команду интерфейса через пользовательское событие документа
 *
 * @param command Команда: форматировать, преобразовать, подставить образец или копировать
 */
export function dispatchTuiCommand(command: TuiCommand): void {
  document.dispatchEvent(
    new CustomEvent<TuiCommand>(TUI_COMMAND_EVENT, { detail: command }),
  );
}
