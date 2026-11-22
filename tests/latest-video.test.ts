import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getLatestVideo } from '../src/lib/latest-video';
import { root } from './helpers';

const xml = readFileSync(`${root}tests/fixtures/feed.xml`, 'utf8');
const ok = (body: string) => (async () => new Response(body, { status: 200 })) as unknown as typeof fetch;

afterEach(() => vi.restoreAllMocks());

describe('getLatestVideo (build-time snapshot)', () => {
  test('returns the newest video from the channel feed', async () => {
    const fetchFn = vi.fn(ok(xml));
    const video = await getLatestVideo({ fetchFn });
    expect(video?.id).toBe('bbbbbbbbbbb');
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(String(fetchFn.mock.calls[0]![0])).toBe(
      'https://www.youtube.com/feeds/videos.xml?channel_id=UC-MLQMe0PJR6v2d14VVb5fg',
    );
  });

  test('null (with a warning, not an exception) when the network fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchFn = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    await expect(getLatestVideo({ fetchFn })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('fetch failed'));
  });

  test('null on an HTTP error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fetchFn = (async () => new Response('nope', { status: 503 })) as unknown as typeof fetch;
    await expect(getLatestVideo({ fetchFn })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('503'));
  });

  test('null when the feed is empty or malformed', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(getLatestVideo({ fetchFn: ok('<feed></feed>') })).resolves.toBeNull();
    await expect(getLatestVideo({ fetchFn: ok('<html>captcha</html>') })).resolves.toBeNull();
    expect(warn).toHaveBeenCalledTimes(2);
  });

  test('null when the feed is too slow', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const hang = ((_url: unknown, init?: RequestInit) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal!.reason));
      })) as unknown as typeof fetch;
    const started = Date.now();
    await expect(getLatestVideo({ fetchFn: hang, timeoutMs: 30 })).resolves.toBeNull();
    expect(Date.now() - started).toBeLessThan(1000);
  });
});
