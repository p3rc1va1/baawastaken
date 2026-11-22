import { expect, test } from '@playwright/test';

test.describe('page metadata', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  const meta = (page: import('@playwright/test').Page, attr: 'name' | 'property', key: string) =>
    page.locator(`meta[${attr}="${key}"]`).getAttribute('content');

  test('title, description, canonical, theme colour and language', async ({ page }) => {
    await expect(page).toHaveTitle('BaaWasTaken | Cozy pixel art, tech and games');
    expect(await meta(page, 'name', 'description')).toMatch(/cozy pixel art, tech and games/i);
    expect(await meta(page, 'name', 'theme-color')).toBe('#323D39');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://baawastaken.com/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('meta[name="viewport"]')).toHaveAttribute('content', /width=device-width/);
  });

  test('Open Graph and Twitter card tags', async ({ page }) => {
    expect(await meta(page, 'property', 'og:type')).toBe('website');
    expect(await meta(page, 'property', 'og:title')).toBe('BaaWasTaken | Cozy pixel art, tech and games');
    expect(await meta(page, 'property', 'og:url')).toBe('https://baawastaken.com/');
    expect(await meta(page, 'property', 'og:image')).toBe('https://baawastaken.com/og.png');
    expect(await meta(page, 'property', 'og:image:width')).toBe('1200');
    expect(await meta(page, 'property', 'og:image:height')).toBe('630');
    expect(await meta(page, 'property', 'og:image:alt')).not.toBe('');
    expect(await meta(page, 'name', 'twitter:card')).toBe('summary_large_image');
    expect(await meta(page, 'name', 'twitter:image')).toBe('https://baawastaken.com/og.png');
  });

  test('favicons exist and resolve', async ({ page, request }) => {
    const hrefs = await page.locator('link[rel="icon"], link[rel="apple-touch-icon"]').evaluateAll((els) =>
      els.map((el) => (el as HTMLLinkElement).getAttribute('href')!),
    );
    expect(hrefs.sort()).toEqual(['/apple-touch-icon.png', '/favicon-32.png', '/favicon.svg']);
    for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  });

  test('the one font is preloaded from our own origin', async ({ page }) => {
    const preloads = await page
      .locator('link[rel="preload"][as="font"]')
      .evaluateAll((els) => els.map((el) => (el as HTMLLinkElement).getAttribute('href')!));
    expect(preloads).toHaveLength(1);
    expect(preloads.every((h) => h.startsWith('/_astro/'))).toBe(true);
  });

  test('the page is indexable', async ({ page }) => {
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});
