import { createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import worker from '../../worker/index';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46]);
const assetsFetch = vi.fn<(req: Request) => Promise<Response>>();
const env = { ASSETS: { fetch: (req: Request) => assetsFetch(req) } as unknown as Fetcher };
const upstream = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>();

async function get(path: string, init?: RequestInit): Promise<Response> {
  const ctx = createExecutionContext();
  const res = await worker.fetch(new Request(`https://baawastaken.com${path}`, init), env, ctx);
  await waitOnExecutionContext(ctx);
  return res;
}

beforeEach(() => {
  assetsFetch.mockReset();
  assetsFetch.mockImplementation(async () => new Response('asset'));
  upstream.mockReset();
  upstream.mockImplementation(async () => new Response(jpeg, { headers: { 'Content-Type': 'image/jpeg' } }));
  vi.stubGlobal('fetch', upstream);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('/yt-thumb/<id>', () => {
  test('serves a valid video\'s thumbnail from one fixed upstream address', async () => {
    const res = await get('/yt-thumb/sXAz0SK9lZg');
    expect(res.status).toBe(200);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(jpeg);
    expect(upstream).toHaveBeenCalledTimes(1);
    expect(String(upstream.mock.calls[0]![0])).toBe('https://i.ytimg.com/vi/sXAz0SK9lZg/mqdefault.jpg');
  });

  test('is cacheable for a day, typed as an image and not sniffable', async () => {
    const res = await get('/yt-thumb/sXAz0SK9lZg');
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  test('asks the edge to cache good thumbnails and not errors', async () => {
    await get('/yt-thumb/sXAz0SK9lZg');
    const cf = (upstream.mock.calls[0]![1] as { cf?: { cacheEverything?: boolean; cacheTtlByStatus?: Record<string, number> } }).cf;
    expect(cf?.cacheEverything).toBe(true);
    expect(cf?.cacheTtlByStatus?.['200-299']).toBe(86400);
    expect(cf?.cacheTtlByStatus?.['500-599']).toBe(0);
  });

  test.each([
    ['empty', '/yt-thumb/'],
    ['an encoded dot', '/yt-thumb/%2e'],
    ['12 characters', '/yt-thumb/aaaaaaaaaaaa'],
    ['10 characters', '/yt-thumb/aaaaaaaaaa'],
    ['a URL', '/yt-thumb/https://evil.example/x.jpg'],
    ['an encoded URL', '/yt-thumb/https%3A%2F%2Fevil.example%2Fx'],
    ['encoded traversal', '/yt-thumb/%2e%2e%2f%2e%2e%2fsecret'],
    ['an extra path segment', '/yt-thumb/sXAz0SK9lZg/extra'],
    ['a trailing slash', '/yt-thumb/sXAz0SK9lZg/'],
    ['a space', '/yt-thumb/sXAz0%20K9lZg'],
    ['a query-looking id', '/yt-thumb/sXAz0SK9lZg?x=1/..'.replace('?x=1/..', '%3Fx')],
    ['a NUL byte', '/yt-thumb/sXAz0SK9l%00g'],
    ['unicode', '/yt-thumb/sXAz0SK9lé'],
  ])('rejects %s with 404 and makes no upstream request', async (_name, path) => {
    const res = await get(path);
    expect(res.status).toBe(404);
    expect(upstream).not.toHaveBeenCalled();
  });

  test.each(['/yt-thumb/../etc/passwd', '/yt-thumb/..', '/yt-thumb/./sXAz0SK9lZg/../..'])(
    'dot segments in %s are resolved away before routing and never reach YouTube',
    async (path) => {
      await get(path);
      expect(upstream).not.toHaveBeenCalled();
    },
  );

  test('a query string does not change which thumbnail is fetched', async () => {
    const res = await get('/yt-thumb/sXAz0SK9lZg?evil=https://x.example');
    expect(res.status).toBe(200);
    expect(String(upstream.mock.calls[0]![0])).toBe('https://i.ytimg.com/vi/sXAz0SK9lZg/mqdefault.jpg');
  });

  test('a thumbnail YouTube does not have is a 404', async () => {
    upstream.mockImplementation(async () => new Response('nope', { status: 404 }));
    expect((await get('/yt-thumb/sXAz0SK9lZg')).status).toBe(404);
  });

  test('YouTube errors and network failures are a 502, never an exception', async () => {
    upstream.mockImplementationOnce(async () => new Response('boom', { status: 503 }));
    expect((await get('/yt-thumb/sXAz0SK9lZg')).status).toBe(502);
    upstream.mockImplementationOnce(async () => {
      throw new TypeError('fetch failed');
    });
    expect((await get('/yt-thumb/sXAz0SK9lZg')).status).toBe(502);
  });

  test('an upstream answer that is not an image is refused', async () => {
    upstream.mockImplementation(async () => new Response('<html>captcha</html>', { headers: { 'Content-Type': 'text/html' } }));
    expect((await get('/yt-thumb/sXAz0SK9lZg')).status).toBe(502);
  });

  test('only GET and HEAD are allowed', async () => {
    const res = await get('/yt-thumb/sXAz0SK9lZg', { method: 'POST', body: 'x' });
    expect(res.status).toBe(405);
    expect(res.headers.get('Allow')).toBe('GET, HEAD');
    expect(upstream).not.toHaveBeenCalled();
  });
});
