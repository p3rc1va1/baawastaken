import sharp from 'sharp';
import { describe, expect, test } from 'vitest';
import { root } from './helpers';

describe('share image', () => {
  test('public/og.png is exactly 1200×630', async () => {
    const meta = await sharp(`${root}public/og.png`).metadata();
    expect([meta.width, meta.height, meta.format]).toEqual([1200, 630, 'png']);
  });

  test('it is not blank: it uses the wall, the cream tiles and the jade support tile', async () => {
    const { data } = await sharp(`${root}public/og.png`).raw().toBuffer({ resolveWithObject: true });
    const seen = new Set<string>();
    for (let i = 0; i < data.length; i += 3) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
    for (const colour of ['50,61,57' /* wall */, '249,238,191' /* cream */, '58,148,112' /* jade */]) {
      expect(seen.has(colour), colour).toBe(true);
    }
  });
});
