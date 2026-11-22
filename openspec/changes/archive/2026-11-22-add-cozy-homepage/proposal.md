# Proposal

## Why

BaaWasTaken publishes on seven platforms (YouTube, Twitch, Kick, Discord, Instagram, TikTok, Ko-fi), but nothing ties them together. The newly bought domain baawastaken.com is empty. The brand is built on cozy pixel art. A single homepage in that style gives fans and collaborators one place to find every channel, the newest video and a way to get in touch.

## What Changes

- Add a single-page homepage served at `https://baawastaken.com`. It is statically generated, with one small edge step that adds the latest video. It follows the approved design direction "A v3 · The Shelf, one pixel grid", with the Bengal cat variant (design canvas: https://claude.ai/artifact/TmAEXp3E1SgQubod7UByYc#artboard-Shelf-v3).
- **Brand header:** the avatar in a wooden frame, the `BaaWasTaken` wordmark (written with its capitals, in Jersey 20, a pixel font with clear lowercase letters) and the channel tagline.
- **Platform links:** seven link tiles, each with a pixel-art version of the platform's logo, arranged on two wooden shelves:
  - top shelf, watch, follow and support: YouTube, Instagram, TikTok, Ko-fi
  - bottom shelf, live streams and community: Twitch, Kick, Discord
- **Latest video:** a retro TV that shows the newest YouTube upload. A small Cloudflare Worker reads the channel's public RSS feed when the page is requested, caches the result for about 30 minutes and injects it into the page. New uploads appear within about half an hour, with no extra JavaScript in the browser. If YouTube is unreachable, the page falls back to a snapshot taken at build time.
- **"Say hi" contact card:** two addresses, each with a `mailto:` link and a copy-to-clipboard button: a friendly one for fans, `hello@baawastaken.com`, and one for business inquiries, `business@baawastaken.com`.
- **Decorative room scene,** all original pixel art on one shared pixel grid:
  - wallpaper and string lights
  - a wall clock with a swinging pendulum
  - a night window with a drifting cloud and a shooting star
  - a plant, books and a steaming mug
  - a sleeping Bengal cat and a succulent on the TV
  - dust motes
  - a wooden floor with a rug and a game controller
- **Motion:** the scene uses small, stepped, pixel-style animations that switch off under `prefers-reduced-motion`.
- **Layouts:** responsive layouts for desktop, tablet and phone.
- **SEO and sharing:** page metadata, a favicon and a social share image.
- **Deployment:**
  - pushes to `main` deploy automatically to Cloudflare Workers (static assets plus a small Worker that only handles the homepage HTML and the video thumbnail), bound to `baawastaken.com`, with `www` redirecting to the apex
  - no scheduled jobs, bot commits or API tokens are needed

## Capabilities

### New Capabilities

- `homepage`: what a visitor sees and can do on baawastaken.com:
  - brand identity
  - links to every social platform
  - the contact card
  - the decorative scene and its motion rules
  - responsive layout and accessibility guarantees
- `latest-video`: showing the newest YouTube upload, read from the public channel feed at the edge with short-lived caching, and how the page behaves when the feed is unavailable.
- `site-hosting`: how the site is served and kept current:
  - served on the custom domain over HTTPS
  - the `www` redirect
  - automatic deploys from the repository
  - static delivery, with edge code limited to the latest-video step
  - caching

### Modified Capabilities

None. This is a new project with no existing specs.

## Impact

- **Code:** a new Astro project at the repository root (`src/`, `public/`, `astro.config.mjs`, `package.json`, `wrangler.jsonc`), plus a small Worker entry point (`worker/index.ts`) for the latest-video step.
- **Dependencies:**
  - Astro
  - self-hosted fonts via Fontsource (one typeface, Jersey 20, for everything on the page)
  - Wrangler (dev dependency)
  - Vitest (dev dependency)
- **External systems:**
  - Cloudflare account: Worker, custom domain, Workers Builds Git integration
  - the existing GitHub repository `p3rc1va1/bahawastaken`
  - the YouTube RSS feed for channel `UC-MLQMe0PJR6v2d14VVb5fg`, read from the edge
  - `i.ytimg.com` thumbnails, fetched by the Worker and served through `baawastaken.com`
- **Privacy:**
  - the two contact addresses are published on the page, which is intended
  - no analytics or third-party scripts at launch
  - the video embed loads from `youtube-nocookie.com`, and only after the visitor clicks
