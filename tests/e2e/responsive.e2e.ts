import { expect, test, type Page } from '@playwright/test';

type Box = { x: number; y: number; width: number; height: number };
const overlaps = (a: Box, b: Box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const box = async (page: Page, sel: string) => {
  const b = await page.locator(sel).first().boundingBox();
  if (!b) throw new Error(`${sel} has no box`);
  return b;
};

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'horizontal scroll').toBeLessThanOrEqual(clientWidth);
}

/** No tile name, description, button or heading is wider than the box it sits in. */
async function nothingOverflows(page: Page) {
  const overflowing = await page.evaluate(() =>
    [...document.querySelectorAll('.name, .sub, .btn, .tagline, .wordmark, .tv-title, .tv-heading, .heading, .blurb')]
      .filter((el) => el.scrollWidth > el.clientWidth + 1)
      .map((el) => `${el.className}: ${(el.textContent ?? '').trim().slice(0, 30)}`),
  );
  expect(overflowing).toEqual([]);
}

/** Every visible link and button lies fully inside the viewport horizontally. */
async function insideViewport(page: Page, width: number) {
  const off = await page.evaluate((w) =>
    [...document.querySelectorAll('a, button')]
      .filter((el) => (el as HTMLElement).offsetParent !== null)
      .map((el) => ({ t: (el.textContent ?? '').trim().slice(0, 20), r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.left < -0.5 || r.right > w + 0.5)
      .map(({ t }) => t), width);
  expect(off).toEqual([]);
}

for (const width of [768, 1024, 1179]) {
  test.describe(`tablet at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
    });

    test('no sideways scrolling, nothing overflows, everything is on screen', async ({ page }) => {
      await noHorizontalScroll(page);
      await nothingOverflows(page);
      await insideViewport(page, width);
    });

    test('shelves keep four and three tiles in a row; the TV moves below them', async ({ page }) => {
      const ys = await page.locator('a.tile').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().y)));
      expect(new Set(ys.slice(0, 4)).size).toBe(1);
      expect(new Set(ys.slice(4)).size).toBe(1);
      const shelves = await box(page, '.shelves');
      const tv = await box(page, '.tv-col');
      expect(tv.y).toBeGreaterThanOrEqual(shelves.y + shelves.height - 1);
    });

    test('TV and window sit side by side, with the contact card across the bottom', async ({ page }) => {
      const tv = await box(page, '.tv-col');
      const win = await box(page, '.window');
      const contact = await box(page, '.contact');
      expect(win.x).toBeGreaterThan(tv.x + tv.width - 1);
      expect(contact.y).toBeGreaterThanOrEqual(Math.max(tv.y + tv.height, win.y + win.height) - 1);
      expect(contact.width).toBeGreaterThan(600);
    });

    test('main blocks never overlap each other', async ({ page }) => {
      const blocks = ['.brand', '.shelves', '.tv-col', '.window', '.contact', '.floor'];
      const boxes = await Promise.all(blocks.map((b) => box(page, b)));
      for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) expect(overlaps(boxes[i]!, boxes[j]!), `${blocks[i]} vs ${blocks[j]}`).toBe(false);
      }
    });

    test('the clock and dust motes are not shown', async ({ page }) => {
      await expect(page.locator('.clock')).toBeHidden();
      await expect(page.locator('.motes')).toBeHidden();
    });

    test('the wordmark is a single line', async ({ page }) => {
      const h = (await box(page, '.wordmark')).height;
      const fontSize = await page.locator('.wordmark').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(h).toBeLessThan(fontSize * 1.5);
    });
  });
}

for (const width of [320, 360, 375, 414, 767]) {
  test.describe(`phone at ${width}px`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto('/');
    });

    test('no sideways scrolling, nothing overflows, everything is on screen', async ({ page }) => {
      await noHorizontalScroll(page);
      await nothingOverflows(page);
      await insideViewport(page, width);
    });

    test('all seven links, the TV and the contact card are visible', async ({ page }) => {
      await expect(page.locator('a.tile')).toHaveCount(7);
      for (const tile of await page.locator('a.tile').all()) await expect(tile).toBeVisible();
      await expect(page.locator('.tv-col .screen')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Say hi' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'hello@baawastaken.com' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'business@baawastaken.com' })).toBeVisible();
      await expect(page.locator('[data-lv="link"], .fallback-link').first()).toBeVisible();
    });

    test('everything stacks in one column: shelves, then TV, then contact', async ({ page }) => {
      const shelves = await box(page, '.shelves');
      const tv = await box(page, '.tv-col');
      const contact = await box(page, '.contact');
      expect(tv.y).toBeGreaterThan(shelves.y + shelves.height - 1);
      expect(contact.y).toBeGreaterThan(tv.y + tv.height - 1);
    });

    test('tiles are two to a row, each row on its own plank', async ({ page }) => {
      const pos = await page.locator('a.tile').evaluateAll((els) =>
        els.map((e) => {
          const r = e.getBoundingClientRect();
          return { x: Math.round(r.x), y: Math.round(r.y) };
        }),
      );
      expect(new Set(pos.map((p) => p.x)).size).toBe(2);
      const rows = new Set(pos.map((p) => p.y));
      expect(rows.size).toBe(4); // 2 + 2 on the upper shelf, 2 + 1 on the lower
      expect(await page.locator('.row-break').evaluateAll((els) => els.filter((e) => (e as HTMLElement).offsetParent !== null).length)).toBe(2);
    });

    test('the window and dust motes are hidden; the clock too', async ({ page }) => {
      await expect(page.locator('.window')).toBeHidden();
      await expect(page.locator('.motes')).toBeHidden();
      await expect(page.locator('.clock')).toBeHidden();
    });

    test('the wordmark BaaWasTaken is on one line and fits', async ({ page }) => {
      const wm = await box(page, '.wordmark');
      expect(wm.x).toBeGreaterThanOrEqual(0);
      expect(wm.x + wm.width).toBeLessThanOrEqual(width);
      const fontSize = await page.locator('.wordmark').evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(wm.height, 'one line').toBeLessThan(fontSize * 1.5);
      await expect(page.locator('h1')).toHaveText('BaaWasTaken');
    });

    test('each email address is on a single line inside its button', async ({ page }) => {
      for (const mail of await page.locator('.mail').all()) {
        const b = (await mail.boundingBox())!;
        expect(b.height, (await mail.textContent()) ?? '').toBeLessThan(56);
      }
    });

    test('the footer sits on the floor and clears the rug', async ({ page }) => {
      const floor = await box(page, '.floor');
      const footer = await box(page, '.footer');
      const rug = await box(page, '.rug');
      expect(footer.y).toBeGreaterThanOrEqual(floor.y);
      expect(footer.y + footer.height).toBeLessThanOrEqual(floor.y + floor.height);
      expect(footer.y).toBeGreaterThanOrEqual(rug.y + rug.height);
    });

    test('touch targets are at least 44px tall', async ({ page }) => {
      const small = await page.evaluate(() =>
        [...document.querySelectorAll('a, button')]
          .filter((el) => (el as HTMLElement).offsetParent !== null)
          .map((el) => ({ t: (el.textContent ?? '').trim().slice(0, 20), h: el.getBoundingClientRect().height }))
          .filter((x) => x.h < 44),
      );
      expect(small).toEqual([]);
    });
  });
}
