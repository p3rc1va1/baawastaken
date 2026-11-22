import { describe, expect, test } from 'vitest';
import { read, rel, root, walk } from './helpers';

const HEX = /#[0-9a-fA-F]{3,8}\b/g;

describe('colour tokens', () => {
  // Raw hex colours are allowed only in tokens.css, sprite palettes and site data.
  const allowed = (file: string) =>
    file.endsWith('src/styles/tokens.css') ||
    file.includes('/src/sprites/') ||
    file.includes('/src/data/');

  test('no raw hex colours outside tokens, sprite palettes and data', () => {
    const files = walk(`${root}src`, ['.css', '.astro', '.ts']).filter((f) => !allowed(f));
    const offenders: string[] = [];
    for (const file of files) {
      const hits = read(file).match(HEX);
      if (hits) offenders.push(`${rel(file)}: ${[...new Set(hits)].join(', ')}`);
    }
    expect(offenders).toEqual([]);
  });

  test('every token colour is a valid hex value', () => {
    const tokens = read(`${root}src/styles/tokens.css`);
    const decls = [...tokens.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]+)\s*;/g)];
    expect(decls.length).toBeGreaterThan(30);
    for (const [, name, value] of decls) {
      expect(value, `--${name}`).toMatch(/^#([0-9a-fA-F]{6})$/);
    }
  });

  test('--px is 4px and spacing steps are multiples of it', () => {
    const tokens = read(`${root}src/styles/tokens.css`);
    expect(tokens).toMatch(/--px:\s*4px;/);
    for (const [, name] of tokens.matchAll(/--(s\d+):\s*calc\(var\(--px\) \* \d+\);/g)) {
      expect(name).toMatch(/^s\d+$/);
    }
  });
});

describe('motion', () => {
  const motion = read(`${root}src/styles/motion.css`);

  function reducedBlock(css: string): string {
    const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(start, 'reduced-motion block exists').toBeGreaterThan(-1);
    let depth = 0;
    for (let i = css.indexOf('{', start); i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}' && --depth === 0) return css.slice(start, i + 1);
    }
    throw new Error('unterminated reduced-motion block');
  }

  const reduced = reducedBlock(motion);
  const outside = motion.replace(reduced, '');

  test('reduced motion nulls every animation and transition', () => {
    expect(reduced).toMatch(/\*,\s*\*::before,\s*\*::after\s*{[^}]*animation:\s*none\s*!important/);
    expect(reduced).toMatch(/transition:\s*none\s*!important/);
  });

  test('reduced motion shows only the first frame and hides transient effects', () => {
    expect(reduced).toMatch(/\.fb\s*{\s*opacity:\s*0/);
    for (const cls of ['steam', 'z', 'shoot', 'scan', 'mote']) {
      expect(reduced, `.${cls}`).toContain(`.${cls}`);
    }
  });

  test('every animation is stepped (moves in whole pixels or frames)', () => {
    const anims = [...outside.matchAll(/animation:\s*([^;]+);/g)].map((m) => m[1]!);
    expect(anims.length).toBeGreaterThan(10);
    for (const a of anims) expect(a, a).toContain('steps(');
  });

  test('only transform and opacity are animated', () => {
    const frames = [...outside.matchAll(/@keyframes [\w-]+\s*{([\s\S]*?)\n}\n/g)].map((m) => m[1]!);
    expect(frames.length).toBeGreaterThan(8);
    for (const body of frames) {
      for (const [, prop] of body.matchAll(/([a-z-]+):\s*[^;{]+;/g)) {
        expect(['transform', 'opacity'], prop).toContain(prop);
      }
    }
  });

  test('no component declares its own keyframes or animation', () => {
    const files = walk(`${root}src`, ['.astro', '.css']).filter((f) => !f.endsWith('motion.css'));
    const offenders = files.filter((f) => /@keyframes|[^-]animation\s*:/.test(read(f))).map(rel);
    expect(offenders).toEqual([]);
  });
});
