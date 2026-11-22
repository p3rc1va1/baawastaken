/**
 * Settings and helpers for the edge Worker. They live outside worker/index.ts because a Worker's entry
 * module may export only its handler: any other export stops the runtime from starting.
 */

/** How long a good feed result is used before it is fetched again. */
export const FEED_TTL_SECONDS = 30 * 60;
/** After a failed fetch, wait this long before trying again, so a YouTube outage never slows the page down. */
export const FAILURE_BACKOFF_SECONDS = 60;
export const FEED_TIMEOUT_MS = 3000;
export const THUMB_TTL_SECONDS = 24 * 60 * 60;
export const THUMB_TIMEOUT_MS = 4000;
/** The Cache API entry outlives its freshness so the last good video can still be served during an outage. */
export const CACHE_RETENTION_SECONDS = 7 * 24 * 60 * 60;
export const CACHE_KEY = 'https://baawastaken.invalid/latest-video';

/** Cloudflare's per-data-centre cache. (This project's DOM typings do not know about `caches.default`.) */
export const defaultCache = (): Cache => (caches as unknown as { default: Cache }).default;

/** The data-lv markers the page exposes (see src/components/LatestVideoTV.astro). */
export const MARKERS = ['video', 'fallback', 'player', 'link', 'thumb', 'title', 'date'] as const;
