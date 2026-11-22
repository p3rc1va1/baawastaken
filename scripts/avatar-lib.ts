import sharp, { type Sharp } from 'sharp';

export interface PixelArt {
  width: number;
  height: number;
  /** RGBA, row-major, 4 bytes per art pixel. */
  data: Uint8Array;
}

/**
 * Reads an image that is a pixel drawing blown up by a whole-number factor and returns the drawing at
 * its true size. Each factor×factor block must be one flat colour, otherwise the source is not an
 * exact grid and we refuse to guess.
 */
export async function readPixelArt(path: string, factor: number): Promise<PixelArt> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width % factor !== 0 || info.height % factor !== 0) {
    throw new Error(`${path} is ${info.width}×${info.height}, not a multiple of ${factor}`);
  }
  const width = info.width / factor;
  const height = info.height / factor;
  const out = new Uint8Array(width * height * 4);
  const at = (x: number, y: number) => (y * info.width + x) * 4;

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const first = at(px * factor, py * factor);
      for (let dy = 0; dy < factor; dy++) {
        for (let dx = 0; dx < factor; dx++) {
          const i = at(px * factor + dx, py * factor + dy);
          for (let c = 0; c < 4; c++) {
            if (data[i + c] !== data[first + c]) {
              throw new Error(`Block (${px},${py}) is not one flat colour; source is not a ${factor}× pixel grid`);
            }
          }
        }
      }
      out.set(data.subarray(first, first + 4), (py * width + px) * 4);
    }
  }
  return { width, height, data: out };
}

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');

/**
 * Pixel art as a crisp SVG. The most common colour becomes one background rect; every other
 * horizontal run of one colour becomes one rect.
 */
export function toSvg(art: PixelArt): string {
  const colourAt = (x: number, y: number) => {
    const i = (y * art.width + x) * 4;
    return hex(art.data[i]!, art.data[i + 1]!, art.data[i + 2]!);
  };

  const counts = new Map<string, number>();
  for (let y = 0; y < art.height; y++) {
    for (let x = 0; x < art.width; x++) counts.set(colourAt(x, y), (counts.get(colourAt(x, y)) ?? 0) + 1);
  }
  const background = [...counts.entries()].sort((p, q) => q[1] - p[1])[0]![0];

  const rects = [`<rect width="${art.width}" height="${art.height}" fill="${background}"/>`];
  for (let y = 0; y < art.height; y++) {
    let x = 0;
    while (x < art.width) {
      const colour = colourAt(x, y);
      let end = x + 1;
      while (end < art.width && colourAt(end, y) === colour) end++;
      if (colour !== background) {
        rects.push(`<rect x="${x}" y="${y}" width="${end - x}" height="1" fill="${colour}"/>`);
      }
      x = end;
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${art.width} ${art.height}" shape-rendering="crispEdges">` +
    rects.join('') +
    '</svg>\n'
  );
}

export function toSharp(art: PixelArt): Sharp {
  return sharp(Buffer.from(art.data), { raw: { width: art.width, height: art.height, channels: 4 } });
}
