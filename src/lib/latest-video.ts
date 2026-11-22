import { feedUrl, parseLatestVideo, type Video } from '../../worker/feed';
import { site } from '../data/site';

export type { Video };

/**
 * The newest upload, read from the channel feed at build time. This is the snapshot baked into the
 * static page; the Worker refreshes it when the page is served. It never throws: any failure (offline,
 * timeout, HTTP error, unreadable feed) returns null and the build carries on with the fallback.
 */
export async function getLatestVideo(
  opts: { fetchFn?: typeof fetch; timeoutMs?: number } = {},
): Promise<Video | null> {
  const { fetchFn = fetch, timeoutMs = 5000 } = opts;
  try {
    const res = await fetchFn(feedUrl(site.youtubeChannelId), { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) {
      console.warn(`[latest-video] feed responded ${res.status}; building without a snapshot`);
      return null;
    }
    const video = parseLatestVideo(await res.text());
    if (!video) console.warn('[latest-video] feed had no usable entries; building without a snapshot');
    return video;
  } catch (error) {
    console.warn(`[latest-video] could not read the feed (${(error as Error).message}); building without a snapshot`);
    return null;
  }
}
