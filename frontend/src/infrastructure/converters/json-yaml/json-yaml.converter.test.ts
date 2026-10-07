/**
 * Imports from packages
 */
import { describe, expect, it } from 'vitest';

/**
 * Imports from relative
 */
import { jsonToYaml } from './json-to-yaml';
import { yamlToJson } from './yaml-to-json';

describe('json ↔ yaml', () => {
  it('converts json objects to yaml', () => {
    expect(jsonToYaml('{"name":"Ada","active":true}')).toContain('name: Ada');
  });

  it('converts yaml back to json', () => {
    const json = yamlToJson('name: Ada\nactive: true\n');

    expect(JSON.parse(json)).toEqual({ name: 'Ada', active: true });
  });
});
