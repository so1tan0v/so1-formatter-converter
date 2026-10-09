/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { parseJsonPath, selectJsonPath } from './json.path';

const document = {
  user: { name: 'Ada', profile: { city: 'Paris' } },
  items: [{ id: 1 }, { id: 2 }],
  'a.b': true,
};

describe('parseJsonPath', () => {
  it('разбирает точки, индексы и кавычки', () => {
    expect(parseJsonPath('user.profile.city')).toEqual({
      ok: true,
      value: ['user', 'profile', 'city'],
    });
    expect(parseJsonPath('items[0].id')).toEqual({
      ok: true,
      value: ['items', '0', 'id'],
    });
    expect(parseJsonPath('items.0.id')).toEqual({
      ok: true,
      value: ['items', '0', 'id'],
    });
    expect(parseJsonPath('["a.b"]')).toEqual({ ok: true, value: ['a.b'] });
    expect(parseJsonPath('')).toEqual({ ok: true, value: [] });
  });

  it('отклоняет оборванный путь', () => {
    expect(parseJsonPath('user.').ok).toBe(false);
    expect(parseJsonPath('user[').ok).toBe(false);
  });
});

describe('selectJsonPath', () => {
  it('возвращает вложенное значение', () => {
    expect(selectJsonPath(document, 'user.profile.city')).toEqual({
      ok: true,
      value: 'Paris',
    });
    expect(selectJsonPath(document, 'items[1].id')).toEqual({
      ok: true,
      value: 2,
    });
    expect(selectJsonPath(document, '["a.b"]')).toEqual({
      ok: true,
      value: true,
    });
  });

  it('сообщает, где путь оборвался', () => {
    const result = selectJsonPath(document, 'user.missing');

    expect(result.ok).toBe(false);

    if (!result.ok) {
      expect(result.error).toBe('Nothing at user.missing');
    }
  });
});
