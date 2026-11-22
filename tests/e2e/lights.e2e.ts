import { expect, test } from '@playwright/test';

for (const width of [1280, 375]) {
  test(`string lights span the full width without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');

    const visible = page.locator(width >= 768 ? '.lights-wide svg' : '.lights-narrow svg');
    const hidden = page.locator(width >= 768 ? '.lights-narrow svg' : '.lights-wide svg');
    await expect(visible).toBeVisible();
    await expect(hidden).toBeHidden();

    const box = (await visible.boundingBox())!;
    expect(box.x).toBe(0);
    expect(box.width).toBeGreaterThanOrEqual(width);

    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);

    await expect(visible).toHaveAttribute('aria-hidden', 'true');
    await page.screenshot({ path: `test-results/lights-${width}.png`, clip: { x: 0, y: 0, width, height: 120 } });
  });
}
