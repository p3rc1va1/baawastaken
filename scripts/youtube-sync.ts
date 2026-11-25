/**
 * YouTube sync: the only code that talks to YouTube. Run by .github/workflows/youtube-sync.yml
 * (`node scripts/youtube-sync.ts`, Node 24 strips the types), and safe to run by hand.
 *
 * It reads the channel feed, picks the newest long-form upload, stores its thumbnail under public/yt/
 * and writes src/data/youtube.json. Any error throws before a single file is touched, and an
 * unchanged state writes nothing, so the caller can commit only when `git status` shows a change.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { site } from '../src/data/site.ts';
import { feedUrl, parseLatestVideo, thumbSource } from '../src/lib/youtube/feed.ts';
import { emptySnapshot, parseSnapshot, serializeSnapshot, type Snapshot } from '../src/lib/youtube/snapshot.ts';

export interface SyncOptions {
  /** Repository root. */
  root: string;
  channelId?: string;
  fetchFn?: typeof fetch;
  /** Re-download stored thumbnails and compare hashes (done in the runs at minutes 2-6 of each hour). */
  recheckThumbnails?: boolean;
  timeoutMs?: number;
}

const sha256 = (bytes: Uint8Array) => createHash('sha256').update(bytes).digest('hex');

async function get(fetchFn: typeof fetch, url: string, timeoutMs: number): Promise<Response> {
  const res = await fetchFn(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} responded ${res.status}`);
  return res;
}

async function downloadThumbnail(fetchFn: typeof fetch, id: string, timeoutMs: number): Promise<Uint8Array> {
  const res = await get(fetchFn, thumbSource(id), timeoutMs);
  const bytes = new Uint8Array(await res.arrayBuffer());
  const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (!isJpeg) throw new Error(`thumbnail for ${id} is not a JPEG image`);
  return bytes;
}

/** Returns a one-line summary of what changed ("no change" if nothing did). Throws on any failure. */
export async function sync(opts: SyncOptions): Promise<string> {
  const { root, channelId = site.youtubeChannelId, fetchFn = fetch, recheckThumbnails = false, timeoutMs = 15_000 } = opts;
  const snapshotPath = join(root, 'src/data/youtube.json');
  const thumbDir = join(root, 'public/yt');
  const thumbFile = (id: string) => join(thumbDir, `${id}.jpg`);

  const oldText = existsSync(snapshotPath) ? readFileSync(snapshotPath, 'utf8') : null;
  const old: Snapshot = oldText === null ? emptySnapshot(channelId) : parseSnapshot(oldText);

  const feed = await (await get(fetchFn, feedUrl(channelId), timeoutMs)).text();
  const latest = parseLatestVideo(feed);
  if (!latest) throw new Error('the feed has no usable long-form video');

  // Gather everything first; nothing is written until every download has succeeded.
  const writes = new Map<string, Uint8Array>();
  const known = old.videos[latest.id];
  const stored = existsSync(thumbFile(latest.id));
  let thumbSha256 = known?.thumbSha256 ?? '';
  const notes: string[] = [];

  if (!known || !stored) {
    const bytes = await downloadThumbnail(fetchFn, latest.id, timeoutMs);
    thumbSha256 = sha256(bytes);
    writes.set(thumbFile(latest.id), bytes);
  } else if (recheckThumbnails) {
    const bytes = await downloadThumbnail(fetchFn, latest.id, timeoutMs);
    if (sha256(bytes) !== known.thumbSha256 || sha256(readFileSync(thumbFile(latest.id))) !== known.thumbSha256) {
      thumbSha256 = sha256(bytes);
      writes.set(thumbFile(latest.id), bytes);
      notes.push('thumbnail replaced');
    }
  }

  const next: Snapshot = {
    version: 1,
    channelId,
    latest: latest.id,
    videos: { [latest.id]: { title: latest.title, published: latest.published, thumbSha256 } },
  };
  const nextText = serializeSnapshot(next);

  const stale = existsSync(thumbDir)
    ? readdirSync(thumbDir).filter((f) => f.endsWith('.jpg') && !(f.slice(0, -4) in next.videos))
    : [];

  if (nextText !== oldText) {
    mkdirSync(dirname(snapshotPath), { recursive: true });
    writeFileSync(snapshotPath, nextText);
    if (old.latest !== latest.id) notes.unshift(`latest is now ${latest.id}`);
    else notes.unshift('video details updated');
  }
  for (const [path, bytes] of writes) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, bytes);
  }
  for (const f of stale) {
    unlinkSync(join(thumbDir, f));
    notes.push(`removed ${f}`);
  }
  if (writes.size && !notes.length) notes.push('thumbnail stored');

  return notes.length ? notes.join(', ') : 'no change';
}

if (import.meta.main) {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const minute = new Date().getUTCMinutes();
  sync({ root, recheckThumbnails: minute >= 2 && minute <= 6 })
    .then((summary) => {
      const snap = parseSnapshot(readFileSync(join(root, 'src/data/youtube.json'), 'utf8'));
      console.log(`latest video: ${snap.latest}`);
      console.log(`youtube-sync: ${summary}`);
    })
    .catch((error: Error) => {
      console.error(`youtube-sync failed: ${error.message}`);
      process.exit(1);
    });
}
