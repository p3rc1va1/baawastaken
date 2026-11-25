import { expect, test, type Page } from '@playwright/test';

/** These tests need a video on the TV; skip (loudly) if the committed snapshot names none and the TV shows the fallback. */
async function haveVideo(page: Page) {
  return (await page.locator('.video-link').count()) > 0 && (await page.locator('.video-link').isVisible());
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
});

test('the TV shows the video link, title and date, named for screen readers', async ({ page }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  const link = page.locator('.video-link');
  const title = (await page.locator('.tv-title').textContent())!.trim();
  expect(title.length).toBeGreaterThan(0);
  await expect(link).toHaveAttribute('aria-label', `Play video: ${title}`);
  await expect(link).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
  await expect(page.locator('.tv-date time')).toHaveText(/^[A-Z][a-z]{2} \d{1,2}, \d{4}$/);
  await expect(page.locator('.fallback')).toHaveCount(0);
  await expect(page.locator('.thumb')).toHaveAttribute('src', /^\/yt\/[\w-]{11}\.jpg$/);
});

test('nothing is requested from YouTube until Play is clicked', async ({ page, baseURL }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  const hosts = new Set<string>();
  page.on('request', (r) => hosts.add(new URL(r.url()).host));
  await page.reload();
  await page.waitForLoadState('networkidle');
  expect([...hosts].filter((h) => h !== new URL(baseURL!).host)).toEqual([]);
});

test('the stored thumbnail loads from our own origin', async ({ page }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  const loaded = await page.locator('.thumb').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  expect(loaded).toBe(true);
});

test('Play swaps the thumbnail for a privacy-friendly player titled with the video', async ({ page }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub player</title>' }),
  );
  const id = await page.locator('.screen').getAttribute('data-video-id');
  const title = (await page.locator('.tv-title').textContent())!.trim();

  await page.locator('.video-link').click();

  const frame = page.locator('iframe.embed');
  await expect(frame).toHaveCount(1);
  await expect(frame).toHaveAttribute('src', new RegExp(`^https://www\\.youtube-nocookie\\.com/embed/${id}\\?autoplay=1`));
  await expect(frame).toHaveAttribute('title', title);
  await expect(page.locator('.video-link')).toHaveCount(0);
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe('IFRAME');
  expect(page.url()).toBe(new URL('/', page.url()).href); // did not navigate away
});

test('keyboard users can start the video with Enter', async ({ page }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
  await page.locator('.video-link').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('iframe.embed')).toHaveCount(1);
});

test('a modified click (open in new tab) is left alone', async ({ page, context }) => {
  test.skip(!(await haveVideo(page)), 'the snapshot names no video');
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>youtube stub</title>' }),
  );
  const popup = context.waitForEvent('page');
  await page.locator('.video-link').click({ modifiers: ['ControlOrMeta'] });
  expect((await popup).url()).toContain('youtube.com/watch?v=');
  await expect(page.locator('iframe.embed')).toHaveCount(0);
});

test('without JavaScript the thumbnail still opens the video on YouTube', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, ...(baseURL ? { baseURL } : {}) });
  const page = await context.newPage();
  await context.route('https://www.youtube.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>youtube stub</title>' }),
  );
  await page.goto('/');
  test.skip((await page.locator('.video-link').count()) === 0 || !(await page.locator('.video-link').isVisible()), 'no video snapshot');
  await page.locator('.video-link').click();
  await expect(page).toHaveURL(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/);
  await context.close();
});

test('with no captured video the TV offers "Watch on YouTube" instead', async ({ page }) => {
  test.skip(await haveVideo(page), 'the snapshot names a video, so the fallback is not shown (covered by tests/tv.test.ts)');
  await expect(page.locator('.fallback-link')).toHaveAttribute('href', 'https://www.youtube.com/@BaaWasTaken');
});
