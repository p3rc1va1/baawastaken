import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { describe, expect, test } from 'vitest';
import { readPixelArt, toSvg } from '../scripts/avatar-lib';
import { root } from './helpers';

const SOURCE = `${root}media/channel profile image.png`;

async function rgba(input: string | Buffer) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, ...info };
}

describe('avatar', () => {
  test('the native 32×32 avatar scales back ×25 to a pixel-identical copy of the source', async () => {
    const native = await sharp(`${root}src/assets/avatar-32.png`).metadata();
    expect([native.width, native.height]).toEqual([32, 32]);

    const upscaled = await sharp(`${root}src/assets/avatar-32.png`)
      .resize(800, 800, { kernel: 'nearest' })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const source = await rgba(SOURCE);

    expect(upscaled.length).toBe(source.data.length);
    expect(Buffer.compare(upscaled, source.data)).toBe(0);
  });

  test('the generated files are in sync with the script (regenerating changes nothing)', async () => {
    const art = await readPixelArt(SOURCE, 25);
    expect([art.width, art.height]).toEqual([32, 32]);
    const committed = readFileSync(`${root}public/favicon.svg`, 'utf8');
    expect(committed).toBe(toSvg(art));
  });

  test('favicon SVG is small and crisp', () => {
    const svg = readFileSync(`${root}public/favicon.svg`, 'utf8');
    expect(svg).toContain('viewBox="0 0 32 32"');
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg.length).toBeLessThan(10_000);
  });

  test('PNG favicon and touch icon have the right sizes', async () => {
    const fav = await sharp(`${root}public/favicon-32.png`).metadata();
    const touch = await sharp(`${root}public/apple-touch-icon.png`).metadata();
    expect([fav.width, fav.height]).toEqual([32, 32]);
    expect([touch.width, touch.height]).toEqual([180, 180]);
  });

  test('a source that is not an exact pixel grid is rejected', async () => {
    const noisy = await sharp({ create: { width: 50, height: 50, channels: 4, background: '#000000' } })
      .composite([{ input: Buffer.from([255, 255, 255, 255]), raw: { width: 1, height: 1, channels: 4 }, left: 3, top: 3 }])
      .png()
      .toBuffer();
    const tmp = `${root}node_modules/.tmp-noisy.png`;
    await sharp(noisy).toFile(tmp);
    await expect(readPixelArt(tmp, 25)).rejects.toThrow(/not one flat colour/);
  });
});
