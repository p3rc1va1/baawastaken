# Design

## Context

- **Builds on `static-snapshot-hosting`**: a GitHub Actions sync runs about every 5 minutes, writes `src/data/youtube.json` and `public/yt/<id>.jpg`, and commits only on change. Commits trigger the normal Cloudflare deploy. The site is fully static, and builds never contact YouTube.
- **Builds on `add-seo-and-notes`**: that change brings the data-driven `SiteNav`, the per-page `Layout` props (title, description, canonical, JSON-LD), the sitemap and the shared `TvPlayer` click-to-play component.
- **YouTube data**: the RSS feed only holds the latest 15 uploads, so it can't list a whole series. The Data API's `playlistItems.list` can, at 1 quota unit per 50 items.
- **Visual reference**: the canvas artboard Final-Game.

## Goals / Non-Goals

**Goals:**
- Game pages are plain static files, updated by the existing sync, with no new moving parts in hosting.
- The user manages everything from YouTube (playlists) and Markdown (intros).

**Non-Goals:**
- Pages for single episodes, or Shorts.
- Video length, view counts or comments.
- Automatic sorting of uploads into games by title.

## Decisions

### Games are a content collection
- **Where**: `src/content/games/<slug>.md`.
- **Frontmatter**: `name`, `playlistId` (validated against the playlist ID pattern) and an optional `order` for the tabs.
- **Body**: the intro.
- **Why**: intros stay editable Markdown next to the posts. The sync script reads the same files with its small frontmatter reader, so the game list lives in one place.

### Playlists are fetched by the sync, not the build
On every run, `scripts/youtube-sync.ts` reads each game's playlist:
- **Request**: `playlistItems.list?part=snippet,contentDetails,status&maxResults=50`, paging through every page.
- **Skipped items**: anything without `contentDetails.videoPublishedAt` or not `public`.
- **Stored**: under `playlists[<playlistId>]` in the snapshot as an ordered list of video IDs, with each video's title and publish date in the shared `videos` map, and thumbnails handled like every other shown video.
- **API key**: read from the `YOUTUBE_API_KEY` secret. It's passed only as the `key` query parameter, never echoed, and error messages are scrubbed of it.
- **On failure**: any failed request makes the whole run change nothing, the same rule as for the feed, and the log names the game. The next run retries 5 minutes later.
- **Why at every run**: about 2 units per game per run, roughly 600 a day per game, is far under the 10,000 daily quota. New episodes show up as fast as new uploads do.
- **Alternatives considered**:
  - Fetching at build time: rejected. It would put the key into Cloudflare and let a YouTube outage fail deploys.
  - Hourly playlist checks: unnecessary given the quota.

### Pages and components
- **Routes**:
  - `/videos/[slug]` from `getStaticPaths` over the collection.
  - `/videos` is the overview, ordered by newest episode date.
- **Data**: playlist data comes from the snapshot. A game with no snapshot entry yet renders the "coming soon" state.
- **Part numbers**: position among public items, plus one.
- **Components**:
  - `ChannelTabs` (one tab per game plus "All videos", current one marked)
  - `GameTv` (`TvPlayer` with the "Now showing: Part N" label)
  - `EpisodeGuide` (an ordered list of rows, newest highlighted in jade, thumbnails hidden under 640px)
- **Links**:
  - "Watch from Part 1" goes to `https://www.youtube.com/watch?v=<first>&list=<playlist>`.
  - Guide rows go to each video with `&list=`.
  - "Playlist on YouTube" goes to `https://www.youtube.com/playlist?list=<playlist>`.
- **Thumbnails**: `/yt/<id>.jpg` only.

### Structured data
- Each game page gets a `CollectionPage` whose `mainEntity` is a `VideoObject` for the featured episode:
  - `name`, `description` (the intro's first sentence plus the part number)
  - `thumbnailUrl` (absolute `/yt/` URL), `uploadDate`
  - `embedUrl` (the youtube-nocookie embed) and `contentUrl` (the watch URL)
- The overview is a `CollectionPage`.
- Titles follow the pattern `Replaced playthrough, every part in order | BaaWasTaken`.

### Menu
- Add `{ label: 'Videos', href: '/videos' }` between Home and Blog in `site.ts`. Every page picks it up through `SiteNav`.

## Risks / Trade-offs

- **[A missing or revoked API key stops all sync updates, the TV included]** → The run fails visibly every 5 minutes, and GitHub emails the owner about failed scheduled runs. Restoring the key fixes it on the next run. Accepted: partial snapshots would be harder to reason about.
- **[API key misuse]** → Restrict the key to the YouTube Data API v3 in Google Cloud. It exists only as a GitHub secret, and secrets aren't available to workflows triggered from forks.
- **[Part numbers come from playlist position]** → If the user removes a video, later parts renumber. Titles on YouTube still say "Part N", and the guide shows both.
- **[Snapshot grows with every episode]** → Each episode adds one entry and one thumbnail of about 10 KB, so a 50-part series is about 0.5 MB. Acceptable.

## Migration Plan

1. The user creates the playlists, the API key and the GitHub secret (tasks under 1).
2. Merge and push the sync change first, then start it by hand to capture the playlists. Merge the pages after.
3. **Rollback**: revert the merge. Unused playlist entries are dropped from the snapshot by the next sync.
