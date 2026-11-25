# Tasks

Visual source of truth: https://claude.ai/artifact/TmAEXp3E1SgQubod7UByYc#artboard-Final-Game. Start after `static-snapshot-hosting` and `add-seo-and-notes` are applied and archived. Tasks marked **[you]** need the site owner in a browser or account.

## 1. Accounts and setup

- [ ] 1.1 **[you]** Create one public YouTube playlist per game (Replaced, Deadlock) with long-form episodes in order. Verify that each playlist URL opens logged out.
- [ ] 1.2 **[you]** Create a YouTube Data API v3 key in Google Cloud, restricted to that API, and add it as the `YOUTUBE_API_KEY` GitHub Actions secret. Verify that it shows under the repository's Actions secrets and that `git grep` doesn't find it.

## 2. Game data and sync

- [ ] 2.1 Define the `games` content collection (name, playlistId, optional order; body = intro) and add `replaced.md` and `deadlock.md` with draft intros. Verify with unit tests that a bad playlist ID or a missing name fails the build with the file name. **[you]** Rewrite the intros.
- [ ] 2.2 Extend `scripts/youtube-sync.ts` to read the game files and fetch every playlist: paging, skipping private and deleted videos, storing order under `playlists[...]`, thumbnails through the existing path, the key scrubbed from logs and errors, and any failure changing nothing. Verify with unit tests over recorded API fixtures: two pages of results, a private item, a deleted item, an empty playlist, HTTP 403 (no files changed, the log names the game and doesn't contain the key), a missing key, and an unchanged state (no writes).
- [ ] 2.3 Pass `YOUTUBE_API_KEY` to the sync step in `.github/workflows/youtube-sync.yml`. Verify that `actionlint` passes and that a manual run on `main` commits the playlists. **[you]** Start the run.

## 3. Pages

- [ ] 3.1 Build `ChannelTabs`, `GameTv` (on `TvPlayer`, with "Now showing: Part N") and `EpisodeGuide` (oldest first, newest highlighted in jade, `/yt/` thumbnails hidden under 640px), matching Final-Game, with brand colours only and reduced motion respected. Verify with component unit tests and Playwright screenshots at 375 and 1280px.
- [ ] 3.2 Add `/videos/[slug]` from the snapshot: `h1` name, intro, the two buttons with correct `list=` links, the TV, the guide, and the "coming soon" state for an empty or not-yet-synced playlist. Verify with build tests against a fixture snapshot (links, order, highlight, coming soon), Playwright tests for play-on-click and the no-JavaScript link, and axe.
- [ ] 3.3 Add `/videos`: the overview ordered by newest episode date, with thumbnail, episode count and date per game. Verify with a build test of the order and that the links resolve.
- [ ] 3.4 Add titles, descriptions, canonicals and JSON-LD (`CollectionPage` + `VideoObject`), and make sure the sitemap includes the game pages. Verify with unit tests that the JSON-LD parses, has the required VideoObject fields and is unique per page, and that the sitemap test lists `/videos` and each game. Check one page with the Schema.org validator.
- [ ] 3.5 Make sure the build stays offline and free of the key. Verify that `npm run build` passes with networking disabled, and that a build test greps `dist/` for `i.ytimg.com` and `googleapis.com` and finds nothing.

## 4. Menu

- [ ] 4.1 Add Videos to the `nav` data between Home and Blog. Verify with a Playwright test that the menu on the homepage, blog and videos pages shows Home, Videos, Blog with the right item marked current, and that the homepage header has no overlaps at 375, 768, 1280 and 1920px.

## 5. Docs and launch

- [ ] 5.1 Document in the README how to add a game (playlist plus Markdown file), how quickly pages update, and how to rotate the API key. Verify by following "add a game" with a fixture snapshot, which produces a new page locally.
- [ ] 5.2 Run the full check: `npm run check`, `npm test` and `npm run test:e2e` pass, and Lighthouse SEO and Accessibility score 100 on `/videos/replaced` in the preview.
- [ ] 5.3 **[you]** After the deploy, add a video to a playlist. Verify that it appears on the game page within about 25 minutes through a sync commit, and that Search Console picks up `/videos/replaced` from the sitemap.
