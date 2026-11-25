# Tasks

Apply and archive this change before `add-seo-and-notes` and `add-game-pages`. Tasks marked **[you]** need the site owner in GitHub or Cloudflare.

## 1. Checks before building

- [ ] 1.1 Check that a push made by the Actions `GITHUB_TOKEN` starts a Cloudflare Git build: use a throwaway workflow on a test branch with branch builds turned on, or a dry run on `main`. Record the result in design.md. Verify that a build appears in the Cloudflare deploy log for the bot's commit, or that the deploy hook fallback is chosen and written up.
- [x] 1.2 Check whether re-enabling a workflow through the API resets GitHub's 60-day inactivity timer (GitHub docs and community reports). Record the chosen keep-alive method in design.md. Verify that the decision and its source are written down.

## 2. Parser and snapshot

- [x] 2.1 Move `worker/feed.ts` to `src/lib/youtube/feed.ts` using only erasable TypeScript syntax, add `parseVideos()` with an `isShort` flag (alternate link path starting with `/shorts/`), and keep `parseLatestVideo()` as the newest non-Short. Verify with existing feed tests updated plus new fixtures (Short newest, all Shorts, no Shorts), and that `node --check` style execution works through `node src/lib/youtube/feed.ts` with Node 24.
- [x] 2.2 Define the snapshot format and a reader in `src/lib/youtube/snapshot.ts` (validation, deterministic serialisation with sorted keys and no timestamps). Verify with unit tests that the same input serialises byte-for-byte the same and that invalid files are rejected with a clear message.
- [x] 2.3 Write `scripts/youtube-sync.ts`: fetch the feed, pick the latest long-form upload, download a missing thumbnail (the snapshot only updates after it succeeds), recheck hashes hourly, delete unreferenced thumbnails, write the snapshot, and exit non-zero on any error without touching files. Verify with unit tests over a mocked fetch: new video, no change (no file writes), feed error, thumbnail error, changed thumbnail hash in an hourly run, and an unreferenced thumbnail removed.
- [ ] 2.4 Run the script locally once and commit the first `src/data/youtube.json` and `public/yt/<id>.jpg`. Verify that running it again right after leaves `git status` clean.

## 3. Build from the snapshot

- [x] 3.1 Make `src/lib/latest-video.ts` read the snapshot with no network access. Verify with unit tests for a snapshot with a video, a snapshot with `latest: null`, and that `fetch` is never called (spy).
- [x] 3.2 Make `LatestVideoTV.astro` build-time only: drop the `data-lv` markers and the Worker contract comment, and point the thumbnail at `/yt/<id>.jpg`. Keep the click-to-play facade. Verify that `tests/e2e/video.e2e.ts` is updated and passes for both the video and the fallback states, and that no request goes to a YouTube host before play.
- [x] 3.3 Add `/yt/*` caching (`max-age=3600`) to `public/_headers` and update the header comment. Verify with an e2e check of the response headers.
- [x] 3.4 Verify that the build is offline: `npm run build` succeeds with networking disabled (for example `unshare -n` or by blocking DNS), and the TV shows the snapshot video.

## 4. The workflow

- [x] 4.1 Add `.github/workflows/youtube-sync.yml`: cron `2-59/5 * * * *`, `workflow_dispatch`, concurrency group, `contents: write` and `actions: write`, shallow checkout, Node 24, run the script, commit only on change as `github-actions[bot]` with a `chore(youtube-sync): …` message, rebase and push with 3 retries. Verify with `actionlint`, which passes.
- [x] 4.2 Add the monthly keep-alive chosen in 1.2. Verify with `actionlint` and with a dry run that logs the call it would make.
- [ ] 4.3 **[you]** Start the workflow by hand twice on `main`. Verify that the first run commits only if something changed, the second run makes no commit, and the log shows the latest video ID.
- [x] 4.4 Document the sync in the README: what it does, how often, how to start it by hand, how to read its commits, and what to do if GitHub disables it. Verify that the README steps match the workflow file.

## 5. Remove the Worker

- [x] 5.1 Drop `main` and `run_worker_first` from `wrangler.jsonc`, and delete `worker/index.ts`, `worker/config.ts`, `tests/worker/**`, `tests/e2e/worker.e2e.ts` and the Worker Vitest config. Verify that `npx wrangler deploy --dry-run` reports an assets-only deploy, `npm test` passes, and nothing imports from `worker/` (`grep`).
- [x] 5.2 Update `tests/e2e/delivery.e2e.ts` to serve `dist/` as static files and check that the homepage and a thumbnail come back with status 200 and the expected headers. Verify that the e2e suite passes.
- [ ] 5.3 **[you]** Deploy. Verify that `curl -I https://baawastaken.com/` and `/yt/<id>.jpg` return 200, `/yt-thumb/<id>` returns 404, and the Cloudflare Worker metrics show no invocations after the deploy.

## 6. End-to-end check

- [ ] 6.1 **[you]** Upload (or schedule) a long-form video, then a Short. Verify that the TV shows the long-form video within about 25 minutes through a bot commit and deploy, and that the Short never appears.
