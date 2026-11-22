import { expect, test } from '@playwright/test';

const running = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length);

test('by default the room is alive: lights twinkle, steam rises, the cat\'s tail and the pendulum swing', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  expect(await running(page)).toBeGreaterThan(20);
  const names = await page.evaluate(() => [...new Set(document.getAnimations().map((a) => (a as CSSAnimation).animationName))]);
  for (const n of ['twinkle', 'steam', 'zz', 'blink', 'frameA', 'frameB', 'drift', 'shoot', 'roll', 'led', 'mote']) {
    expect(names, n).toContain(n);
  }
});

test.describe('when the visitor prefers reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
  });

  test('nothing animates at all', async ({ page }) => {
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });

  test('each two-frame sprite shows its first frame only', async ({ page }) => {
    const frames = await page.locator('.sprite-stack').evaluateAll((stacks) =>
      stacks.map((s) => [...s.querySelectorAll('.sprite-frame')].map((f) => getComputedStyle(f).opacity)),
    );
    expect(frames).toHaveLength(3); // pendulum, plant and cat
    for (const f of frames) expect(f).toEqual(['1', '0']);
  });

  test('transient effects are not shown', async ({ page }) => {
    for (const sel of ['.steam', '.z', '.shoot', '.scan', '.mote']) {
      const shown = await page.locator(sel).evaluateAll((els) => els.filter((e) => getComputedStyle(e).display !== 'none').length);
      expect(shown, sel).toBe(0);
    }
  });

  test('hovering a tile lifts nothing and animates nothing', async ({ page }) => {
    await page.locator('a.tile').first().hover();
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    const t = await page.locator('a.tile .card').first().evaluate((el) => getComputedStyle(el).transitionDuration);
    expect(t).toBe('0s');
  });

  test('the page still has all its content and links', async ({ page }) => {
    await expect(page.locator('a.tile')).toHaveCount(7);
    await expect(page.getByRole('heading', { name: 'Say hi' })).toBeVisible();
  });
});
