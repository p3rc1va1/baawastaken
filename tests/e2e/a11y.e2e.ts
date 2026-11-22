import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const width of [375, 768, 1280]) {
  test(`axe finds no violations at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}

test('tab order follows the reading order: seven platforms, the video, then each address followed by its Copy button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const order: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    order.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLElement;
        return el.querySelector('.name')?.textContent ?? el.getAttribute('aria-label') ?? (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      }),
    );
  }
  expect(order.slice(0, 7)).toEqual(['YouTube', 'Instagram', 'TikTok', 'Ko-fi', 'Twitch', 'Kick', 'Discord']);
  expect(order[7]).toMatch(/^Play video: /);
  expect(order.slice(8)).toEqual([
    'hello@baawastaken.com',
    'Copy email (hello@baawastaken.com)',
    'business@baawastaken.com',
    'Copy email (business@baawastaken.com)',
  ]);
});

test('every focused control shows a visible outline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe('none');
    expect(outline.width).toBeGreaterThanOrEqual(2);
  }
});
