import { describe, expect, test } from 'vitest';
import * as entry from '../worker/index';

describe('worker entry module', () => {
  test('exports only the handler (any other export stops the Workers runtime from starting)', () => {
    expect(Object.keys(entry)).toEqual(['default']);
    expect(typeof entry.default.fetch).toBe('function');
  });
});
