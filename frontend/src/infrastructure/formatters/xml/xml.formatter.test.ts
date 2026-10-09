/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import { DEFAULT_XML_OPTIONS } from '@domain/formatter/types';

/**
 * Imports from relative
 */
import { XmlFormatter } from './xml.formatter';

describe('XmlFormatter', () => {
  const formatter = new XmlFormatter();

  it('раскладывает документ по строкам и сохраняет пустой элемент', () => {
    const result = formatter.format(
      '<root><item id="1" kind="note">Ada</item><empty/></root>',
      DEFAULT_XML_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe(
        [
          '<root>',
          '  <item id="1" kind="note">Ada</item>',
          '  <empty />',
          '</root>',
        ].join('\n'),
      );
    }
  });

  it('собирает документ в одну строку', () => {
    const result = formatter.format('<root>\n  <item>Ada</item>\n</root>\n', {
      ...DEFAULT_XML_OPTIONS,
      mode: 'compact',
    });

    expect(result.ok && result.value).toBe('<root><item>Ada</item></root>');
  });

  it('оставляет объявление документа', () => {
    const result = formatter.format(
      '<?xml version="1.0" encoding="UTF-8"?><root><child/></root>',
      DEFAULT_XML_OPTIONS,
    );

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(
        result.value.startsWith('<?xml version="1.0" encoding="UTF-8"?>'),
      ).toBe(true);
      expect(result.value).toContain('<child />');
    }
  });

  it('сообщает строку сломанного документа', () => {
    const result = formatter.format('<a><b></a>', DEFAULT_XML_OPTIONS);

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toMatch(/at line \d+, column \d+/);
    }
  });

  it('не форматирует пустой ввод', () => {
    expect(formatter.format('   ', DEFAULT_XML_OPTIONS)).toEqual({
      ok: false,
      error: 'Empty input',
    });
  });
});
