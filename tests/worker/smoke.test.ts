import { expect, test } from 'vitest';
import { defaultCache } from '../../worker/config';

test('tests run inside the Workers runtime', () => {
  expect(typeof HTMLRewriter).toBe('function');
  expect(typeof defaultCache().match).toBe('function');
});
