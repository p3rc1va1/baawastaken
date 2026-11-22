import { expect, test, type Page } from '@playwright/test';

/** WCAG relative luminance contrast of two "rgb(r, g, b)" strings. */
function contrast(a: string, b: string): number {
  const lum = (rgb: string) => {
    const [r, g, bl] = rgb.match(/\d+/g)!.slice(0, 3).map((v) => {
      const c = Number(v) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r! + 0.7152 * g! + 0.0722 * bl!;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const box = async (page: Page, sel: string) => (await page.locator(sel).first().boundingBox())!;

test('the footer is the page\'s contentinfo landmark with its two lines', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  await expect(footer).toContainText('© BaaWasTaken');
  await expect(footer).toContainText('Made with pixels in a cozy corner');
});

test('footer text is at least 4.5:1 against the floor, even on the lightest plank colour', async ({ page }) => {
  await page.goto('/');
  const text = await page.locator('.footer').evaluate((el) => getComputedStyle(el).color);
  const floor = await page.locator('.floor').evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(contrast(text, floor)).toBeGreaterThanOrEqual(4.5);
});

test('the floor, rug and controller are decoration', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.floor')).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('.floor .rug')).toHaveCount(1);
  await expect(page.locator('.floor .controller')).toHaveCount(1);
});

for (const width of [1920, 1280, 768, 375]) {
  test(`at ${width}px the rug is centred under the page and the controller lies on it`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const rug = await box(page, '.rug');
    const pad = await box(page, '.controller');
    const rugCentre = rug.x + rug.width / 2;
    expect(Math.abs(rugCentre - width / 2)).toBeLessThanOrEqual(2);
    expect(pad.x).toBeGreaterThanOrEqual(rug.x);
    expect(pad.x + pad.width).toBeLessThanOrEqual(rug.x + rug.width);
    expect(pad.y).toBeGreaterThanOrEqual(rug.y);
    expect(pad.y + pad.height).toBeLessThanOrEqual(rug.y + rug.height + 4);
    expect(rug.x).toBeGreaterThanOrEqual(0);
    expect(rug.x + rug.width).toBeLessThanOrEqual(width);
  });
}

test('on a tall screen the floor stays pinned to the bottom of the window', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 2400 });
  await page.goto('/');
  const floor = await box(page, '.floor');
  expect(Math.round(floor.y + floor.height)).toBe(2400);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(2400);
});

test('the footer text sits on the floor, never on the wall', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const floor = await box(page, '.floor');
  const footer = await box(page, '.footer');
  expect(footer.y).toBeGreaterThanOrEqual(floor.y);
  expect(footer.y + footer.height).toBeLessThanOrEqual(floor.y + floor.height);
});
