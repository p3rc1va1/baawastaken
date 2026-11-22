import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { describe, expect, test } from 'vitest';
import Sprite from '../src/components/Sprite.astro';
import { spriteRects } from '../src/lib/sprite-rects';
import type { SpriteDef } from '../src/sprites/types';

const palette = { a: '#111111', b: '#222222', c: '#333333' };

describe('spriteRects', () => {
  test('merges horizontal runs and skips transparent pixels (3×3 fixture)', () => {
    const rects = spriteRects(['aab', '.b.', 'cc.'], palette);
    expect(rects).toEqual([
      { x: 0, y: 0, w: 2, h: 1, fill: '#111111' },
      { x: 2, y: 0, w: 1, h: 1, fill: '#222222' },
      { x: 1, y: 1, w: 1, h: 1, fill: '#222222' },
      { x: 0, y: 2, w: 2, h: 1, fill: '#333333' },
    ]);
  });

  test('a fully transparent frame produces no rectangles', () => {
    expect(spriteRects(['...', '...'], palette)).toEqual([]);
  });

  test('throws when a character has no palette entry', () => {
    expect(() => spriteRects(['az'], palette)).toThrow(/"z"/);
  });
});

describe('<Sprite>', () => {
  const one: SpriteDef = { w: 3, h: 3, palette, frames: [['aab', '.b.', 'cc.']] };
  const two: SpriteDef = { w: 3, h: 3, palette, frames: [['aab', '.b.', 'cc.'], ['bba', '.a.', '.cc']] };

  async function render(props: Record<string, unknown>): Promise<string> {
    const container = await AstroContainer.create();
    return container.renderToString(Sprite, { props });
  }

  test('draws one rect per merged run at art size × --px, hidden from assistive technology', async () => {
    const html = await render({ sprite: one });
    expect(html.match(/<rect /g)).toHaveLength(4);
    expect(html).toContain('viewBox="0 0 3 3"');
    expect(html).toContain('width: calc(var(--px) * 3); height: calc(var(--px) * 3);');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  test('exposes an accessible name only when a label is given', async () => {
    const html = await render({ sprite: one, label: 'A tiny test sprite' });
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A tiny test sprite"');
    expect(html).not.toContain('aria-hidden="true"');
  });

  test('two-frame sprites stack both frames; animation is opt-in', async () => {
    const still = await render({ sprite: two });
    expect(still).toMatch(/class="[^"]*\bfa\b[^"]*"/);
    expect(still).toMatch(/class="[^"]*\bfb\b[^"]*"/);
    expect(still).not.toMatch(/\brun\b/);

    const moving = await render({ sprite: two, animate: true, duration: '3.4s' });
    expect(moving.match(/\brun\b/g)).toHaveLength(2);
    expect(moving).toContain('animation-duration: 3.4s');
  });
});
