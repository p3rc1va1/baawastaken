export interface Rect {
  x: number;
  y: number;
  w: number;
  h: 1;
  fill: string;
}

/**
 * Turns one ASCII frame into SVG rectangles. Horizontal runs of the same colour become a single
 * rectangle, which keeps the markup small. "." is transparent.
 */
export function spriteRects(frame: readonly string[], palette: Readonly<Record<string, string>>): Rect[] {
  const rects: Rect[] = [];
  frame.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x]!;
      let end = x + 1;
      while (end < row.length && row[end] === ch) end++;
      if (ch !== '.') {
        const fill = palette[ch];
        if (!fill) throw new Error(`Sprite character "${ch}" has no palette entry`);
        rects.push({ x, y, w: end - x, h: 1, fill });
      }
      x = end;
    }
  });
  return rects;
}
