import { describe, expect, test } from 'vitest';
import { sprites } from '../src/sprites';
import type { SpriteDef } from '../src/sprites/types';
import { validateSprite } from '../src/sprites/validate';

const ok: SpriteDef = { w: 2, h: 2, palette: { a: '#112233' }, frames: [['aa', '.a']] };

describe('validateSprite catches broken sprites', () => {
  const cases: Array<[string, SpriteDef, RegExp]> = [
    ['ragged row', { ...ok, frames: [['aa', '.']] }, /row 1 is 1 wide, expected 2/],
    ['missing row', { ...ok, frames: [['aa']] }, /has 1 rows, expected 2/],
    ['unknown glyph', { ...ok, frames: [['aa', '.z']] }, /"z" which is not in the palette/],
    ['unused palette key', { ...ok, palette: { a: '#112233', b: '#445566' } }, /"b" is never used/],
    ['bad colour', { ...ok, palette: { a: 'red' } }, /not #RRGGBB/],
    ['reserved key', { ...ok, palette: { '.': '#112233', a: '#112233' } }, /reserved for transparent/],
    ['multi-char key', { ...ok, palette: { ab: '#112233', a: '#112233' } }, /single character/],
    ['three frames', { ...ok, frames: [['aa', '.a'], ['a.', 'aa'], ['.a', 'a.']] }, /only 1 or 2/],
    ['identical frames', { ...ok, frames: [['aa', '.a'], ['aa', '.a']] }, /identical/],
    ['empty frame', { ...ok, frames: [['..', '..']] }, /completely transparent/],
    ['fractional size', { ...ok, w: 2.5 }, /width 2.5/],
  ];

  test.each(cases)('%s', (_name, def, expected) => {
    expect(validateSprite('fixture', def).join('\n')).toMatch(expected);
  });

  test('a good sprite has no problems', () => {
    expect(validateSprite('fixture', ok)).toEqual([]);
  });
});

describe('real sprites', () => {
  test('there is a sprite registry worth checking', () => {
    expect(Object.keys(sprites).length).toBeGreaterThanOrEqual(22);
  });

  test.each(Object.entries(sprites))('%s is valid', (name, def) => {
    expect(validateSprite(name, def)).toEqual([]);
  });

  test('all seven platform logos share one 12×12 slot', () => {
    const logos = ['youtube', 'twitch', 'kick', 'discord', 'instagram', 'tiktok', 'kofi'] as const;
    for (const name of logos) {
      expect([sprites[name].w, sprites[name].h], name).toEqual([12, 12]);
    }
  });

  test('two-frame sprites keep both frames the same size', () => {
    const animated = Object.entries(sprites).filter(([, d]) => d.frames.length === 2).map(([n]) => n);
    expect(animated.sort()).toEqual(['cat', 'catAwake', 'pendulum', 'plant']);
  });
});

describe('logo rendering size', () => {
  test('each logo renders at 48×48 CSS px (12 art pixels × --px of 4px)', async () => {
    const { experimental_AstroContainer: AstroContainer } = await import('astro/container');
    const { default: Sprite } = await import('../src/components/Sprite.astro');
    const tokens = (await import('node:fs')).readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
    const px = Number(/--px:\s*(\d+)px/.exec(tokens)![1]);
    expect(px).toBe(4);

    const container = await AstroContainer.create();
    for (const name of ['youtube', 'twitch', 'kick', 'discord', 'instagram', 'tiktok', 'kofi'] as const) {
      const html = await container.renderToString(Sprite, { props: { sprite: sprites[name] } });
      expect(html, name).toContain('width: calc(var(--px) * 12); height: calc(var(--px) * 12);');
      expect(html, name).toContain(`width="${12 * px}" height="${12 * px}"`);
    }
  });
});
