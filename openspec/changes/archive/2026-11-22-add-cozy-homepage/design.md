# Design

## Context

The repository contains only the OpenSpec scaffolding and `media/channel profile image.png`. Its remote is `git@github.com:p3rc1va1/bahawastaken.git`. The domain `baawastaken.com` is registered at Cloudflare, so DNS is already on Cloudflare.

The visual target is fixed. It is the approved artboard "A v3 · The Shelf, one pixel grid", including the Bengal cat, on the design canvas: https://claude.ai/artifact/TmAEXp3E1SgQubod7UByYc#artboard-Shelf-v3. That mockup is the source for:
- every colour, sprite and position
- the copy, and the component structure

Brand palette, taken from the YouTube avatar and banner:

| Role | Colours |
|---|---|
| Slate wall | `#323D39` (dark shades `#2A3330`, `#222A27`, `#1C2321`) |
| Cream | `#F9EEBF` |
| Peach | `#EEC399` |
| Jade | `#3A9470` (light `#5DB88E`, dark `#2B6E53`) |
| Wood | `#A8714C`, `#8B5A3C`, `#6B3A2E` |
| Floor | `#4A2C24` |
| Outlines | black |

Motivation and scope are in proposal.md. Behaviour contracts are in `specs/homepage`, `specs/latest-video` and `specs/site-hosting`.

The tool versions checked on 2026-11-22 were Astro 7.4.13, Wrangler 4.166 and the Fontsource packages 5.3. Astro 7.4.x requires Node ≥ 22.23.4, so the project targets Node 24 LTS (the development machine's Node 22.23.1 is too old).

## Goals / Non-Goals

**Goals:**
- Reproduce the v3 artboard pixel for pixel at 1280px wide. Then adapt it to tablet and phone sizes without breaking the pixel grid.
- Treat the pixel-art rules as engineering constraints that code enforces, not as conventions people must remember:
  - one art pixel equals 4 CSS px
  - integer scaling only
  - light from the top-left
  - hue-shifted ramps
- Zero JavaScript except two small progressive-enhancement scripts, one for copying the email and one for playing the video. The latest video is filled in at the edge, not in the browser.
- A fast page: under 150 KB transferred on first load excluding the video thumbnail, and a Lighthouse score of 95 or more in every category.
- A site that costs nothing to run and needs no upkeep: no scheduled jobs, bot commits or stored API tokens.

**Non-Goals:**
- No analytics, CMS, blog, multiple pages, internationalisation or dark/light theming. The scene is always the night room.
- No live "streaming now" status from Twitch or Kick. That would need runtime API calls and secrets, so it is a candidate for a later change.
- No reuse of the stock sprites from the YouTube banner. All art is original.

## Decisions

### D1. Astro 7 in static output mode, with no adapter
Astro renders components to plain HTML at build time and ships no JavaScript by default. It handles the build-time data, asset hashing and image optimisation we need. Pages are pre-rendered, so no Cloudflare adapter is needed: `dist/` is uploaded as-is.

*Alternatives considered:*
- **Plain HTML/CSS:** this rules out components and data-driven sprites, and the hundreds of sprite rects become unmanageable.
- **Vite + vanilla:** this would mean rebuilding Astro's templating ourselves.
- **Next.js or SvelteKit:** heavier, and built around runtime features we don't use.

### D2. Sprites are data, rendered by one `<Sprite>` component
Each sprite is a TypeScript module holding:
- a palette map, from a single character to a hex colour
- one or more ASCII frames (rows of characters, with `.` meaning transparent)

`<Sprite name="cat" />` renders inline SVG at build time:
- `viewBox` is the art size, and the CSS size is the art size × `--px`
- horizontal runs of the same colour are merged into one `<rect>` each
- `shape-rendering: crispEdges` keeps edges hard
- `aria-hidden="true"` unless a label is passed

Animated sprites have several frames. They render as stacked layers, and a CSS `steps(1)` keyframe swaps between them. This is how the pendulum, cat tail, plant leaf and anything else that flips frames will work.

A Vitest suite checks every sprite:
- all rows in a frame have the same width
- every character has a palette entry
- each frame stays within its declared size

The suite fails the build on any violation. This is how the "one grid, no mixed resolution" rule is enforced in code.

*Alternatives considered:*
- **Aseprite PNG sprite sheets:** these are the natural tool for a pixel-art team. The component also accepts a PNG source, rendered as `<img>` with `image-rendering: pixelated` at integer scale, so the team can swap art in later. The launch art comes straight from the mockup, which already exists as rect data.
- **Hand-written SVG in each component:** this is what the mockup does, and it is exactly how v2 ended up with mismatched logo grids.

### D3. Layout: a scene shell, a content layer and a decoration layer
The page is a CSS-grid content layer containing the header, the shelves with their tiles, the TV, the contact card and the footer, all as real semantic HTML. Decorations sit in absolutely positioned slots anchored to those content blocks rather than to the viewport, so they move with their block when the layout reflows:
- the clock is anchored to the header (desktop only)
- the plant, mug and books sit in the fourth slot of the lower shelf
- the cat and succulent are anchored to the TV
- the window is anchored to the contact row

A single custom property, `--px: 4px`, drives every border, offset, padding step and sprite size. Spacing values are multiples of `--px`.

**Breakpoints:**

| Width | Layout |
|---|---|
| ≥ 1180px | Desktop, exactly as the mockup. Shelves have 4 tiles per row, the TV sits to the right of them, and the contact card and window sit below. |
| 768–1179px | Tablet. One centred column 704px wide. The shelves keep 4 tiles each. The TV and the window sit side by side beneath them, and the contact card spans the full width below. (A card squeezed beside the window would leave the text only ~250px and crowd the stamp.) The wordmark drops to 88px. The clock and dust motes are hidden. |
| < 768px | Phone. The header stacks and centres, and the wordmark is 60px (56px and 52px on the narrowest screens), always on one line. Each shelf shows 2 tiles per row with a plank and brackets under every row; the plant, mug and books take the fourth cell on the lower shelf. The TV and contact card are full width. The window is hidden, and the floor is shortened. Below 360px the tile text steps down one size so it still fits. |

Sprites never scale by fractions. On phones they stay at 4px per art pixel, and a sprite that doesn't fit is hidden rather than shrunk.

### D4. Motion: CSS only, stepped, opt-out by preference
All ambient motion uses CSS `@keyframes` with `steps()` timing, so it moves in whole art pixels and looks like animation frames rather than smooth tweening. Only `transform` and `opacity` are animated, which keeps every animation on the compositor and avoids layout shift. Animation delays are staggered so nothing pulses in sync.

A single `@media (prefers-reduced-motion: reduce)` block does three things:
- turns every animation off
- shows the first frame of each multi-frame sprite
- hides transient effects: steam, "z"s, the shooting star, the scanline and dust motes

Tile hover gets a 4px lift and a one-time logo hop. These respond to the visitor's own action and are also disabled when reduced motion is requested.

### D5. One typeface, self-hosted through Fontsource
The whole page uses a single family, Jersey 20: the wordmark, headings, tile names, body text and the email addresses. This was the owner's call, after the mixed faces (a pixel face for display, a plain sans for text) made the page feel less like one pixel world.

Jersey 20 was chosen from three options for its crisp lowercase and an unmistakable `@`. Silkscreen (capitals only, filled-in W) and Pixelify Sans Bold (clogged letters, a tiny `@`) were tried first and dropped.

It has a single weight, so:
- hierarchy comes from size and colour; `font-synthesis: none` stops the browser faking bold, which smudges pixel letters
- the type scale is larger than a normal sans, because Jersey is small for its size: wordmark 112px (88px on tablet, 60px on phones, 56px below 375px, 52px below 360px), headings 44/32/26px, tagline 28px, body 22px, small 20px, fine 18px (14px for tile descriptions below 360px), addresses 24px (20px on phones, 18px below 360px)
- line spacing is tighter (about 1.25), since Jersey's own line box is tall

Only the Latin subset is imported and the one file is preloaded, with `font-display: swap` and a monospace fallback. Self-hosting also meets the spec requirement that no third-party requests happen on first load, and the page now ships one 19 KB font file.

### D6. Latest video: an edge Worker reads RSS, caches it, and rewrites the HTML
The latest video is filled in by a small Worker (`worker/index.ts`) that runs in front of the static assets, but only for two routes.

**Route `/` (the homepage HTML):**
1. Fetch the pre-built `index.html` from the `ASSETS` binding.
2. Get the latest video from `https://www.youtube.com/feeds/videos.xml?channel_id=UC-MLQMe0PJR6v2d14VVb5fg`:
   - the fetch has a 3-second timeout and `cf: { cacheTtl: 1800, cacheEverything: true }`, so Cloudflare caches the feed for 30 minutes at each edge location
   - the parsed result `{ id, title, published }` is also stored in the Cache API under an internal key with `max-age=1800`, so parsing happens at most once every 30 minutes
3. Parse the feed with a small, dependency-free parser (`worker/feed.ts`) that pulls `yt:videoId`, `title` and `published` from each `<entry>` and picks the newest by `published`. Titles are XML-unescaped, and HTMLRewriter escapes them again on output. Avoiding a full XML library keeps CPU time well under the free plan's 10 ms limit.
4. Use `HTMLRewriter` to fill the TV's marked elements (`[data-lv="link"]`, `[data-lv="thumb"]`, `[data-lv="title"]`, `[data-lv="date"]`, `[data-lv="player"]`). It sets the link `href`, the image `src` (`/yt-thumb/<id>`), the text, the `datetime` and the facade's `data-video-id`. If the page was built with the "Watch on YouTube" fallback, a marked fallback block is swapped for the video markup.
5. If any step fails or times out, return the unmodified asset response with status 200 (the fallback rule in `specs/latest-video`).

**Route `/yt-thumb/<id>`:**
- `<id>` must match `^[A-Za-z0-9_-]{11}$`. Anything else gets a 404 without any upstream request.
- It fetches `https://i.ytimg.com/vi/<id>/mqdefault.jpg` with `cf.cacheTtl: 86400` and returns it with `Cache-Control: public, max-age=86400`. `mqdefault` is a true 16:9 image (320×180); `hqdefault` is 4:3 with black bars baked in, which looks wrong inside the TV.
- Only that one host and path pattern is ever requested, so the route cannot be used as a general proxy.

**Build-time snapshot:** during `astro build`, `src/lib/latest-video.ts` reuses the same `worker/feed.ts` parser to fetch the feed once (5-second timeout). The result is baked into the static HTML so the page is complete even if the Worker step fails. If that fetch fails, the static HTML holds the "Watch on YouTube" fallback and the build still succeeds. The snapshot's thumbnail also uses `/yt-thumb/<id>`.

**The TV control:**
- It is an `<a href="https://www.youtube.com/watch?v=<id>">` around the thumbnail, so it works without JavaScript.
- A small inline script turns it into a facade. On click it replaces the thumbnail with a `youtube-nocookie.com/embed/<id>?autoplay=1` iframe whose `title` is the video title.
- The script reads `data-video-id` at click time, so it automatically uses the ID the Worker injected.

*Alternatives considered:*
- **A daily GitHub Action that commits a JSON snapshot:** fully static, but up to 24 hours of lag and bot commits in your history.
- **Fetching only at build time plus a scheduled rebuild:** up to 24 hours of lag, and a Cloudflare API token stored in GitHub.
- **Fetching in the browser:** the YouTube feed has no CORS headers, so the browser can't read it. It would also need client JavaScript and a third-party request.
- **The YouTube Data API:** needs an API key and a quota, and offers nothing extra for this use.
- **Skipping Shorts:** the feed mixes Shorts and long videos (10 of the 15 newest entries were Shorts when checked). "Latest video" means the newest upload of any kind, so Shorts are shown. Filtering them out would need an extra request per entry, so it is left as a possible later change.

### D7. Hosting: Workers static assets with a scoped Worker, deployed by Workers Builds
`wrangler.jsonc` configures:
- `name: "baawastaken"`
- `main: "worker/index.ts"`
- `assets: { directory: "./dist", binding: "ASSETS", not_found_handling: "404-page", run_worker_first: ["/", "/yt-thumb/*"] }`

Every other path (CSS, fonts, `/_astro/*`, the 404 page, `robots.txt`) is served directly by the asset layer without running the Worker. Those requests are free and unlimited. Only homepage views and thumbnail fetches count toward the free plan's 100k Worker requests per day.

Both `baawastaken.com` and `www.baawastaken.com` are attached as Custom Domains.

The Cloudflare zone setup:
- **www redirect:** a Single Redirect Rule (`www.baawastaken.com/*` → `https://baawastaken.com/${1}`, 301), handled before the Worker runs.
- **HTTPS:** "Always Use HTTPS" is on, and SSL is set to Full (strict).

**Deploys:** Workers Builds is connected to the existing GitHub repo `p3rc1va1/bahawastaken`. A push to `main` runs `npm ci && npm run build`, then `npx wrangler deploy`. A failed build doesn't deploy, so the previous version stays live. No GitHub Actions or Cloudflare tokens in GitHub are needed.

**Caching:** `public/_headers` gives `/_astro/*` and `/fonts/*` `Cache-Control: public, max-age=31536000, immutable`. The Worker sets `Cache-Control: public, max-age=0, must-revalidate` on the homepage HTML.

**Cache API on `*.workers.dev`:** the Cache API does nothing on `*.workers.dev` URLs. Before the custom domain is attached, every homepage view fetches the feed, which is harmless at preview traffic levels.

*Alternatives considered:*
- **Cloudflare Pages:** it still works, but Cloudflare now points new projects to Workers static assets.
- **A purely static Worker with no `main`:** simpler, but it can't do the live video step.

### D8. The 404 page reuses the scene
`src/pages/404.astro` uses the same wall, lights and floor. The cat is awake and sitting, there is a short line saying the page doesn't exist, and a pixel button reads "Back to the cozy corner" and links to `/`. Workers static assets serve it with status 404 because of `not_found_handling: "404-page"`.

### D9. Assets derived from the avatar
The team's source file, `media/channel profile image.png`, is an 800×800 image of a 32×32 drawing. Each art pixel is exactly 25px, with 8 colours. A one-off script, `scripts/make-avatar.ts`, uses `sharp` with `kernel: nearest` and a factor of 25 to produce, losslessly:
- the native `src/assets/avatar-32.png`
- `public/favicon.svg`, built from the pixel data
- `favicon-32.png` (1×) and `apple-touch-icon.png` (180px, a 5× upscale padded to 180px with the slate wall colour)

On the page the avatar is shown at 128px, which is 4× and matches the grid exactly.

The 1200×630 Open Graph image is a Playwright screenshot of a dedicated `/og` render: the header, the shelves and the cat, at 1× scale. It is captured by `npm run og` and committed to `public/og.png`.

### D10. Testing strategy
| Layer | Tool | Covers |
|---|---|---|
| Sprite data | Vitest | Grid/palette validity (D2), run-merging renderer output |
| Feed + Worker | Vitest (`@cloudflare/vitest-plugin`, which replaces the deprecated `@cloudflare/vitest-pool-workers`) + fixture XML | Newest-entry selection, XML entity unescaping, malformed feed, timeout → unmodified page, HTMLRewriter output, `/yt-thumb` ID validation (no upstream call on bad IDs) |
| Page behaviour | Playwright (`npm run test:e2e`, against `wrangler dev` so the Worker is exercised) | All 7 links + URLs + `rel`, mailto, copy button (granted/denied clipboard, JS off), video facade, reduced-motion (no running animations), 404 status, keyboard tab order |
| Accessibility | `@axe-core/playwright` | Zero violations at 375 / 768 / 1280 |
| Visual | Playwright screenshots at 375 / 768 / 1280 | Compared against the v3 artboard by eye before launch; later used as regression baselines |
| Types/build | `astro check`, `astro build` | Run in CI and in Workers Builds |

## Risks / Trade-offs

- **[Platform logos are trademarks]** → Pixel versions are used only to link to BaaWasTaken's own profiles, which is normal nominative use. Each keeps its brand colour and recognisable shape, and none is distorted or presented as an endorsement.
- **[Discord invite links can expire]** → Before launch, confirm that invite `rm4HDpmN9g` is set to never expire with unlimited uses, or create a permanent invite and update the link in one place (`src/data/socials.ts`).
- **[YouTube changes or retires the RSS feed]** → The Worker falls back to the build-time snapshot, or to the channel link, so the page never errors. The fix is confined to `worker/feed.ts`. Worker logs (`wrangler tail`, or the dashboard) show parse failures.
- **[The free plan's 10 ms CPU limit per request]** → The feed is parsed at most once every 30 minutes per edge location. The parser is a linear scan rather than a DOM, and HTMLRewriter streams its output. The cached path is only a Cache API lookup plus the rewrite. If the limit is ever exceeded, Cloudflare serves an error for that request: check Worker CPU time in the dashboard after launch, and keep the static snapshot accurate.
- **[Over 100k Worker requests a day exceeds the free quota]** → Each homepage view is one Worker request, plus one for the thumbnail if the browser has not cached it. Past the quota those requests fail. If traffic ever gets near that level, either move to Workers Paid ($5/month) or remove `"/"` from `run_worker_first`, so the homepage is served as built (its video then updates only on a deploy). The thumbnail route has to stay on the Worker, because the page's thumbnail URL is `/yt-thumb/<id>`.
- **[The thumbnail route could be abused as a proxy]** → It only accepts IDs matching the strict regex and only fetches from `i.ytimg.com/vi/<id>/mqdefault.jpg`. Responses are cached for a day.
- **[Many animated layers drain battery or CPU on weak phones]** → Only `transform`/`opacity` with `steps()` timing are animated, the heaviest decorations are hidden on phones, and reduced motion is respected. Check the Lighthouse performance score on a throttled mobile profile.
- **[Fixed 4px art pixels on very narrow screens (320px)]** → The phone layout is designed at 320px first, and sprites that don't fit are hidden rather than scaled. The Playwright check at 375px plus a manual check at 320px confirm this.
- **[A pixel font for all text hurts readability]** → Jersey 20 is condensed and crisp, but small for its size, so no text is set below 14px (and only for tile descriptions on the narrowest phones; everything else is 16px or larger). Contrast is checked by axe at three widths, and tests fail if any text overflows its box from 320px up. If a passage ever reads poorly, the type scale lives in one file (`src/styles/tokens.css`).
- **[Workers Builds runs the build on Cloudflare's machines]** → Pin Node 24 with `.nvmrc` (and `engines` ≥ 22.23.4, Astro's own floor), and lock dependencies with `package-lock.json`. The build-time feed fetch is optional and never fails the build.

## Migration Plan

This is a greenfield launch, so there is nothing to migrate.

**Rollout:**
1. Merge and deploy the change to the Worker's `*.workers.dev` URL first.
2. Check it there.
3. Attach the custom domains.
4. Add the redirect rule.

**Rollback:** in the Cloudflare dashboard, go to Workers → baawastaken → Deployments and roll back to a previous version. You can also just revert the commit on `main`.

## Open Questions

- **Cloudflare Web Analytics:** add it after launch if wanted. It needs no cookies, but it would mean updating the "no tracking at launch" requirement in a follow-up change.
