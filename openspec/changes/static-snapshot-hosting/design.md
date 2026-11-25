# Design

## Context

- **Today**: Cloudflare runs `worker/index.ts` for `/` (it adds the latest video to the static HTML using HTMLRewriter and a 30-minute Cache API entry) and for `/yt-thumb/*` (a thumbnail proxy). Everything else is static assets.
- **Parser**: `worker/feed.ts` is a dependency-free RSS parser used by both the Worker and the build.
- **Deploys**: Cloudflare's Git integration builds and deploys on every push to `main`.
- **Repository**: public on GitHub, with no Actions workflows yet.
- See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Zero per-request code for page views.
- The build is deterministic and offline: it reads only committed files.
- One place, the sync script, talks to YouTube, and later changes extend it (game playlists, post videos).

**Non-Goals:**
- Push notifications from YouTube (WebSub) for near-instant updates. That's a possible later add-on under `/api/*`, with polling kept as the safety net.
- Building `/api/*` itself. This change only reserves the path in the spec.

## Decisions

### A dependency-free sync script on GitHub Actions
- **Workflow**: `.github/workflows/youtube-sync.yml`
  - `on.schedule: cron '2-59/5 * * * *'` (every 5 minutes, off the busy top-of-hour slots) plus `workflow_dispatch`
  - `concurrency: { group: youtube-sync, cancel-in-progress: false }`
  - `permissions: contents: write, actions: write`
- **Steps**: check out (shallow), set up Node 24, run `node scripts/youtube-sync.ts`. Node 24 strips TypeScript types natively, so there's no `npm ci`, and a run takes about 10–20 seconds.
- **The script**:
  1. Fetches the RSS feed and runs the shared parser.
  2. Picks the newest long-form entry.
  3. Ensures its thumbnail exists in `public/yt/<id>.jpg`.
  4. Writes `src/data/youtube.json` deterministically: sorted keys, no run timestamps, so an unchanged state produces a byte-identical file.
  5. Leaves everything untouched on any error and exits non-zero.
- **Committing**: the workflow commits only if `git status --porcelain` shows changes. The author is `github-actions[bot]` and the message is `chore(youtube-sync): <summary>`. It pushes with `git pull --rebase` and retries up to 3 times.
- **Why not `npm ci` + tsx**: installing packages adds 30–60 seconds to 288 runs a day for no benefit. The parser is already dependency-free.
- **Alternative considered**: a Cloudflare Worker cron that commits through the GitHub API. Rejected: it needs a GitHub token in Cloudflare and code that Actions gives us for free.

### Shorts detection
- The parser reads each entry's `<link rel="alternate" href>` and treats paths starting with `/shorts/` as Shorts.
- It moves from `worker/feed.ts` to `src/lib/youtube/feed.ts` (only erasable TypeScript syntax, so Node can run it directly) and gains `parseVideos()`, which returns every entry with an `isShort` flag. `parseLatestVideo()` is kept as "newest non-Short".

### Snapshot format
`src/data/youtube.json`:
```json
{ "version": 1,
  "channelId": "UC-MLQMe0PJR6v2d14VVb5fg",
  "latest": "QUrpZBWwGpE",
  "videos": { "QUrpZBWwGpE": { "title": "…", "published": "2026-11-23T00:25:07Z", "thumbSha256": "…" } } }
```
- `videos` holds every video the site shows. In this change that's only the latest one. Later changes add post and playlist videos to the same map, so thumbnails have one owner.
- `thumbSha256` lets the script notice when a thumbnail was replaced on YouTube.

### Thumbnails
- **Source**: downloaded from `i.ytimg.com/vi/<id>/mqdefault.jpg`, which is true 16:9 (the existing choice).
- **Checks**: a new video's thumbnail must download successfully before the snapshot names it. Existing thumbnails are re-fetched once an hour (in runs at minutes 2–6) and replaced if their hash changed. Unreferenced files are deleted.
- **Caching**: `public/_headers` gives `/yt/*` `Cache-Control: public, max-age=3600`, so a replaced thumbnail reaches visitors within the hour.
- **Why commit images**: each is about 10 KB, only shown videos are kept, and it makes builds offline and deterministic.

### Build reads the snapshot
- `src/lib/latest-video.ts` imports `src/data/youtube.json` and returns the `latest` video or null. It does no network I/O.
- `LatestVideoTV.astro` renders the build-time result only: the `data-lv` markers and fallback toggling for the Worker are removed. The click-to-play facade script stays.
- The fallback ("Watch on YouTube") renders when `latest` is null.

### Static-only deploy
- `wrangler.jsonc` keeps `assets` (directory, `not_found_handling: "404-page"`) and drops `main` and `run_worker_first`. Without a `main` entry, Cloudflare serves assets only, with no Worker invocations.
- When `/api/*` arrives later, `main` comes back with `run_worker_first: ["/api/*"]` only.

### Staying active
- GitHub disables scheduled workflows in public repositories after 60 days without repository activity. Bot commits count as activity, but a quiet channel produces none.
- A monthly step calls the GitHub API to re-enable the workflow (`PUT /repos/{owner}/{repo}/actions/workflows/youtube-sync.yml/enable`, which needs `actions: write`).
- If task 1.2 shows that this doesn't reset the inactivity timer, the fallback is a monthly empty bot commit. That triggers one harmless redeploy.

## Risks / Trade-offs

- **[GitHub's cron is best-effort; runs can be late or skipped at peak times]** → 5-minute polling absorbs single misses, and the off-hour minutes avoid the worst congestion. The spec promises "typically 10–25, normally within 60 minutes". A manual run is always available.
- **[Bot commits clutter history]** → Commits only happen on real change (a few a week), with a consistent `chore(youtube-sync)` prefix that's easy to filter (`git log --invert-grep --grep=youtube-sync`).
- **[Race with the owner's pushes]** → Rebase before push, retry up to 3 times, never force-push.
- **[The Shorts signal is not a documented API]** → Covered by fixture tests. If it disappears, Shorts may show on the TV, which degrades to the old behaviour without breaking anything.
- **[A Cloudflare build doesn't start for a push made with `GITHUB_TOKEN`]** → Task 1.1 checks this first. If it fails, the workflow uses a deploy hook URL (a GitHub secret) after pushing.

## Migration Plan

1. Land the parser move, the snapshot reader and a first snapshot (run the script locally once and commit the result) while the Worker still exists. Verify the build renders from the snapshot.
2. Add the workflow and check a manual run end to end: no-op run, then a forced change.
3. Remove the Worker from `wrangler.jsonc` and delete its code and tests, then deploy. Verify that `/` and `/yt/<id>.jpg` are served with no Worker invocations in Cloudflare metrics.
4. **Rollback**: revert the removal commit. The Worker version comes back on the next deploy, and the snapshot files are harmless to keep.
