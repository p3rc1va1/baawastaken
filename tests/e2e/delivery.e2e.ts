import { expect, test } from '@playwright/test';

test('the share image is served as a PNG and the page that makes it is kept out of search results', async ({ request }) => {
  const img = await request.get('/og.png');
  expect(img.status()).toBe(200);
  expect(img.headers()['content-type']).toBe('image/png');
  expect(img.headers()['cache-control']).toBe('public, max-age=86400');

  const page = await request.get('/og');
  expect(page.status()).toBe(200);
  expect(await page.text()).toContain('<meta name="robots" content="noindex">');
});

test('built files are cached for a year and marked immutable', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page.evaluate(() => [
    ...[...document.querySelectorAll('link[rel="stylesheet"], link[rel="preload"]')].map((l) => (l as HTMLLinkElement).getAttribute('href')!),
  ]);
  expect(hrefs.length).toBeGreaterThan(0);
  for (const href of hrefs.filter((h) => h.startsWith('/_astro/'))) {
    const res = await request.get(href);
    expect(res.headers()['cache-control'], href).toBe('public, max-age=31536000, immutable');
  }
});

test('icons are cached for a day', async ({ request }) => {
  for (const path of ['/favicon.svg', '/favicon-32.png', '/apple-touch-icon.png']) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['cache-control'], path).toBe('public, max-age=86400');
  }
});

test('robots.txt allows crawling', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toContain('text/plain');
  expect(await res.text()).toContain('Allow: /');
});

for (const path of ['/', '/nope', '/favicon.svg']) {
  test(`security headers are present on ${path}`, async ({ request }) => {
    const h = (await request.get(path)).headers();
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['content-security-policy']).toBe("frame-ancestors 'none'");
    expect(h['permissions-policy']).toContain('camera=()');
  });
}

test('the homepage HTML is revalidated rather than cached', async ({ request }) => {
  const h = (await request.get('/')).headers();
  expect(h['cache-control']).toBe('public, max-age=0, must-revalidate');
});

test('the page cannot be framed by other sites', async ({ request }) => {
  expect((await request.get('/')).headers()['content-security-policy']).toContain("frame-ancestors 'none'");
});
