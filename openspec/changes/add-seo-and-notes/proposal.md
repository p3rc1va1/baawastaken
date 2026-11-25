# Proposal

## Why

baawastaken.com is live, but search engines and AI assistants get very little from it: one page, one line of text, no structured data and no sitemap. Nothing tells them that the site, YouTube, Twitch, TikTok, Instagram, Kick, Discord and Ko-fi belong to the same person. There is also nowhere for writing to live, and written pages are what search engines rank for topics. This change makes the site the clear home of the BaaWasTaken identity and adds a small blog that can grow into topic traffic over time.

## What Changes

- **Search basics (site-wide)**:
  - Structured data (JSON-LD) describing BaaWasTaken as a person, with every social profile listed as the same identity, plus the site's name.
  - Each post marked up as a blog post.
  - A generated `sitemap.xml`, referenced from `robots.txt`.
  - Per-page titles, descriptions and canonical URLs.
  - No canonical tag on pages marked `noindex`.
- **Homepage title and about text**:
  - A clearer page title.
  - A short plain-text about paragraph under the tagline, so search engines and AI tools have facts to quote.
- **Posts (a small blog)**:
  - Posts are Markdown files in the repo.
  - `/blog` shows them newest first in a cozy-terminal feed that loads older posts as you scroll, like social media, with no next/previous buttons.
  - Numbered pages (`/blog/page/2`, …) exist underneath so crawlers and visitors without JavaScript can reach every post.
  - Every post has its own page at `/blog/<slug>`. The feed continues below the post.
  - Topic tabs: All, Games, Tech, This site.
  - The terminal look: a terminal window in the room with the TV's cream casing, terminal tabs for topics, a prompt line before each post, and the homepage cat, a plant and a steaming mug sitting on top.
  - Bold text gets a yellow highlight block, like selected text.
  - Headings use the pixel font; body text uses a readable, self-hosted font.
  - Posts can show one of the user's own YouTube videos in a TV frame.
  - An RSS feed of posts.
- **Homepage navigation and latest post**:
  - A minimal site menu (Home, Blog) in the homepage header and on every new page.
  - A small terminal card under the night window, showing the newest post and linking to `/blog`. The TV and window column moves up so the card clears the floor.
- **Post videos through the YouTube sync**: when a post names one of the user's videos, the scheduled sync from `static-snapshot-hosting` also captures that video's title and thumbnail. That way post pages stay static and never load images from YouTube.

The Videos menu entry and the game pages are planned in the separate change `add-game-pages`. Skipping Shorts on the TV moved to `static-snapshot-hosting`.

**Depends on** `static-snapshot-hosting` (static hosting, the YouTube snapshot and the sync). Archive that change first.

## Capabilities

### New Capabilities
- `seo`: how the site describes itself to search engines and AI assistants: structured data, sitemap, robots rules, per-page titles, descriptions and canonical URLs, and indexing rules for hidden pages.
- `blog`: the blog: where posts come from, the scrolling feed with crawlable numbered pages, topic filters, single-post pages, reading typography, video embeds and the RSS feed.

### Modified Capabilities
- `homepage`: the header gains a minimal site menu and an about paragraph, a latest-post card is added under the window, the page title changes, and the accessibility, screen-reader and responsive requirements now cover the new elements.
- `youtube-sync`: the sync also captures the title and thumbnail of every video named by a post.

## Impact

- **Code**:
  - `src/components/Layout.astro` (metadata, JSON-LD), `Header.astro` (menu, about text), `src/data/site.ts` (title, about copy).
  - New `LatestPost` component and new `src/pages/blog/**` routes.
  - A content collection under `src/content/blog/`.
  - `scripts/youtube-sync.ts` (post videos).
  - `public/robots.txt`.
- **Dependencies**:
  - `@astrojs/sitemap` and `@astrojs/rss`.
  - A self-hosted DM Mono font (Fontsource) for reading, to keep the "fonts from our own origin" rule.
- **Hosting**: all new pages are static files on the static base from `static-snapshot-hosting`. The infinite scroll is a small browser script that loads the existing numbered pages. No per-request code.
- **Outside the repo (the user)**:
  - Verify the site in Google Search Console and Bing Webmaster Tools, and submit the sitemap.
  - Check that Cloudflare is not blocking AI crawlers.
  - Add the site link to every platform profile.
  - Write the about paragraph and the first posts.
- **Design reference**: the "Chosen" and "Latest post on the homepage" rows on the BaaWasTaken visual directions canvas (Terminal-Posts, Terminal-Post, Terminal-Home in the "Try-out: posts as a cozy terminal" row).
