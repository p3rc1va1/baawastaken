# Tasks

Reference the visual source of truth for every UI task: https://claude.ai/artifact/TmAEXp3E1SgQubod7UByYc#artboard-Shelf-v3 (approved v3 + Bengal cat). Tasks marked **[you]** need the site owner in a browser or account; the rest are code.

## 1. Project scaffolding

- [x] 1.1 Scaffold Astro 7 (minimal template, TypeScript strict) at the repo root with `output: 'static'`, `site: 'https://baawastaken.com'`; add `.nvmrc` (24), `engines.node >=22.23.4`, `.gitignore` (node_modules, dist, .astro, .wrangler); verify `npm run build` produces `dist/index.html`
- [x] 1.2 Install dependencies: `@fontsource/jersey-20`; dev: `wrangler`, `@cloudflare/workers-types`, `vitest`, `@cloudflare/vitest-plugin`, `@playwright/test`, `@axe-core/playwright`, `sharp`, `tsx`; verify `npm ls` reports no missing peers
- [x] 1.3 Add npm scripts `dev`, `build`, `preview`, `check` (astro check), `test` (vitest run), `test:e2e` (playwright against `wrangler dev`), `avatar`, `og`; verify each script resolves (`npm run check` passes on the empty site)
- [x] 1.4 Add `wrangler.jsonc` (`name: "baawastaken"`, `main: "worker/index.ts"`, `compatibility_date` today, `assets: { directory: "./dist", binding: "ASSETS", not_found_handling: "404-page", run_worker_first: ["/", "/yt-thumb/*"] }`) with a pass-through Worker stub; verify `npx wrangler deploy --dry-run` succeeds after a build and `wrangler dev` serves the homepage

## 2. Design tokens and base styles

- [x] 2.1 Create `src/styles/tokens.css` with the palette from design.md (slate, cream, peach, jade ramp, wood ramp, floor, ink) and `--px: 4px` plus spacing helpers in multiples of `--px`; verify no raw hex values remain outside tokens/sprite palettes (`grep` check in a Vitest test)
- [x] 2.2 Create `src/styles/base.css`: reset, wallpaper background (SVG pattern from the mockup), font-face imports (Latin subsets only), type scale (one typeface, Jersey 20: wordmark 112/88/60/56/52, headings 44/32/26, text 28/22/20/18), focus-visible outline style, `image-rendering: pixelated` for pixel images; verify fonts load from own origin in `npm run preview` (devtools network tab shows no third-party hosts)
- [x] 2.3 Add the global `prefers-reduced-motion` block and shared `@keyframes` (twinkle, steam, zz, blink, frameA/frameB, drift, shoot, roll, led, mote, hop) with `steps()` timing; verify by unit snapshot of the CSS that every animation is nulled under reduced motion

## 3. Sprite system

- [x] 3.1 Implement `src/sprites/types.ts` (palette map + one or more ASCII frames) and `src/components/Sprite.astro` that renders inline SVG with run-merged `<rect>`s, size = art size × `--px`, `crispEdges`, `aria-hidden` by default, multi-frame layering with `fa`/`fb` classes, and optional PNG source rendered at integer scale; verify a Vitest test asserting the rendered rect output for a 3×3 fixture
- [x] 3.2 Add the sprite-validity Vitest suite (equal row widths, every glyph has a palette entry, frames within declared size, all frames of one sprite same size); verify it fails on a deliberately broken fixture and passes on the real set
- [x] 3.3 Port the seven platform logos from the v3 mockup to sprite modules on the shared 12×12 grid (YouTube, Twitch, Kick, Discord, Instagram, TikTok with cyan/pink offset layers, Ko-fi); verify validity suite passes and each renders 48×48
- [x] 3.4 Port the scene sprites from the mockup: clock + 2-frame pendulum, 2-frame plant, mug + steam, books, succulent, Bengal cat (golden coat, rosettes, M-mark) + 2-frame tail, window sky (moon, stars, houses), cloud, shooting star, envelope, pushpin, stamp heart, controller; verify validity suite passes
- [x] 3.5 Generate the avatar: `scripts/make-avatar.ts` reads `media/channel profile image.png` (800×800, 25 px per art pixel), nearest-neighbour downscales ÷25 to `src/assets/avatar-32.png`, and emits `public/favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (180px: 5× + slate padding); verify a test that upscaling the 32×32 back ×25 is pixel-identical to the source

## 4. Content data

- [x] 4.1 Create `src/data/socials.ts` with the seven platforms (id, name, description, URL, shelf, sprite, `support: true` for Ko-fi) using the exact URLs from `specs/homepage`; verify a Vitest test asserts the seven URLs and shelf order
- [x] 4.2 Create `src/data/site.ts` (title, tagline "I'm into tech and I play games sometimes. Grab a drink and come hang out.", contact emails `hello@baawastaken.com` (fans) and `business@baawastaken.com` (business), canonical URL, theme colour `#323D39`); verify it is the only place these strings are defined (grep test)

## 5. Homepage components

- [x] 5.1 `Layout.astro`: `<html lang="en">`, meta (title, description, canonical, theme-color, OG/Twitter tags, favicons), font preloads, wallpaper; verify via Playwright that all meta tags are present with expected values
- [x] 5.2 `StringLights.astro`: catenary wire and bulbs computed at build time snapped to the 4px grid, staggered twinkle; verify at 1280px it matches the mockup and at 375px it spans the width without overflow
- [x] 5.3 `Header.astro` (framed avatar at 128px, `h1` wordmark, tagline) with anchored `Clock` decoration; verify the clock never overlaps the wordmark at 1180–1920px (Playwright bounding-box check)
- [x] 5.4 `Shelf.astro` + `LinkTile.astro` (logo slot, name, description, hover lift + logo hop, focus outline, `rel="noopener"`, Ko-fi jade variant) and the lower-shelf decoration slot (plant, books, mug + steam); verify Playwright finds 7 links with correct `href`s in the specified shelf order
- [x] 5.5 `LatestVideoTV.astro`: CRT frame, thumbnail `<img src="/yt-thumb/<id>">` (fixed 16:9 box, no layout shift), scanlines + rolling scan + LED, title and `<time>` below, all carrying `data-lv` markers for the Worker; renders the build-time snapshot from `src/lib/latest-video.ts` (task 7.2) or the marked "Watch on YouTube" fallback; cat + succulent anchored on top; verify both states render (Playwright with snapshot and with the fetch stubbed to fail)
- [x] 5.6 Video facade script (inline, <1 KB): on click replace thumbnail with `youtube-nocookie.com/embed/<id>?autoplay=1` iframe titled with the video title; link still navigates to youtube.com with JS disabled; verify both paths in Playwright
- [x] 5.7 `ContactCard.astro`: pinned postcard, envelope, "Say hi" heading, a fans section (`hello@`) then a business section (`business@`), each with a `mailto:` button and its own "Copy email" button rendered hidden and revealed only when `navigator.clipboard` exists, label swaps to "Copied" with `aria-live="polite"`; verify Playwright cases: clipboard granted, denied, and JS disabled
- [x] 5.8 `NightWindow.astro` (curtains, sill, sky sprite, drifting cloud, shooting star, twinkling stars) anchored beside the contact card; dust motes layer; verify all decoration has `aria-hidden="true"` (axe + DOM query)
- [x] 5.9 `Floor.astro` (baseboard, planks, striped rug, controller) and `Footer.astro`; verify footer text contrast ≥ 4.5:1 via axe
- [x] 5.10 Assemble `src/pages/index.astro` and compare against the v3 artboard at 1280px; verify with a Playwright screenshot reviewed side by side with the mockup **[you: approve look]**

## 6. Responsive and motion

- [x] 6.1 Implement tablet layout (768–1179px: TV and window below shelves, contact beside window); verify no horizontal scroll and no overlaps at 768 and 1024px (Playwright `scrollWidth` + bounding-box checks)
- [x] 6.2 Implement phone layout (<768px: stacked header with a one-line 60px wordmark, 2 tiles per row with a plank per row, decoration row, full-width TV and contact card, hide window/pendulum/motes, shorter floor); verify at 320 and 375px no overflow and all 7 links, TV and contact visible
- [x] 6.3 Verify reduced motion: Playwright with `reducedMotion: 'reduce'` asserts `document.getAnimations()` is empty and single frames are visible
- [x] 6.4 Run axe at 375 / 768 / 1280 and a keyboard tab-order test (header → 7 links → video → email → copy); verify zero violations and expected order

## 7. Latest video at the edge

- [x] 7.1 Implement `worker/feed.ts`: dependency-free parser extracting `yt:videoId`, `title`, `published` per `<entry>`, XML-unescaping titles, returning the newest by `published` or `null`; verify Vitest cases with fixture XML: normal feed, out-of-order entries, entities in titles (`&amp;`, `&#39;`), empty feed, malformed XML
- [x] 7.2 Implement `src/lib/latest-video.ts` used by Astro at build time (reuses `worker/feed.ts`, 5 s timeout, returns `null` on any failure); verify `npm run build` succeeds with network disabled and the page shows the fallback
- [x] 7.3 Implement the `/` handler in `worker/index.ts`: get the asset, read cached latest video (Cache API key, 30 min) or fetch the feed (3 s timeout, `cf.cacheTtl: 1800`), rewrite `data-lv` elements with `HTMLRewriter`, set `Cache-Control: public, max-age=0, must-revalidate`, and on any error/timeout return the untouched asset with 200; verify with `@cloudflare/vitest-plugin`: fresh fetch rewrites, second request uses cache (one upstream call), feed 500 → untouched page, feed timeout → untouched page, fallback block swapped when feed recovers
- [x] 7.4 Implement `/yt-thumb/<id>`: validate `^[A-Za-z0-9_-]{11}$`, fetch only `https://i.ytimg.com/vi/<id>/mqdefault.jpg` with `cf.cacheTtl: 86400`, return with `Cache-Control: public, max-age=86400`; verify tests: valid ID → image, invalid ID (`../`, 12 chars, URL) → 404 with zero upstream fetches
- [x] 7.5 Verify end to end with `wrangler dev`: homepage HTML (view-source) contains the channel's current newest video title and `/yt-thumb/` URL, and devtools shows no request to any YouTube host until Play is clicked

## 8. 404, share image, headers

- [x] 8.1 `src/pages/404.astro` reusing the scene with an awake cat and a "Back to the cozy corner" link to `/`; verify `npx wrangler dev` returns status 404 for `/nope` with that page
- [x] 8.2 Add `src/pages/og.astro` (1200×630 composition) and `scripts/og.ts` that screenshots it to `public/og.png`; exclude `/og` from the sitemap and add `noindex`; verify the PNG is 1200×630 and referenced by OG meta
- [x] 8.3 Add `public/_headers` (immutable 1-year cache for `/_astro/*` and fonts) and `public/robots.txt`; verify headers in `npx wrangler dev` responses
- [x] 8.4 Write `README.md` (what the site is, local dev, scripts, how to change a social link, how the latest video gets onto the page and how to stop the live update by removing `"/"` from `run_worker_first`, how to roll back); verify each documented command runs as written

## 9. Repository and Cloudflare setup

- [x] 9.1 **[you]** Confirm Discord invite `rm4HDpmN9g` is set to never expire / unlimited uses (or provide a permanent one); verify by opening the invite in a private window
- [x] 9.2 With your go-ahead, make the initial commit on `main` and push to the existing `p3rc1va1/bahawastaken` remote; verify the GitHub repo shows the code
- [x] 9.3 **[you]** In Cloudflare: Workers & Pages → Create → Import a repository → select `p3rc1va1/bahawastaken`; build command `npm run build`, deploy command `npx wrangler deploy`; name the Worker exactly `baawastaken` (it must match `name` in `wrangler.jsonc`; the GitHub repo is called `bahawastaken`, so the default name offered will be wrong); verify the first build succeeds on Node 24 (Workers Builds defaults to Node 24 since July 2026 and also reads `.nvmrc`; set `NODE_VERSION=24` only if the log shows another version) and the `*.workers.dev` URL serves the homepage with the latest video
- [x] 9.4 **[you]** Attach Custom Domains `baawastaken.com` and `www.baawastaken.com` to the Worker; add a Single Redirect Rule `www.baawastaken.com/*` → `https://baawastaken.com/${1}` (301); enable Always Use HTTPS; verify `curl -I http://baawastaken.com`, `https://www.baawastaken.com/` and `https://baawastaken.com/nope` return 301/301/404 as specified
- [x] 9.5 After the custom domain is live, publish nothing new and reload twice within a minute; verify in the Worker's dashboard logs that only one feed fetch occurred (edge caching works on the custom domain)

## 10. Launch checks

- [x] 10.1 Run Lighthouse (mobile, throttled) against `https://baawastaken.com`; verify ≥ 95 in Performance, Accessibility, Best Practices, SEO and first-load transfer < 150 KB excluding the thumbnail
- [x] 10.2 Click every platform link, the email link and the copy button on a real phone and desktop browser; paste the URL into Discord to check the OG preview; verify all behave per `specs/homepage`
- [x] 10.3 Verify network requests on first load are same-origin only (devtools), no console errors, and Worker CPU time per request in the Cloudflare dashboard stays well under 10 ms
