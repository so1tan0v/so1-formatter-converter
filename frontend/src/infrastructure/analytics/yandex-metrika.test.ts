/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import {
  YANDEX_METRIKA_COUNTER_ID,
  yandexMetrikaCounterHtml,
} from './yandex-metrika';

describe('yandexMetrikaCounterHtml', () => {
  it('подставляет номер счётчика в загрузчик, init и пиксель', () => {
    const html = yandexMetrikaCounterHtml();

    expect(html).toContain(
      `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`,
    );
    expect(html).toContain(`ym(${YANDEX_METRIKA_COUNTER_ID}, 'init'`);
    expect(html).toContain(
      `https://mc.yandex.ru/watch/${YANDEX_METRIKA_COUNTER_ID}`,
    );
  });

  it('берёт номер из аргумента, а не из константы', () => {
    const html = yandexMetrikaCounterHtml(1);

    expect(html).toContain('tag.js?id=1');
    expect(html).toContain("ym(1, 'init'");
    expect(html).not.toContain(String(YANDEX_METRIKA_COUNTER_ID));
  });
});
