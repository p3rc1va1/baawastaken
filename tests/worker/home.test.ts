import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CACHE_KEY, defaultCache } from '../../worker/config';
import worker from '../../worker/index';
import feedXml from '../fixtures/feed.xml?raw';
import fallbackPage from '../fixtures/home-fallback.html?raw';
import snapshotPage from '../fixtures/home-snapshot.html?raw';
import { isHidden, tagsWith } from './html';

const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=UC-MLQMe0PJR6v2d14VVb5fg';
const feedWith = (id: string, title: string, published = '2026-11-21T18:18:14+00:00') =>
  `<feed><entry><yt:videoId>${id}</yt:videoId><title>${title}</title><published>${published}</published></entry></feed>`;

let page = fallbackPage;
const assetsFetch = vi.fn<(req: Request) => Promise<Response>>();
const env = { ASSETS: { fetch: (req: Request) => assetsFetch(req) } as unknown as Fetcher };
const youtube = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

async function get(path = '/', init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(`https://baawastaken.com${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

beforeEach(async () => {
  await defaultCache().delete(CACHE_KEY);
  page = fallbackPage;
  assetsFetch.mockReset();
  assetsFetch.mockImplementation(
    async () => new Response(page, { headers: { 'Content-Type': 'text/html; charset=utf-8', ETag: '"static"', 'Last-Modified': 'Sat, 01 Jan 2026 00:00:00 GMT' } }),
  );
  youtube.mockReset();
  youtube.mockImplementation(async () => new Response(feedXml, { status: 200 }));
  vi.stubGlobal('fetch', youtube);
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-22T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('homepage: filling in the video', () => {
  test('shows the newest video: link, name, thumbnail, id, title and date', async () => {
    const html = await (await get()).text();
    const [link] = tagsWith(html, 'data-lv="link"');
    expect(link).toContain('href="https://www.youtube.com/watch?v=bbbbbbbbbbb"');
    expect(link).toContain('aria-label="Play video: Tom &amp; Jerry\'s &quot;big&quot; day \u{1F9F9} &lt;3"');
    expect(tagsWith(html, 'data-lv="thumb"')[0]).toContain('src="/yt-thumb/bbbbbbbbbbb"');
    expect(tagsWith(html, 'data-lv="player"')[0]).toContain('data-video-id="bbbbbbbbbbb"');
    expect(html).toContain('<time data-lv="date" datetime="2026-11-21T18:18:14.000Z">Nov 21, 2026</time>');
    expect(html).toMatch(/data-lv="title">Tom &amp; Jerry's "big" day \u{1F9F9} &lt;3<\/p>/u);
  });

  test('reveals the video blocks and hides the fallback blocks', async () => {
    const html = await (await get()).text();
    for (const t of tagsWith(html, 'data-lv="video"')) expect(isHidden(t), t).toBe(false);
    for (const t of tagsWith(html, 'data-lv="fallback"')) expect(isHidden(t), t).toBe(true);
  });

  test('replaces an older video baked in at build time', async () => {
    page = snapshotPage;
    const html = await (await get()).text();
    expect(html).not.toContain('oooooooooo0');
    expect(html).not.toContain('>Old<');
    expect(tagsWith(html, 'data-lv="link"')[0]).toContain('watch?v=bbbbbbbbbbb');
    expect(html).toContain('Nov 21, 2026');
  });

  test('reads the right feed, with a timeout and edge caching of good responses only', async () => {
    await get();
    expect(youtube).toHaveBeenCalledTimes(1);
    const [url, init] = youtube.mock.calls[0]!;
    expect(String(url)).toBe(FEED_URL);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    const cf = (init as { cf?: { cacheEverything?: boolean; cacheTtlByStatus?: Record<string, number> } }).cf;
    expect(cf?.cacheEverything).toBe(true);
    expect(cf?.cacheTtlByStatus).toEqual({ '200-299': 1800, '400-599': 0 });
  });

  test('is served as a page that is revalidated, without the static file\'s validators', async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
    expect(res.headers.get('ETag')).toBeNull();
    expect(res.headers.get('Last-Modified')).toBeNull();
  });

  test('a browser\'s conditional headers are not forwarded, so it can never be answered 304 with a stale page', async () => {
    const res = await get('/', { headers: { 'If-None-Match': '"static"', 'If-Modified-Since': 'Sat, 01 Jan 2026 00:00:00 GMT' } });
    const forwarded = assetsFetch.mock.calls[0]![0];
    expect(forwarded.headers.get('If-None-Match')).toBeNull();
    expect(forwarded.headers.get('If-Modified-Since')).toBeNull();
    expect(res.status).toBe(200);
  });

  test('HEAD requests work', async () => {
    const res = await get('/', { method: 'HEAD' });
    expect(res.status).toBe(200);
  });
});

describe('homepage: caching the feed', () => {
  test('a second visit within 30 minutes does not read the feed again', async () => {
    await get();
    await get();
    await get();
    expect(youtube).toHaveBeenCalledTimes(1);
  });

  test('after 30 minutes a new upload is picked up', async () => {
    await get();
    youtube.mockImplementation(async () => new Response(feedWith('ddddddddddd', 'Brand new', '2026-11-22T12:20:00+00:00')));
    vi.setSystemTime(new Date('2026-11-22T12:31:00Z'));
    const html = await (await get()).text();
    expect(youtube).toHaveBeenCalledTimes(2);
    expect(tagsWith(html, 'data-lv="link"')[0]).toContain('watch?v=ddddddddddd');
  });

  test('a cache entry that is corrupt is ignored', async () => {
    await defaultCache().put(CACHE_KEY, new Response('{"video":{"id":"../x"},"at":"nope"}', { headers: { 'Cache-Control': 'max-age=600' } }));
    const html = await (await get()).text();
    expect(youtube).toHaveBeenCalledTimes(1);
    expect(tagsWith(html, 'data-lv="link"')[0]).toContain('watch?v=bbbbbbbbbbb');
  });
});

describe('homepage: when YouTube cannot be read, the page is served exactly as built', () => {
  const untouched = async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.text()).toBe(fallbackPage);
  };

  test('HTTP error from the feed', async () => {
    youtube.mockImplementation(async () => new Response('nope', { status: 500 }));
    await untouched();
  });

  test('network failure', async () => {
    youtube.mockImplementation(async () => {
      throw new TypeError('fetch failed');
    });
    await untouched();
  });

  test('timeout', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockImplementation(() => AbortSignal.abort(new DOMException('timed out', 'TimeoutError')));
    youtube.mockImplementation(
      (_url, init) => new Promise((_res, reject) => (init?.signal?.aborted ? reject(init.signal.reason) : init?.signal?.addEventListener('abort', () => reject(init.signal!.reason)))),
    );
    await untouched();
  });

  test('a feed with no usable entries', async () => {
    youtube.mockImplementation(async () => new Response('<feed></feed>'));
    await untouched();
  });

  test('an HTML error page served with status 200', async () => {
    youtube.mockImplementation(async () => new Response('<html><body>consent required</body></html>'));
    await untouched();
  });

  test('a failure is remembered for a minute, so the next visitors are not made to wait', async () => {
    youtube.mockImplementation(async () => new Response('nope', { status: 503 }));
    await get();
    await get();
    await get();
    expect(youtube).toHaveBeenCalledTimes(1);
  });

  test('the video appears once the feed recovers', async () => {
    youtube.mockImplementationOnce(async () => new Response('nope', { status: 503 }));
    await untouched();

    vi.setSystemTime(new Date('2026-11-22T12:01:01Z'));
    const html = await (await get()).text();
    expect(youtube).toHaveBeenCalledTimes(2);
    expect(tagsWith(html, 'data-lv="link"')[0]).toContain('watch?v=bbbbbbbbbbb');
    for (const t of tagsWith(html, 'data-lv="fallback"')) expect(isHidden(t)).toBe(true);
  });

  test('the last good video keeps being shown during an outage', async () => {
    await get();
    youtube.mockImplementation(async () => new Response('down', { status: 503 }));
    vi.setSystemTime(new Date('2026-11-22T13:00:00Z'));

    const html = await (await get()).text();
    expect(youtube).toHaveBeenCalledTimes(2);
    expect(tagsWith(html, 'data-lv="link"')[0]).toContain('watch?v=bbbbbbbbbbb');

    await get();
    expect(youtube).toHaveBeenCalledTimes(2); // backing off
  });
});

describe('homepage: hostile video titles', () => {
  const evil = '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; <b>bold</b>';

  test('cannot inject markup or break out of an attribute', async () => {
    youtube.mockImplementation(async () => new Response(feedWith('aaaaaaaaaaa', evil)));
    const html = await (await get()).text();

    const [link] = tagsWith(html, 'data-lv="link"');
    const label = /aria-label="([^"]*)"/.exec(link!)?.[1];
    // fully escaped: no raw < > " or bare & survives in the attribute
    expect(label).toBe('Play video: &quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;bold&lt;/b&gt;');
    // in a text node < > & are escaped (a quote is harmless there)
    expect(html).toContain('data-lv="title">"&gt;&lt;script&gt;alert(1)&lt;/script&gt; &amp; &lt;b&gt;bold&lt;/b&gt;</p>');
    // no real <script> or <b> element was created by the title
    const structural = html.replace(/<[a-z][a-z0-9-]*(?:[^>"']|"[^"]*"|'[^']*')*>/g, (t) => t.replace(/"[^"]*"|'[^']*'/g, '""'));
    expect(structural).not.toMatch(/<script|<b>/);
  });
});

describe('homepage: everything else passes straight through', () => {
  test('non-GET requests never touch the feed', async () => {
    const res = await get('/', { method: 'POST', body: 'x' });
    expect(assetsFetch).toHaveBeenCalledTimes(1);
    expect(youtube).not.toHaveBeenCalled();
    expect(await res.text()).toBe(fallbackPage);
  });

  test('a non-200 or non-HTML answer from the assets is returned as is, without reading the feed', async () => {
    assetsFetch.mockImplementationOnce(async () => new Response('missing', { status: 404 }));
    expect((await get()).status).toBe(404);
    assetsFetch.mockImplementationOnce(async () => new Response('{}', { headers: { 'Content-Type': 'application/json' } }));
    expect(await (await get()).text()).toBe('{}');
    expect(youtube).not.toHaveBeenCalled();
  });

  test('other paths are static assets and never touch the feed', async () => {
    assetsFetch.mockImplementationOnce(async () => new Response('body{}', { headers: { 'Content-Type': 'text/css' } }));
    const res = await get('/_astro/index.css');
    expect(await res.text()).toBe('body{}');
    expect(youtube).not.toHaveBeenCalled();
  });
});
