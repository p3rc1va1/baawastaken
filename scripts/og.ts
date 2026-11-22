/**
 * Renders /og (a fixed 1200×630 composition) to public/og.png, the image shown when the site is
 * shared. Run with `npm run og`, which builds the site first. The output is committed.
 */
import { fileURLToPath } from 'node:url';
import { preview } from 'astro';
import { chromium } from '@playwright/test';

const root = fileURLToPath(new URL('..', import.meta.url));
const server = await preview({ root, logLevel: 'error', server: { port: 4799, host: '127.0.0.1' } });

try {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  // A still frame: all animations off, so the picture is the same every time.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`http://127.0.0.1:${server.port}/og`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${root}public/og.png`, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await browser.close();
  console.log('Wrote public/og.png (1200×630)');
} finally {
  await server.stop();
}
