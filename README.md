# baawastaken.com

The home page of **BaaWasTaken**: a cozy pixel-art room with a shelf of links to every channel (YouTube, Twitch, Kick, Discord, Instagram, TikTok, Ko-fi), a TV showing the newest YouTube upload, and a "Say hi" card.

It is a static [Astro](https://astro.build) site served from [Cloudflare](https://developers.cloudflare.com/workers/static-assets/) as plain static files: no code runs when someone visits. A scheduled GitHub Actions job keeps the latest YouTube video up to date (see below).

## Run it

You need **Node 24** (`.nvmrc`; Astro 7 needs at least 22.23.4).

```sh
npm install
npm run dev          # http://localhost:4321, with hot reload
```

`npm run dev` shows the video in the committed snapshot (`src/data/youtube.json`). To serve the built site the way Cloudflare does (including `public/_headers`), build first and use Wrangler:

```sh
npm run build
npx wrangler dev     # http://localhost:8787
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server |
| `npm run build` | Builds the site into `dist/` |
| `npm run preview` | Serves `dist/` with Astro's preview server |
| `npm run sync` | Runs the YouTube sync once (same as the scheduled job) |
| `npm run check` | Type-checks the site, scripts and tests |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser tests against `wrangler dev` (builds first) |
| `npm run avatar` | Regenerates the avatar and favicons from `media/channel profile image.png` |
| `npm run og` | Builds the site and regenerates the share image `public/og.png` |

The first time you run the browser tests, install the browser: `npx playwright install chromium`.

## Change something

**A link or its wording.** Edit `src/data/socials.ts`. Each entry has the name, short description, URL, which shelf it sits on and which logo it uses. The order in the file is the order on the page.

**The contact emails, tagline, title or description.** Edit `src/data/site.ts`: `emails.fans` (hello@…) and `emails.business` are the two addresses on the "Say hi" card. These strings live only there; the card's wording is in `src/components/ContactCard.astro`.

**A logo or any other pixel art.** Sprites are text: each character is a pixel and the palette says which colour. They live in `src/sprites/` (`logos.ts`, `scene.ts`, `ui.ts`). One art pixel is drawn 4 screen pixels wide, so everything stays on one grid, and `npm test` fails if a sprite is malformed (ragged rows, a colour missing from the palette, and so on).

**Colours and spacing.** `src/styles/tokens.css`. Nothing else may contain a raw colour (a test enforces it).

**The font.** The whole page uses one typeface, Jersey 20 (`--font` in `tokens.css`). It has one weight, so headings differ by size and colour, and the sizes in `tokens.css` are bigger than you would use for a normal font. The wordmark and address sizes step down on narrow screens so they stay on one line; tests check this from 320px up.

After changing the share image's look (`src/pages/og.astro`), run `npm run og` and commit the new `public/og.png`.

## How the latest video gets onto the page (YouTube sync)

A GitHub Actions workflow, `.github/workflows/youtube-sync.yml`, runs `scripts/youtube-sync.ts` about every 5 minutes (cron `2-59/5 * * * *`; GitHub's scheduler is best-effort, so runs can be late):

1. It reads the channel's public RSS feed and picks the newest **long-form** upload. Shorts (links under `/shorts/`) are skipped.
2. It stores that video's thumbnail as `public/yt/<id>.jpg` and writes `src/data/youtube.json`. Once an hour it re-downloads the thumbnail to catch a replaced one, and it deletes thumbnails no longer used.
3. **Only if something changed**, it commits to `main` as `github-actions[bot]` with a `chore(youtube-sync): …` message. That push triggers the normal Cloudflare deploy, so a new video shows on the TV roughly 10–25 minutes after upload.
4. The site build reads only `src/data/youtube.json`. It never contacts YouTube, so a YouTube outage cannot fail or slow a deploy. If YouTube is down, the sync fails quietly and the last video stays up. If no video was ever captured, the TV shows a "Watch on YouTube" link.

Visitors' browsers never contact YouTube until they press play (the thumbnail is our own static file; the player loads from `youtube-nocookie.com` after a click).

**Start it by hand:** GitHub → Actions → `youtube-sync` → *Run workflow* on `main`. Or locally: `npm run sync`, then commit `src/data/youtube.json` and `public/yt/`. The log's first line shows the latest video ID.

**Read its commits:** they all start with `chore(youtube-sync)`. To hide them: `git log --invert-grep --grep='chore(youtube-sync)'`.

**If GitHub disables it:** GitHub turns scheduled workflows off after 60 days with no repository activity. The workflow guards against this: when the newest commit is more than 45 days old, a run adds one empty commit (`scripts/keepalive.sh`). If it was switched off anyway, open Actions → `youtube-sync` → *Enable workflow*, then run it once.

**Later, if you need code per request** (view counts, likes), add it under `/api/*` only: put `main` back in `wrangler.jsonc` with `run_worker_first: ["/api/*"]`. No page may depend on it to render.

## Deploying

Cloudflare builds and deploys every push to `main` (Workers Builds: build `npm run build`, deploy `npx wrangler deploy`), including the sync bot's commits. The deploy is static assets only. A failed build leaves the previous version live.

**To roll back**, open Cloudflare → Workers & Pages → `baawastaken` → Deployments, pick an earlier version and roll back to it. Or revert the commit on `main`.

The domain setup (custom domains, the `www` redirect, HTTPS) is done once in the Cloudflare dashboard and is not in this repo.

## Project layout

```
src/pages/        index (the home page), 404, og (the share image's source)
src/components/   Header, Shelf, LinkTile, LatestVideoTV, ContactCard, Room, ...
src/sprites/      pixel art as text
src/data/         links and site text
src/styles/       tokens.css, base.css, motion.css
src/lib/youtube/ feed parser and snapshot format (shared by the build and the sync)
scripts/          YouTube sync, keep-alive, avatar and share-image generators
.github/          the youtube-sync workflow
public/           favicons, share image, _headers, robots.txt, yt/ (synced thumbnails)
tests/            unit tests; tests/e2e drives a real browser
openspec/         the plan this site was built from
```

## Motion and accessibility

Everything that moves (twinkling lights, steam, the pendulum, the cat's tail, a drifting cloud) uses stepped animation so it moves in whole pixels, and all of it stops when a visitor's device asks for reduced motion. Decorations are hidden from screen readers; every control has a visible focus outline; the page is checked with axe at phone, tablet and desktop widths.
