import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('an unknown address returns status 404 with the pixel-art page', async ({ request }) => {
  const res = await request.get('/nope');
  expect(res.status()).toBe(404);
  expect(res.headers()['content-type']).toContain('text/html');
  const html = await res.text();
  expect(html).toContain('Page not found');
  expect(html).toContain('Back to the cozy corner');
  expect(html).not.toContain('data-lv='); // the video step only applies to the homepage
});

test('nested and odd unknown paths get the same 404 page, with working styles', async ({ page }) => {
  for (const path of ['/a/b/c', '/index.php', '/nope/', '/_astro/missing.css']) {
    const res = await page.goto(path);
    expect(res!.status(), path).toBe(404);
    await expect(page.getByRole('heading', { level: 1 }), path).toHaveText('Page not found');
  }
  // styles loaded from an absolute path even when the URL is deep
  await page.goto('/a/b/c');
  expect(await page.locator('.note').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(249, 238, 191)');
});

test('the link goes back to the homepage', async ({ page }) => {
  await page.goto('/nope');
  const back = page.getByRole('link', { name: 'Back to the cozy corner' });
  await expect(back).toHaveAttribute('href', '/');
  await back.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('BaaWasTaken');
});

test('it is titled, kept out of search results, and has one h1', async ({ page }) => {
  await page.goto('/nope');
  await expect(page).toHaveTitle('Page not found | BaaWasTaken');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('the cat is awake (open eyes), animated, and hidden from assistive technology', async ({ page }) => {
  await page.goto('/nope');
  await expect(page.locator('.perch')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('.perch .sprite-frame').evaluateAll((fs) => fs.map((f) => f.querySelector('rect[fill="#7FD3A8"]') !== null))).toEqual([true, true]);
  const names = await page.locator('.perch .sprite-frame').evaluateAll((fs) => fs.map((f) => getComputedStyle(f).animationName));
  expect(names).toEqual(['frameA', 'frameB']);
});

for (const width of [375, 768, 1280]) {
  test(`axe finds no violations and nothing overflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/nope');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
    const { s, c } = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    expect(s).toBeLessThanOrEqual(c);
  });
}
