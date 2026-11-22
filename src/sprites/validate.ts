import type { SpriteDef } from './types';

/**
 * Checks a sprite against the one-grid rules. Returns a list of problems (empty means valid).
 * Run over every sprite by tests, so a malformed sprite fails the build instead of shipping.
 */
export function validateSprite(name: string, def: SpriteDef): string[] {
  const problems: string[] = [];
  const bad = (msg: string) => problems.push(`${name}: ${msg}`);

  if (!Number.isInteger(def.w) || def.w <= 0) bad(`width ${def.w} is not a positive integer`);
  if (!Number.isInteger(def.h) || def.h <= 0) bad(`height ${def.h} is not a positive integer`);

  for (const [key, colour] of Object.entries(def.palette)) {
    if (key.length !== 1) bad(`palette key "${key}" must be a single character`);
    if (key === '.') bad('palette key "." is reserved for transparent pixels');
    if (!/^#[0-9A-Fa-f]{6}$/.test(colour)) bad(`palette colour for "${key}" is not #RRGGBB: ${colour}`);
  }

  if (def.frames.length < 1 || def.frames.length > 2) {
    bad(`has ${def.frames.length} frames; only 1 or 2 are supported`);
  }

  const used = new Set<string>();
  def.frames.forEach((frame, f) => {
    if (frame.length !== def.h) bad(`frame ${f} has ${frame.length} rows, expected ${def.h}`);
    frame.forEach((row, y) => {
      if (row.length !== def.w) bad(`frame ${f} row ${y} is ${row.length} wide, expected ${def.w}`);
      for (const ch of row) {
        if (ch === '.') continue;
        used.add(ch);
        if (!(ch in def.palette)) bad(`frame ${f} row ${y} uses "${ch}" which is not in the palette`);
      }
    });
    if (frame.every((row) => /^\.*$/.test(row))) bad(`frame ${f} is completely transparent`);
  });

  for (const key of Object.keys(def.palette)) {
    if (!used.has(key)) bad(`palette key "${key}" is never used`);
  }

  if (def.frames.length === 2 && def.frames[0]!.join('\n') === def.frames[1]!.join('\n')) {
    bad('both frames are identical, so there is nothing to animate');
  }

  return problems;
}
