# Proposal

## Why

Most of the channel is game series (a Replaced playthrough, Deadlock videos). A copy of a single video on our site never outranks YouTube itself. A page per game that lists every part in order, with a short written intro, gives searchers something YouTube doesn't, and it can rank for searches like "Replaced playthrough". The pages should keep themselves up to date, so new uploads appear without any manual work.

## What Changes

- **Game pages in the "TV guide" design**:
  - One page per game at `/videos/<game>`.
  - A large TV shows the newest episode, with click-to-play.
  - Next to it: the game's name, a short intro written once by the user, a jade "Watch from Part 1" button and a cream "Playlist on YouTube" button.
  - Below: an episode guide listing every part oldest first, with the newest highlighted.
  - Channel tabs switch between games.
- **A videos overview** at `/videos`, listing every game.
- **YouTube playlists as the source of truth**:
  - The user keeps one playlist per game. Playlist order is episode order.
  - The existing YouTube sync reads the playlists through the YouTube Data API on every run, about every 5 minutes, and commits changes to the snapshot.
  - The API key is a GitHub Actions secret. Builds never contact YouTube.
- **Videos in the menu**: the site menu gains a Videos entry, on the homepage and on every page.
- **Search basics for game pages**: their own titles, descriptions, canonical URLs and structured data, and a place in the sitemap.

Shorts are out of scope. Only videos the user puts in a game's playlist are shown. A separate daily rebuild isn't needed: the sync's commits trigger deploys whenever a playlist changes.

**Depends on** `static-snapshot-hosting` (the sync and snapshot) and `add-seo-and-notes` (the site menu, per-page metadata, sitemap and `TvPlayer`). Archive both first, in that order.

## Capabilities

### New Capabilities
- `videos`: per-game pages and the videos overview, built from the playlist data in the YouTube snapshot: episode guide, featured newest episode, intro text, channel tabs, structured data, and behaviour when data is missing.

### Modified Capabilities
- `homepage`: the site menu gains a Videos entry.
- `youtube-sync`: the sync also captures every game's playlist, and the YouTube Data API key is kept secret.

## Impact

- **Code**:
  - A new `games` content collection in `src/content/games/` (name, playlist ID, intro).
  - Playlist fetching in `scripts/youtube-sync.ts`.
  - New pages in `src/pages/videos/**`.
  - TV guide components on top of `TvPlayer`.
  - The menu data in `src/data/site.ts`.
- **Hosting**: unchanged. Pages are static, with no deploy hook, no cron Worker and no Cloudflare secrets.
- **External**: YouTube Data API v3. It's free: about 2 quota units per game per run, roughly 1,200 a day for two games, against a 10,000 limit.
- **The user**:
  - Create one playlist per game (Replaced, Deadlock) in episode order.
  - Create the API key and add it as the `YOUTUBE_API_KEY` GitHub Actions secret.
  - Write a two- or three-sentence intro per game.
- **Design reference**: the canvas artboard Final-Game.
