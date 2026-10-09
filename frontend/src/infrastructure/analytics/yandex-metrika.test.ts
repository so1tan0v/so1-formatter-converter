/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import {
  YANDEX_METRIKA_COUNTER_ID,
  isYandexMetrikaEnabled,
  yandexMetrikaCounterHtml,
} from './yandex-metrika';

describe('isYandexMetrikaEnabled', () => {
  it('выключена без переменной и на false/0', () => {
    expect(isYandexMetrikaEnabled(undefined)).toBe(false);
    expect(isYandexMetrikaEnabled('')).toBe(false);
    expect(isYandexMetrikaEnabled('false')).toBe(false);
    expect(isYandexMetrikaEnabled('0')).toBe(false);
  });

  it('включается на 1, true, yes и on', () => {
    expect(isYandexMetrikaEnabled('1')).toBe(true);
    expect(isYandexMetrikaEnabled(' TRUE ')).toBe(true);
    expect(isYandexMetrikaEnabled('yes')).toBe(true);
    expect(isYandexMetrikaEnabled('on')).toBe(true);
  });

  it('читает YANDEX_METRIKA_ENABLED из окружения', () => {
    const previous = process.env.YANDEX_METRIKA_ENABLED;

    try {
      process.env.YANDEX_METRIKA_ENABLED = 'true';
      expect(isYandexMetrikaEnabled()).toBe(true);
      expect(yandexMetrikaCounterHtml()).toContain(
        `tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`,
      );

      process.env.YANDEX_METRIKA_ENABLED = 'false';
      expect(yandexMetrikaCounterHtml()).toBe('');
    } finally {
      if (previous === undefined) {
        delete process.env.YANDEX_METRIKA_ENABLED;
      } else {
        process.env.YANDEX_METRIKA_ENABLED = previous;
      }
    }
  });
});

describe('yandexMetrikaCounterHtml', () => {
  it('не вставляет счётчик, пока он выключен', () => {
    expect(yandexMetrikaCounterHtml(YANDEX_METRIKA_COUNTER_ID, false)).toBe('');
  });

  it('подставляет номер счётчика в загрузчик, init и пиксель', () => {
    const html = yandexMetrikaCounterHtml(YANDEX_METRIKA_COUNTER_ID, true);

    expect(html).toContain(
      `https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_COUNTER_ID}`,
    );
    expect(html).toContain(`ym(${YANDEX_METRIKA_COUNTER_ID}, 'init'`);
    expect(html).toContain(
      `https://mc.yandex.ru/watch/${YANDEX_METRIKA_COUNTER_ID}`,
    );
  });

  it('берёт номер из аргумента, а не из константы', () => {
    const html = yandexMetrikaCounterHtml(1, true);

    expect(html).toContain('tag.js?id=1');
    expect(html).toContain("ym(1, 'init'");
    expect(html).not.toContain(String(YANDEX_METRIKA_COUNTER_ID));
  });
});
