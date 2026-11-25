import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sync } from '../scripts/youtube-sync.ts';

const jpeg = (n: number) => new Uint8Array([0xff, 0xd8, 0xff, n, 1, 2, 3]);
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
const entry = (id: string, title: string, published: string, kind = 'watch?v=') =>
  `<entry><yt:videoId>${id}</yt:videoId><title>${title}</title><link rel="alternate" href="https://www.youtube.com/${kind}${id}"/><published>${published}</published></entry>`;
const feed = (...e: string[]) => `<feed>${e.join('')}</feed>`;

let root: string;
beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ytsync-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

/** A fake YouTube: the feed XML (or an error) and per-ID thumbnails. */
function fakeFetch(opts: { feed?: string | number; thumbs?: Record<string, Uint8Array | number> }) {
  return vi.fn(async (url: string | URL | Request) => {
    const u = String(url);
    if (u.includes('/feeds/videos.xml')) {
      return typeof opts.feed === 'number' ? new Response('x', { status: opts.feed }) : new Response(opts.feed ?? '');
    }
    const id = /\/vi\/([^/]+)\//.exec(u)?.[1] ?? '';
    const t = opts.thumbs?.[id];
    if (t === undefined || typeof t === 'number') return new Response('x', { status: t ?? 404 });
    return new Response(t as BodyInit);
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

/** Every file under root with its mtime, to prove nothing was touched. */
function tree(dir = root): Record<string, string> {
  const out: Record<string, string> = {};
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) Object.assign(out, tree(p));
    else out[p] = `${statSync(p).mtimeMs}:${readFileSync(p).toString('base64')}`;
  }
  return out;
}

const snapshotFile = () => join(root, 'src/data/youtube.json');
const readSnap = () => JSON.parse(readFileSync(snapshotFile(), 'utf8'));
const thumb = (id: string) => join(root, 'public/yt', `${id}.jpg`);

const A = 'aaaaaaaaaaa';
const B = 'bbbbbbbbbbb';
const xmlA = feed(entry(A, 'First', '2026-11-01T00:00:00Z'));

describe('youtube-sync', () => {
  test('new video: stores the thumbnail and writes the snapshot', async () => {
    const fetchFn = fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } });
    const summary = await sync({ root, fetchFn });
    expect(summary).toContain(`latest is now ${A}`);
    expect(readSnap()).toEqual({
      version: 1,
      channelId: 'UC-MLQMe0PJR6v2d14VVb5fg',
      latest: A,
      videos: { [A]: { title: 'First', published: '2026-11-01T00:00:00.000Z', thumbSha256: sha(jpeg(1)) } },
    });
    expect(new Uint8Array(readFileSync(thumb(A)))).toEqual(jpeg(1));
  });

  test('skips a newer Short and picks the long-form video', async () => {
    const xml = feed(entry(B, 'Short', '2026-12-01T00:00:00Z', 'shorts/'), entry(A, 'Long', '2026-11-01T00:00:00Z'));
    await sync({ root, fetchFn: fakeFetch({ feed: xml, thumbs: { [A]: jpeg(1) } }) });
    expect(readSnap().latest).toBe(A);
    expect(existsSync(thumb(B))).toBe(false);
  });

  test('no change: second run writes no files and downloads no thumbnail', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const before = tree();
    await new Promise((r) => setTimeout(r, 15));
    const fetchFn = fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } });
    expect(await sync({ root, fetchFn })).toBe('no change');
    expect(tree()).toEqual(before);
    expect(fetchFn).toHaveBeenCalledTimes(1); // the feed only
  });

  test('feed error: nothing changes and it throws', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const before = tree();
    await expect(sync({ root, fetchFn: fakeFetch({ feed: 503 }) })).rejects.toThrow(/503/);
    await expect(sync({ root, fetchFn: fakeFetch({ feed: '<html>captcha</html>' }) })).rejects.toThrow(/no usable/);
    expect(tree()).toEqual(before);
  });

  test('thumbnail error: the snapshot is not updated and nothing is written', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const before = tree();
    const xml = feed(entry(B, 'Newer', '2026-12-01T00:00:00Z'), entry(A, 'First', '2026-11-01T00:00:00Z'));
    await expect(sync({ root, fetchFn: fakeFetch({ feed: xml, thumbs: { [B]: 404 } }) })).rejects.toThrow(/404/);
    await expect(sync({ root, fetchFn: fakeFetch({ feed: xml, thumbs: { [B]: new Uint8Array([1, 2, 3, 4]) } }) })).rejects.toThrow(/not a JPEG/);
    expect(tree()).toEqual(before);
  });

  test('hourly recheck replaces a thumbnail that changed on YouTube; a normal run does not look', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const same = fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(2) } });
    expect(await sync({ root, fetchFn: same })).toBe('no change');
    expect(same).toHaveBeenCalledTimes(1);

    const summary = await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(2) } }), recheckThumbnails: true });
    expect(summary).toContain('thumbnail replaced');
    expect(new Uint8Array(readFileSync(thumb(A)))).toEqual(jpeg(2));
    expect(readSnap().videos[A].thumbSha256).toBe(sha(jpeg(2)));
  });

  test('hourly recheck with an unchanged thumbnail changes nothing', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const before = tree();
    expect(await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }), recheckThumbnails: true })).toBe('no change');
    expect(tree()).toEqual(before);
  });

  test('a thumbnail no longer referenced is removed', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    const xml = feed(entry(B, 'Newer', '2026-12-01T00:00:00Z'), entry(A, 'First', '2026-11-01T00:00:00Z'));
    const summary = await sync({ root, fetchFn: fakeFetch({ feed: xml, thumbs: { [B]: jpeg(9) } }) });
    expect(summary).toContain(`removed ${A}.jpg`);
    expect(existsSync(thumb(A))).toBe(false);
    expect(existsSync(thumb(B))).toBe(true);
    expect(Object.keys(readSnap().videos)).toEqual([B]);
  });

  test('a missing thumbnail file for a known video is downloaded again', async () => {
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    rmSync(thumb(A));
    await sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) });
    expect(existsSync(thumb(A))).toBe(true);
  });

  test('a corrupt snapshot is an error, not silently replaced', async () => {
    mkdirSync(join(root, 'src/data'), { recursive: true });
    writeFileSync(snapshotFile(), '{oops');
    await expect(sync({ root, fetchFn: fakeFetch({ feed: xmlA, thumbs: { [A]: jpeg(1) } }) })).rejects.toThrow(/not valid JSON/);
  });
});
