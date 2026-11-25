/**
 * The committed YouTube snapshot (src/data/youtube.json): the only place the site build reads YouTube
 * data from. Erasable TypeScript only, so the sync script can run it directly with Node.
 */
import { isVideoId } from './feed.ts';

export interface SnapshotVideo {
  title: string;
  /** Publish time as an ISO 8601 UTC string. */
  published: string;
  /** SHA-256 (hex) of the stored thumbnail, used to notice when YouTube's copy changes. */
  thumbSha256: string;
}

export interface Snapshot {
  version: 1;
  channelId: string;
  /** ID of the newest long-form upload, or null if none was ever captured. */
  latest: string | null;
  videos: Record<string, SnapshotVideo>;
}

export const emptySnapshot = (channelId: string): Snapshot => ({ version: 1, channelId, latest: null, videos: {} });

/** Parses and validates snapshot JSON. Throws an Error that says what is wrong. */
export function parseSnapshot(json: string): Snapshot {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch (error) {
    throw new Error(`snapshot is not valid JSON: ${(error as Error).message}`);
  }
  const bad = (why: string): never => {
    throw new Error(`invalid snapshot: ${why}`);
  };
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return bad('expected an object');
  const d = data as Record<string, unknown>;
  if (d['version'] !== 1) return bad(`unsupported version ${JSON.stringify(d['version'])}`);
  if (typeof d['channelId'] !== 'string' || !d['channelId']) return bad('channelId must be a non-empty string');
  const videos = d['videos'];
  if (typeof videos !== 'object' || videos === null || Array.isArray(videos)) return bad('videos must be an object');

  const out: Record<string, SnapshotVideo> = {};
  for (const [id, v] of Object.entries(videos)) {
    if (!isVideoId(id)) return bad(`"${id}" is not a video ID`);
    const r = v as Record<string, unknown> | null;
    if (typeof r !== 'object' || r === null) return bad(`video ${id} must be an object`);
    if (typeof r['title'] !== 'string' || !r['title']) return bad(`video ${id} needs a title`);
    if (typeof r['published'] !== 'string' || Number.isNaN(Date.parse(r['published']))) return bad(`video ${id} needs a valid published date`);
    if (typeof r['thumbSha256'] !== 'string' || !/^[0-9a-f]{64}$/.test(r['thumbSha256'])) return bad(`video ${id} needs a 64-character hex thumbSha256`);
    out[id] = { title: r['title'], published: r['published'], thumbSha256: r['thumbSha256'] };
  }

  const latest = d['latest'];
  if (latest !== null && typeof latest !== 'string') return bad('latest must be a video ID or null');
  if (typeof latest === 'string' && !(latest in out)) return bad(`latest "${latest}" is not in videos`);

  return { version: 1, channelId: d['channelId'], latest: latest ?? null, videos: out };
}

/** Deterministic JSON: sorted keys, two-space indent, trailing newline, no timestamps. */
export function serializeSnapshot(snapshot: Snapshot): string {
  const sort = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(sort);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([k, v]) => [k, sort(v)]),
      );
    }
    return value;
  };
  return `${JSON.stringify(sort(snapshot), null, 2)}\n`;
}
