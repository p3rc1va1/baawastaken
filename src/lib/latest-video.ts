import snapshotJson from '../data/youtube.json?raw';
import type { Video } from './youtube/feed.ts';
import { parseSnapshot, type Snapshot } from './youtube/snapshot.ts';

export type { Video };

/**
 * The newest long-form upload, read from the committed YouTube snapshot (src/data/youtube.json, kept
 * up to date by scripts/youtube-sync.ts). It does no network I/O, so a build never depends on YouTube.
 * Returns null when no video was ever captured; the TV then shows its "Watch on YouTube" fallback.
 */
export function getLatestVideo(snapshot: Snapshot = parseSnapshot(snapshotJson)): Video | null {
  const id = snapshot.latest;
  const v = id === null ? undefined : snapshot.videos[id];
  return id !== null && v ? { id, title: v.title, published: v.published } : null;
}
