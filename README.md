# baawastaken.com

The home page of **BaaWasTaken**: a cozy pixel-art room with a shelf of links to every channel (YouTube, Twitch, Kick, Discord, Instagram, TikTok, Ko-fi), a TV showing the newest YouTube upload, and a "Say hi" card.

It is a static [Astro](https://astro.build) site served from [Cloudflare Workers](https://developers.cloudflare.com/workers/static-assets/). A tiny Worker adds the latest video to the page and serves its thumbnail. Everything else is plain files.

## Run it

You need **Node 24** (`.nvmrc`; Astro 7 needs at least 22.23.4).

```sh
npm install
npm run dev          # http://localhost:4321, with hot reload
```

`npm run dev` shows the video that was current when the page loaded. To run the real thing, Worker included, build first and serve it with Wrangler:

```sh
npm run build
npx wrangler dev     # http://localhost:8787
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server |
| `npm run build` | Builds the site into `dist/` |
| `npm run preview` | Serves `dist/` without the Worker |
| `npm run check` | Type-checks the site and the Worker |
| `npm test` | Unit tests (Node, plus the Workers runtime for the Worker) |
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

## How the latest video gets onto the page

1. When the site is built, it reads the channel's public RSS feed once and bakes the newest video into the HTML. If YouTube cannot be reached, the build still succeeds and the TV shows a "Watch on YouTube" link instead.
2. When someone loads the page, the Worker (`worker/index.ts`) reads the feed again, remembers the answer for 30 minutes, and swaps the current video into the page. A new upload shows up within about half an hour, with no deploy.
3. If YouTube is slow or down, visitors get the page as it was built (or the last video the Worker saw). A failure is remembered for a minute so nobody waits for it.
4. The thumbnail comes from `/yt-thumb/<id>`, which the Worker fetches from YouTube and serves from our own domain, so visitors' browsers never contact YouTube until they press play. The player only loads after a click, from `youtube-nocookie.com`.

**To stop the live update**, remove `"/"` from `run_worker_first` in `wrangler.jsonc`. The page is then served exactly as built, and its video changes only when you deploy. Keep `"/yt-thumb/*"`: the thumbnail still needs the Worker.

The Worker may only export its handler. Settings and helpers live in `worker/config.ts`; a test checks this, because any other export stops the Workers runtime from starting.

## Deploying

Cloudflare builds and deploys every push to `main` (Workers Builds: build `npm run build`, deploy `npx wrangler deploy`). A failed build leaves the previous version live.

**To roll back**, open Cloudflare → Workers & Pages → `baawastaken` → Deployments, pick an earlier version and roll back to it. Or revert the commit on `main`.

The domain setup (custom domains, the `www` redirect, HTTPS) is done once in the Cloudflare dashboard and is not in this repo.

## Project layout

```
src/pages/        index (the home page), 404, og (the share image's source)
src/components/   Header, Shelf, LinkTile, LatestVideoTV, ContactCard, Room, ...
src/sprites/      pixel art as text
src/data/         links and site text
src/styles/       tokens.css, base.css, motion.css
worker/           the edge Worker (index.ts, feed.ts, config.ts)
scripts/          avatar and share-image generators
public/           favicons, share image, _headers, robots.txt
tests/            unit tests; tests/worker runs in the Workers runtime; tests/e2e drives a real browser
openspec/         the plan this site was built from
```

## Motion and accessibility

Everything that moves (twinkling lights, steam, the pendulum, the cat's tail, a drifting cloud) uses stepped animation so it moves in whole pixels, and all of it stops when a visitor's device asks for reduced motion. Decorations are hidden from screen readers; every control has a visible focus outline; the page is checked with axe at phone, tablet and desktop widths.
