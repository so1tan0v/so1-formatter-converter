export const TUI_COMMAND_EVENT = 'tui-command';

export type TuiCommand = 'format' | 'convert' | 'sample' | 'copy';

export function dispatchTuiCommand(command: TuiCommand): void {
  document.dispatchEvent(
    new CustomEvent<TuiCommand>(TUI_COMMAND_EVENT, { detail: command }),
  );
}
