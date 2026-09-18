/**
 * Imports from presentation
 */
import { AsciiFrame } from '@presentation/components/AsciiFrame';

interface SoonPanelProps {
  title: string;
  hint: string;
  message: string;
}

/**
 * Заглушка для раздела, который еще не готов
 *
 * @param title Заголовок панели
 * @param hint Краткая подпись рядом с заголовком
 * @param message Поясняющий текст для пользователя
 */
export function SoonPanel({ title, hint, message }: SoonPanelProps) {
  return (
    <AsciiFrame title={title} hint={hint}>
      <div className="tui-fetch">
        <p className="tui-help tui-help--block">{message}</p>
        <p>
          <span className="tui-fetch__key">Status</span>
          <span className="tui-fetch__sep">:</span>{' '}
          <span className="tui-fetch__val tui-fetch__val--warn">soon</span>
        </p>
      </div>
    </AsciiFrame>
  );
}
