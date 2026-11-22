import { expect, test } from '@playwright/test';

const expected = [
  ['YouTube', 'https://www.youtube.com/@BaaWasTaken'],
  ['Instagram', 'https://www.instagram.com/baawastakenyt'],
  ['TikTok', 'https://www.tiktok.com/@baawastaken'],
  ['Ko-fi', 'https://ko-fi.com/baawastaken'],
  ['Twitch', 'https://www.twitch.tv/baawastaken'],
  ['Kick', 'https://kick.com/baawastaken'],
  ['Discord', 'https://discord.gg/rm4HDpmN9g'],
] as const;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
});

test('seven platform links with the right URLs, in shelf order', async ({ page }) => {
  const tiles = page.locator('a.tile');
  await expect(tiles).toHaveCount(7);
  const found = await tiles.evaluateAll((els) =>
    els.map((el) => [el.querySelector('.name')!.textContent, el.getAttribute('href')]),
  );
  expect(found).toEqual(expected.map(([n, u]) => [n, u]));
});

test('every external link opens safely', async ({ page }) => {
  for (const rel of await page.locator('a.tile').evaluateAll((els) => els.map((e) => e.getAttribute('rel')))) {
    expect(rel).toContain('noopener');
  }
});

test('desktop layout: four tiles on the upper shelf, three on the lower, left to right', async ({ page }) => {
  const boxes = await page.locator('a.tile').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y };
    }),
  );
  const upper = boxes.slice(0, 4);
  const lower = boxes.slice(4);
  expect(new Set(upper.map((b) => b.y)).size).toBe(1);
  expect(new Set(lower.map((b) => b.y)).size).toBe(1);
  expect(lower[0]!.y).toBeGreaterThan(upper[0]!.y + 100);
  for (const row of [upper, lower]) for (let i = 1; i < row.length; i++) expect(row[i]!.x).toBeGreaterThan(row[i - 1]!.x);
  expect(lower[0]!.x).toBe(upper[0]!.x);
});

test('the lists are announced as lists of 4 and 3 links', async ({ page }) => {
  const sizes = await page
    .locator('section.shelf ul[role="list"]')
    .evaluateAll((els) => els.map((e) => e.querySelectorAll('li:not([aria-hidden="true"])').length));
  expect(sizes).toEqual([4, 3]);
});

test('logos sit in an identical 48×48 slot in the same place in every tile', async ({ page }) => {
  const slots = await page.locator('a.tile').evaluateAll((els) =>
    els.map((el) => {
      const card = el.querySelector('.card')!.getBoundingClientRect();
      const logo = el.querySelector('.logo')!.getBoundingClientRect();
      return { dx: logo.x - card.x, dy: logo.y - card.y, w: logo.width, h: logo.height };
    }),
  );
  for (const s of slots) expect(s).toEqual(slots[0]);
  expect([slots[0]!.w, slots[0]!.h]).toEqual([48, 48]);
});

test('names and descriptions fit inside their tiles', async ({ page }) => {
  const overflow = await page.locator('a.tile .name, a.tile .sub').evaluateAll((els) =>
    els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent),
  );
  expect(overflow).toEqual([]);
});

test('Ko-fi is the jade support tile, on the upper shelf; the others are cream', async ({ page }) => {
  const tiles = await page.locator('a.tile').evaluateAll((els) =>
    els.map((e) => ({ name: e.querySelector('.name')!.textContent, bg: getComputedStyle(e.querySelector('.card')!).backgroundColor, y: e.getBoundingClientRect().y })),
  );
  for (const t of tiles) expect(t.bg, t.name ?? '').toBe(t.name === 'Ko-fi' ? 'rgb(58, 148, 112)' : 'rgb(249, 238, 191)');
  const upperY = tiles[0]!.y;
  expect(tiles.find((t) => t.name === 'Ko-fi')!.y).toBe(upperY);
});

test('the plant, mug and books are decoration, hidden from assistive technology', async ({ page }) => {
  const decor = page.locator('.decor');
  await expect(decor).toHaveAttribute('aria-hidden', 'true');
  await expect(decor.locator('svg')).not.toHaveCount(0);
});

test('tiles are at least 44×44 for touch', async ({ page }) => {
  for (const b of await page.locator('a.tile').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()))) {
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});

test('the ligature fix: Ko-fi is spelled with separate letters', async ({ page }) => {
  const ligatures = await page.locator('a.tile .name').first().evaluate((el) => getComputedStyle(el).fontVariantLigatures);
  expect(ligatures).toBe('none');
});
