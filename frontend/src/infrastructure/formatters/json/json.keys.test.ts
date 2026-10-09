/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { convertJsonKey } from './json.keys';

describe('convertJsonKey', () => {
  it('переводит snake_case в camelCase и CamelCase', () => {
    expect(convertJsonKey('user_name', 'camel')).toBe('userName');
    expect(convertJsonKey('user_name', 'pascal')).toBe('UserName');
    expect(convertJsonKey('API_KEY', 'camel')).toBe('apiKey');
    expect(convertJsonKey('user_id_2', 'camel')).toBe('userId2');
  });

  it('переводит camelCase и CamelCase обратно в snake_case', () => {
    expect(convertJsonKey('userName', 'snake')).toBe('user_name');
    expect(convertJsonKey('UserName', 'snake')).toBe('user_name');
    expect(convertJsonKey('HTMLParser', 'snake')).toBe('html_parser');
    expect(convertJsonKey('userID', 'snake')).toBe('user_id');
  });

  it('оставляет ключ без изменений в режиме as-is и сохраняет ведущие подчёркивания', () => {
    expect(convertJsonKey('user_name', 'as-is')).toBe('user_name');
    expect(convertJsonKey('_user_name', 'camel')).toBe('_userName');
    expect(convertJsonKey('_userName', 'snake')).toBe('_user_name');
  });
});
