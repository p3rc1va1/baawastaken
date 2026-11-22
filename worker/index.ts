/**
 * Edge Worker for baawastaken.com. Everything is served as static files except two routes:
 *
 *   /             the homepage HTML, with the channel's newest video filled in
 *   /yt-thumb/ID  that video's thumbnail, served from our own origin
 *
 * Both fail soft: if YouTube is slow or down, visitors get the page exactly as it was built.
 */
import { site } from '../src/data/site';
import {
  CACHE_KEY,
  CACHE_RETENTION_SECONDS,
  FAILURE_BACKOFF_SECONDS,
  FEED_TIMEOUT_MS,
  FEED_TTL_SECONDS,
  THUMB_TIMEOUT_MS,
  THUMB_TTL_SECONDS,
  defaultCache,
} from './config';
import { feedUrl, formatPublished, isVideoId, parseLatestVideo, thumbPath, thumbSource, watchUrl, type Video } from './feed';

interface Env {
  ASSETS: Fetcher;
}

interface CacheEntry {
  /** The last good video, if there has ever been one. */
  video: Video | null;
  /** When this entry was written (ms since epoch). */
  at: number;
  /** Whether the fetch that produced this entry succeeded. */
  ok: boolean;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/') return home(request, env, ctx);
    if (pathname.startsWith('/yt-thumb/')) return thumbnail(request, pathname.slice('/yt-thumb/'.length));
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

// ---------------------------------------------------------------------------------------------------------
// Homepage

async function home(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return env.ASSETS.fetch(request);

  // The page changes per request, so browsers' validators for the static file must not short-circuit us.
  const headers = new Headers(request.headers);
  headers.delete('If-None-Match');
  headers.delete('If-Modified-Since');
  const asset = await env.ASSETS.fetch(new Request(request, { headers }));
  if (!asset.ok || !(asset.headers.get('Content-Type') ?? '').includes('text/html')) return asset;

  let video: Video | null = null;
  try {
    video = await latestVideo(ctx);
  } catch (error) {
    console.warn('latest video unavailable:', error);
  }
  return video ? withVideo(asset, video) : asset;
}

/** The newest video: from cache while fresh, otherwise from the feed, otherwise the last good one. */
async function latestVideo(ctx: ExecutionContext): Promise<Video | null> {
  const cache = defaultCache();
  const cached = await readEntry(cache);
  const age = cached ? (Date.now() - cached.at) / 1000 : Infinity;

  if (cached?.ok && age < FEED_TTL_SECONDS) return cached.video;
  if (cached && !cached.ok && age < FAILURE_BACKOFF_SECONDS) return cached.video;

  const fresh = await fetchLatest();
  const entry: CacheEntry = fresh
    ? { video: fresh, at: Date.now(), ok: true }
    : { video: cached?.video ?? null, at: Date.now(), ok: false };
  ctx.waitUntil(writeEntry(cache, entry));
  return entry.video;
}

async function readEntry(cache: Cache): Promise<CacheEntry | null> {
  try {
    const hit = await cache.match(CACHE_KEY);
    if (!hit) return null;
    const entry = (await hit.json()) as Partial<CacheEntry>;
    const video = entry.video ?? null;
    const valid =
      typeof entry.at === 'number' &&
      typeof entry.ok === 'boolean' &&
      (video === null || (isVideoId(video.id) && typeof video.title === 'string' && !Number.isNaN(Date.parse(video.published))));
    return valid ? (entry as CacheEntry) : null;
  } catch {
    return null;
  }
}

async function writeEntry(cache: Cache, entry: CacheEntry): Promise<void> {
  try {
    await cache.put(
      CACHE_KEY,
      new Response(JSON.stringify(entry), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_RETENTION_SECONDS}` },
      }),
    );
  } catch (error) {
    console.warn('could not cache latest video:', error);
  }
}

async function fetchLatest(): Promise<Video | null> {
  try {
    const res = await fetch(feedUrl(site.youtubeChannelId), {
      signal: AbortSignal.timeout(FEED_TIMEOUT_MS),
      // Cache the XML at the edge too, but never an error response.
      cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': FEED_TTL_SECONDS, '400-599': 0 } },
    });
    if (!res.ok) return null;
    return parseLatestVideo(await res.text());
  } catch {
    return null;
  }
}

/** HTMLRewriter escapes only the quote character in attribute values, so escape the rest ourselves. */
const escapeAttribute = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Fills the page's data-lv markers with `video`. Text is inserted as text; attribute values are escaped here. */
function withVideo(asset: Response, video: Video): Response {
  const rewriter = new HTMLRewriter()
    .on('[data-lv="video"]', { element: (el) => void el.removeAttribute('hidden') })
    .on('[data-lv="fallback"]', { element: (el) => void el.setAttribute('hidden', '') })
    .on('[data-lv="player"]', { element: (el) => void el.setAttribute('data-video-id', escapeAttribute(video.id)) })
    .on('[data-lv="link"]', {
      element(el) {
        el.setAttribute('href', escapeAttribute(watchUrl(video.id)));
        el.setAttribute('aria-label', escapeAttribute(`Play video: ${video.title}`));
      },
    })
    .on('[data-lv="thumb"]', { element: (el) => void el.setAttribute('src', escapeAttribute(thumbPath(video.id))) })
    .on('[data-lv="title"]', { element: (el) => void el.setInnerContent(video.title) })
    .on('[data-lv="date"]', {
      element(el) {
        el.setAttribute('datetime', escapeAttribute(video.published));
        el.setInnerContent(formatPublished(video.published));
      },
    });

  const res = new Response(rewriter.transform(asset).body, asset);
  // The body no longer matches the static file's validators, and it changes with the feed.
  res.headers.delete('ETag');
  res.headers.delete('Last-Modified');
  res.headers.delete('Content-Length');
  res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
  return res;
}

// ---------------------------------------------------------------------------------------------------------
// Thumbnails

async function thumbnail(request: Request, id: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  // Only a bare 11-character video ID is ever turned into an upstream request, so this cannot be used as a proxy.
  if (!isVideoId(id)) return new Response('Not found', { status: 404 });

  let upstream: Response;
  try {
    upstream = await fetch(thumbSource(id), {
      signal: AbortSignal.timeout(THUMB_TIMEOUT_MS),
      cf: { cacheEverything: true, cacheTtlByStatus: { '200-299': THUMB_TTL_SECONDS, '404': 60, '500-599': 0 } },
    });
  } catch {
    return new Response('Thumbnail unavailable', { status: 502 });
  }
  if (upstream.status === 404) return new Response('Not found', { status: 404 });
  if (!upstream.ok || !(upstream.headers.get('Content-Type') ?? '').startsWith('image/')) {
    return new Response('Thumbnail unavailable', { status: 502 });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'image/jpeg',
      'Cache-Control': `public, max-age=${THUMB_TTL_SECONDS}`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
