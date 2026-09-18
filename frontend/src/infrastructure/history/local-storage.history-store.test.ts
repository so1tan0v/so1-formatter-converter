/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from domain
 */
import type { KeyValueStorage } from '@domain/shared/key-value-storage';

/**
 * Imports from relative
 */
import { LocalStorageHistoryStore } from './local-storage.history-store';

function memoryStorage(): KeyValueStorage {
  const data = new Map<string, string>();

  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
}

describe('LocalStorageHistoryStore', () => {
  it('stores the latest formatted input first', () => {
    const store = new LocalStorageHistoryStore(memoryStorage());

    store.remember('formatter:json', { source: 'a', output: 'A' });
    store.remember('formatter:json', { source: 'b', output: 'B' });

    expect(store.latest('formatter:json')).toMatchObject({
      source: 'b',
      output: 'B',
    });
    expect(store.list('formatter:json')).toHaveLength(2);
  });

  it('does not duplicate the same input and keeps five entries max', () => {
    const store = new LocalStorageHistoryStore(memoryStorage());

    store.remember('formatter:sql', { source: 'select 1', output: 'SELECT 1' });
    store.remember('formatter:sql', {
      source: '  select 1  ',
      output: 'SELECT 1',
    });

    for (let index = 2; index <= 6; index += 1) {
      store.remember('formatter:sql', {
        source: `select ${index}`,
        output: `SELECT ${index}`,
      });
    }

    const entries = store.list('formatter:sql');

    expect(entries).toHaveLength(5);
    expect(
      entries.filter((entry) => entry.source.trim() === 'select 1'),
    ).toHaveLength(0);
    expect(entries[0].source).toBe('select 6');
  });

  it('keeps formatter types isolated', () => {
    const store = new LocalStorageHistoryStore(memoryStorage());

    store.remember('formatter:json', { source: '{a:1}', output: '{"a":1}' });
    store.remember('formatter:yaml', { source: 'a: 1', output: 'a: 1' });

    expect(store.list('formatter:json')).toHaveLength(1);
    expect(store.list('formatter:yaml')).toHaveLength(1);
  });
});
