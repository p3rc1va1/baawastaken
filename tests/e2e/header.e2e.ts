import { expect, test, type Locator } from '@playwright/test';

async function box(l: Locator) {
  const b = await l.boundingBox();
  if (!b) throw new Error('element has no box');
  return b;
}

const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('header shows the avatar, the wordmark as the only h1, and the tagline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');

  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('BaaWasTaken');
  await expect(page.locator('.tagline')).toContainText('I’m into tech'.replace('’', "'"));

  const avatar = page.locator('img.avatar');
  await expect(avatar).toHaveAttribute('alt', /pixel-art avatar/i);
  expect(await avatar.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(32);
  const b = await box(avatar);
  expect([b.width, b.height]).toEqual([128 + 8, 128 + 8]); // 4× art size plus its 4px outline
  expect(await avatar.evaluate((el) => getComputedStyle(el).imageRendering)).toMatch(/pixelated|crisp-edges/);
});

for (const width of [1180, 1280, 1440, 1920]) {
  test(`the clock never overlaps the wordmark or tagline at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const clock = await box(page.locator('.clock'));
    expect(overlaps(clock, await box(page.locator('.wordmark')))).toBe(false);
    expect(overlaps(clock, await box(page.locator('.tagline')))).toBe(false);
    // and stays inside the viewport
    expect(clock.x + clock.width).toBeLessThanOrEqual(width);
  });
}

test('the clock is decoration: hidden from assistive technology', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.clock')).toHaveAttribute('aria-hidden', 'true');
});

test('the pendulum swings between two frames', async ({ page }) => {
  await page.goto('/');
  const frames = page.locator('.pendulum .sprite-frame');
  await expect(frames).toHaveCount(2);
  const names = await frames.evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
  expect(names).toEqual(['frameA', 'frameB']);
});
