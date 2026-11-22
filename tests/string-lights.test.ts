import { describe, expect, test } from 'vitest';
import { layoutLights, swagY } from '../src/lib/string-lights';

const wide = { swagWidth: 640, swags: 2, sag: 36, spacing: 64 };
const narrow = { swagWidth: 192, swags: 4, sag: 24, spacing: 64 };

describe('layoutLights', () => {
  test('wire height is pinned at both ends of a swag and sags in the middle, on the 4px grid', () => {
    expect(swagY(0, 640, 36)).toBe(4);
    expect(swagY(320, 640, 36)).toBe(40);
    for (let x = 0; x < 640; x += 8) expect(swagY(x, 640, 36) % 4).toBe(0);
  });

  test('every coordinate is a multiple of 4 (the pixel grid)', () => {
    for (const opts of [wide, narrow]) {
      const { wire, bulbs } = layoutLights(opts);
      for (const s of wire) for (const v of [s.x, s.y, s.w]) expect(v % 4).toBe(0);
      for (const b of bulbs) for (const v of [b.x, b.y]) expect(v % 4).toBe(0);
    }
  });

  test('the wire is one unbroken run across the whole width', () => {
    for (const opts of [wide, narrow]) {
      const { wire, width } = layoutLights(opts);
      expect(width).toBe(opts.swagWidth * opts.swags);
      const sorted = [...wire].sort((a, b) => a.x - b.x);
      let cursor = 0;
      for (const seg of sorted) {
        expect(seg.x).toBe(cursor);
        cursor += seg.w;
      }
      expect(cursor).toBe(width);
    }
  });

  test('equal-height wire steps are merged into one rect', () => {
    const { wire } = layoutLights(wide);
    for (let i = 1; i < wire.length; i++) {
      const a = wire[i - 1]!;
      const b = wire[i]!;
      if (a.x + a.w === b.x) expect(a.y).not.toBe(b.y);
    }
  });

  test('bulbs hang every 64px, 10 to a wide swag and 3 to a narrow one, and cycle through four colours', () => {
    const w = layoutLights(wide);
    expect(w.bulbs).toHaveLength(20);
    expect(w.bulbs[1]!.x - w.bulbs[0]!.x).toBe(64);
    expect(new Set(w.bulbs.map((b) => b.colour))).toEqual(new Set([0, 1, 2, 3]));
    expect(layoutLights(narrow).bulbs).toHaveLength(12);
  });

  test('twinkle delays are staggered so nothing pulses in sync', () => {
    const delays = layoutLights(wide).bulbs.map((b) => b.delay);
    expect(new Set(delays).size).toBeGreaterThan(5);
  });
});
