import { expect, test } from '@playwright/test';
import { site } from '../../src/data/site';
import { feedUrl, parseLatestVideo, type Video } from '../../worker/feed';

/** The channel's real newest video, read directly by the test (null when offline: those tests skip). */
async function liveVideo(): Promise<Video | null> {
  try {
    const res = await fetch(feedUrl(site.youtubeChannelId), { signal: AbortSignal.timeout(8000) });
    return res.ok ? parseLatestVideo(await res.text()) : null;
  } catch {
    return null;
  }
}

let live: Video | null;
test.beforeAll(async () => {
  live = await liveVideo();
});

test('the served page names the channel\'s current newest video, with our own thumbnail URL', async ({ request }) => {
  test.skip(!live, 'YouTube feed unreachable from the test machine');
  const html = await (await request.get('/')).text();
  expect(html).toContain(`data-video-id="${live!.id}"`);
  expect(html).toContain(`src="/yt-thumb/${live!.id}"`);
  expect(html).toContain(`href="https://www.youtube.com/watch?v=${live!.id}"`);
});

test('in the browser the TV shows that title and the thumbnail actually loads from our origin', async ({ page, baseURL }) => {
  test.skip(!live, 'YouTube feed unreachable from the test machine');
  const requests: { url: string; status: number }[] = [];
  page.on('response', (r) => requests.push({ url: r.url(), status: r.status() }));

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  await expect(page.locator('[data-lv="title"]')).toHaveText(live!.title);
  await expect(page.locator('[data-lv="link"]')).toHaveAttribute('aria-label', `Play video: ${live!.title}`);

  const thumb = page.locator('img[data-lv="thumb"]');
  await expect.poll(() => thumb.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth), { timeout: 10_000 }).toBe(320);

  const host = new URL(baseURL!).host;
  expect(requests.filter((r) => new URL(r.url).host !== host)).toEqual([]);
  expect(requests.find((r) => r.url.endsWith(`/yt-thumb/${live!.id}`))?.status).toBe(200);
});

test('/yt-thumb/<id> serves a real JPEG with long caching', async ({ request }) => {
  test.skip(!live, 'YouTube feed unreachable from the test machine');
  const res = await request.get(`/yt-thumb/${live!.id}`);
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toBe('image/jpeg');
  expect(res.headers()['cache-control']).toBe('public, max-age=86400');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  const body = await res.body();
  expect(body.length).toBeGreaterThan(1000);
  expect([...body.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
});

test('bad thumbnail IDs are 404 and POST is 405', async ({ request }) => {
  for (const bad of ['not-an-id', 'aaaaaaaaaaaa', '%2e%2e%2fsecret', 'sXAz0SK9lZg/x']) {
    expect((await request.get(`/yt-thumb/${bad}`)).status(), bad).toBe(404);
  }
  expect((await request.post('/yt-thumb/sXAz0SK9lZg')).status()).toBe(405);
});

test('the homepage is always revalidated and never answered 304 from the static file\'s validators', async ({ request }) => {
  test.skip(!live, 'YouTube feed unreachable from the test machine');
  const first = await request.get('/');
  expect(first.headers()['cache-control']).toBe('public, max-age=0, must-revalidate');
  expect(first.headers()['etag']).toBeUndefined();
  const second = await request.get('/', { headers: { 'If-None-Match': '*', 'If-Modified-Since': new Date(Date.now() + 86_400_000).toUTCString() } });
  expect(second.status()).toBe(200);
  expect(await second.text()).toContain(live!.id);
});

test('HEAD works and static assets are served without the Worker rewriting them', async ({ request, page }) => {
  expect((await request.head('/')).status()).toBe(200);
  await page.goto('/');
  const css = await page.locator('link[rel="stylesheet"]').first().getAttribute('href');
  if (css) {
    const res = await request.get(css);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/css');
  }
});

test('the 404 page keeps a 404 status', async ({ request }) => {
  expect((await request.get('/definitely-not-here')).status()).toBe(404);
});
