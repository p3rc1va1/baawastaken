/**
 * One-off: turns the channel profile picture (a 32×32 drawing, each art pixel 25×25) into the
 * native-size avatar and favicons. Run with `npm run avatar`; the outputs are committed.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readPixelArt, toSharp, toSvg } from './avatar-lib';

const root = new URL('..', import.meta.url);
const path = (p: string) => fileURLToPath(new URL(p, root));

const SOURCE = path('media/channel profile image.png');
const FACTOR = 25;

const art = await readPixelArt(SOURCE, FACTOR);
console.log(`Source is a ${art.width}×${art.height} pixel drawing`);

// Native size, used on the page (shown at 4×).
await toSharp(art).png().toFile(path('src/assets/avatar-32.png'));

// Favicons.
writeFileSync(path('public/favicon.svg'), toSvg(art));
await toSharp(art).png().toFile(path('public/favicon-32.png'));

// Apple touch icon: 5× upscale (160px) centred on a 180px square in the wall colour.
const wall = { r: art.data[0]!, g: art.data[1]!, b: art.data[2]!, alpha: 1 };
await toSharp(art)
  .resize(art.width * 5, art.height * 5, { kernel: 'nearest' })
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: wall })
  .png()
  .toFile(path('public/apple-touch-icon.png'));

console.log('Wrote src/assets/avatar-32.png, public/favicon.svg, favicon-32.png, apple-touch-icon.png');
