# Proposal

## Why

Every homepage visit runs the edge Worker, which fills in the TV and proxies the thumbnail. On Cloudflare's free plan that caps the site at about 100,000 Worker requests a day. Past that limit, visitors get a Cloudflare error page, not the last good page. Static files are free and unlimited, and the repository is public, so GitHub Actions runs cost nothing. Moving the YouTube data into a snapshot that a scheduled bot keeps up to date makes every page view a static file: unlimited visits for $0, and a page that can never be "broken", only slightly behind. This becomes the base that `add-seo-and-notes` and `add-game-pages` build on.

## What Changes

- **A YouTube sync bot**:
  - A scheduled GitHub Actions workflow runs about every 5 minutes and can also be started by hand.
  - It reads the channel's public RSS feed, picks the newest long-form upload (skipping Shorts) and downloads its thumbnail.
  - It commits a snapshot to `main` only when something changed. That push triggers the normal Cloudflare deploy.
  - It keeps itself active, so GitHub doesn't switch the schedule off in quiet periods.
- **Fully static site**: the homepage TV is rendered at build time from the committed snapshot, and thumbnails are served as plain files. **BREAKING (internal)**: the edge Worker, its `/` HTML rewriting and its `/yt-thumb/*` proxy are removed, and the deploy becomes static assets only.
- **Builds never contact YouTube.** They read only committed data, so a YouTube outage can't fail or slow a deploy.
- **Room for later interactions**: page views run no code. Future interactive features (view counts, likes, comments) may use code under `/api/*`, and no page may depend on it to render.
- **Freshness**: a new long-form video typically shows on the TV within about 10–25 minutes. YouTube's own feed delay is the biggest factor. Today it's up to about 30 minutes through the Worker cache.

## Capabilities

### New Capabilities
- `youtube-sync`: the scheduled bot that captures YouTube data and thumbnails into the repository: schedule, change detection, Shorts filtering, failure handling, thumbnail storage and staying active.

### Modified Capabilities
- `latest-video`: the source becomes the committed snapshot rather than an edge fetch. Freshness and fallback rules change. Shorts are skipped. Thumbnails become static files instead of a proxy endpoint.
- `site-hosting`: no per-request code for page views, `/api/*` reserved for future interactive features, and deploys also triggered by snapshot commits.

## Impact

- **Removed**: `worker/index.ts`, `worker/config.ts`, `tests/worker/**`, `tests/e2e/worker.e2e.ts`, and the `main` and `run_worker_first` entries in `wrangler.jsonc`.
- **Kept and reused**: `worker/feed.ts` (the parser) moves to `src/lib/youtube/feed.ts` and gains Shorts filtering.
- **New**:
  - `.github/workflows/youtube-sync.yml`
  - `scripts/youtube-sync.ts`
  - `src/data/youtube.json` (the snapshot)
  - `public/yt/<id>.jpg` (thumbnails)
- **Changed**:
  - `LatestVideoTV.astro` (build-time only; the `data-lv` markers are dropped)
  - `src/lib/latest-video.ts` (reads the snapshot)
  - `public/_headers` (thumbnail caching)
- **Repository**: bot commits land on `main` when a new video appears (a few a week). Each thumbnail is about 10 KB, and unreferenced ones are deleted.
- **Hosting**: Cloudflare deploy on push is unchanged. Worker request usage drops to zero.
- **Order**: apply and archive this change before `add-seo-and-notes`, then `add-game-pages`.
