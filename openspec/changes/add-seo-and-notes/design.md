# Design

## Context

- **Builds on `static-snapshot-hosting`**: the site is fully static with no Worker. A scheduled GitHub Actions sync captures YouTube data into `src/data/youtube.json` and thumbnails into `public/yt/<id>.jpg`, and builds never contact YouTube.
- **Site config**: Astro with `output: 'static'` and `trailingSlash: 'never'`.
- **Metadata**: `Layout.astro` owns all metadata today, and its canonical tag is hard-coded to the homepage URL.
- **Styles**: all raw colours live in `src/styles/tokens.css`. The site uses one font, Jersey 20, self-hosted via Fontsource.
- **Spec constraints that carry over**:
  - fonts are served from our own origin, with no third-party scripts
  - one 4px pixel grid for all sprites
  - WCAG 2.2 AA
  - no per-request code for page views
- **Visual reference**: the canvas artboards Terminal-Posts, Terminal-Post and Terminal-Home.

## Goals / Non-Goals

**Goals:**
- Every new page is a static file. Scrolling only adds a small script that loads more of those files.
- Each fact lives in one place: socials feed both the tiles and `sameAs`, and post frontmatter feeds the feed, the post pages, the sitemap, RSS and the homepage card.
- Pages work fully without JavaScript.

**Non-Goals:**
- Comments, likes, or any other interaction on posts.
- A CMS or online editor. Posts are written as Markdown and pushed with git.
- Search within posts.
- Analytics.
- Game pages and the Videos menu entry (change `add-game-pages`).

## Decisions

### Posts are an Astro content collection
- **Where**: `src/content/blog/*.md`, loaded with the glob loader.
- **Fields**: a schema validates `title`, `date`, `description`, `topic` (`games` | `tech` | `site`), and the optional `updated`, `video` (an 11-character ID, checked with the existing `isVideoId`) and `draft`.
- **Slug**: the file name.
- **Reserved names**: the slugs `page`, `topic` and `rss` collide with routes, so the build rejects them with a clear error.
- **Why**: build-time validation gives the "fail with the file name" behaviour for free, and Markdown suits a git workflow.
- **Alternative considered**: MDX. Not needed: the only rich element is a video, and that comes from frontmatter.

### Routes and pagination
- **Routes**:
  - `/blog` and `/blog/page/N` use Astro `paginate()`, 8 posts per page.
  - `/blog/topic/<topic>` and `/blog/topic/<topic>/page/N` work the same way.
  - `/blog/<slug>` is a single post.
  - `/blog/rss.xml` is the RSS feed.
- **Links between pages**: each numbered page carries `<link rel="next">` and a visible "Older posts" link at the end. That link is the no-JavaScript fallback.
- **Why fixed page files**: they are what crawlers index, and what the scroll script fetches.

### Endless scroll by loading the next page file
A small inline module, with no dependencies, does the scrolling:
- It watches a sentinel element near the end of the list.
- When the sentinel becomes visible, it fetches the page in the `rel="next"` link, reads its `<article data-post="slug">` elements and appends them.
- It then moves the sentinel to that page's own next link.
- Posts already on the page (matched by `data-post`) are skipped, so the feed under a single post can overlap a numbered page safely.
- An `aria-live="polite"` region announces "Loading older posts" and "That's every post".
- On a failed request, the fallback link reappears.
- The URL does not change while scrolling, so the back button and refresh behave predictably.
- **Alternatives considered**:
  - A JSON endpoint: rejected. It's a second representation to keep in sync.
  - Client-side rendering: rejected. It breaks the "works without JavaScript" rule and needs more code.

### Older posts under a single post
- Each post page renders the next 3 older posts at build time.
- After those, its sentinel points to the numbered page that holds the 4th older post, and the same scroll script takes over from there.
- If the post is the oldest one, nothing is rendered below it.

### Shared layout pieces
- **`Layout.astro`** takes `title`, `description`, `canonicalPath`, `ogImage`, `noindex` and `jsonLd` props. When `noindex` is set, it omits the canonical tag.
- **`SiteNav`** is a new component driven by a small `nav` array in `src/data/site.ts` (Home and Blog for now), so `add-game-pages` adds Videos by adding one entry.
- **Blog pages** use a `TerminalWindow` wrapper: cream casing with a bevel (the same tokens as the TV), a tab strip slot, a dark slate screen with a scanline overlay, and a speaker grille with an LED below. The room background and string lights are reused from the existing components.
- **Things on top**: the existing `cat`, plant and mug-with-steam sprites from `src/sprites/scene.ts`, absolutely positioned with their bottom edge on the casing's top edge (`bottom: 100%`), so they sit on it at every width.
- **Prompt lines**: `PromptLine.astro` renders `baa@cozy-corner:~/blog$ cat <slug>.md` with `aria-hidden="true"`. They are flavour only. The loading line (`load --older` plus a blinking cursor) is the one prompt with a live text alternative.

### Typography and highlight
- **Body font**: DM Mono (400 and 500, Latin), self-hosted through Fontsource like Jersey 20. It's a soft monospace that keeps the terminal feel while staying comfortable for paragraphs. It is loaded on blog pages and by the homepage post card.
- **Sizes**: body text 20px with 1.7 line height, at most 62ch per line. Headings stay Jersey 20.
- **Highlight**: `strong` gets a solid `--highlight` background with dark ink and a 2px spread, like a terminal selection.
- **New tokens**: `--highlight` (#F9D77E), `--term-text` (#EADBC8), `--term-dim` (#9FB3A8), `--term-rule` (#34423D) and `--font-reading`, added to `tokens.css`. The screen uses the existing `--slate-900`. Buttons and tabs use only the existing jade, cream, peach and wood tokens.

### Video in a post
- **Player**: the TV's click-to-play markup and script are pulled out of `LatestVideoTV` into a reusable `TvPlayer` component. It takes an ID, a title and a thumbnail path.
- **Data**: a post's `video` field is looked up in the YouTube snapshot for its title and `/yt/<id>.jpg` thumbnail. If the video isn't captured yet, `TvPlayer` renders a plain screen with a "Watch on YouTube" link, so a freshly pushed post never fails the build.
- **Sync**: `scripts/youtube-sync.ts` reads post frontmatter (the `video` field of non-draft posts in `src/content/blog/*.md`) with a small frontmatter reader, so it still needs no packages. It fetches each missing video's title through YouTube's public oEmbed endpoint (no API key needed) and its thumbnail as usual. Videos no longer named anywhere are dropped.
- **Timing**: publishing a post with a video takes two deploys: the push, then the sync commit that adds the thumbnail about 5–10 minutes later. Accepted, because it keeps the build offline.

### Homepage latest-post card
- `LatestPost.astro` reads the newest published post at build time. It sits in the window column under `NightWindow`, styled as a small `TerminalWindow` with a `cat latest.md` prompt. To keep it clear of the floor, the right-hand column (TV, window, card) moves up by 12 art pixels (48 CSS px) at desktop widths, through a negative top margin on the TV cell, keeping it on the 4px grid.
- The description supports only `**bold**`, which is rendered with the highlight. Everything else is escaped.
- If there are no posts, nothing renders.
- **Why build time**: publishing a post always means a push and a rebuild, so the card is never stale.

### Structured data
- **Homepage**: a `ProfilePage` whose `mainEntity` is a `Person` (name, url, image, description, `sameAs` taken from `socials.ts`), plus a `WebSite` with `name` and `url`.
- **Post pages**: a `BlogPosting`.
- All of it is generated from data files and serialised with `JSON.stringify` into `<script type="application/ld+json">`, with `<` escaped.
- **Alternative considered**: `Organization`. Rejected because this is one creator.

### Sitemap and robots
- `@astrojs/sitemap` generates the sitemap. A filter excludes `/og` and the 404 page.
- `public/robots.txt` gains a `Sitemap: https://baawastaken.com/sitemap-index.xml` line.
- **RSS**: `@astrojs/rss`.

## Risks / Trade-offs

- **[A post's video appears a few minutes after the post itself]** → The fallback "Watch on YouTube" screen is deliberate and readable. Running the sync by hand after pushing removes the wait.
- **[Full posts appear both in the feed and on their own pages]**: this could look like duplicate content to search engines. → Each page has its own canonical URL, and post pages carry `BlogPosting` data. Feed pages are clearly lists. This is a common blog pattern that search engines handle.
- **[An endless feed can hide the footer]** → The feed is finite and ends with "That's every post". The footer stays in the page after the loaded posts, and the "Older posts" link offers a way out.
- **[A second font adds weight]** → Only the Latin subset, two weights (400 and 700), and only on blog pages, preloaded there.
- **[Slugs fixed by file names]** → Renaming a file changes its URL. The README says so, and nothing redirects old slugs in this change.

## Migration Plan

1. Merge and push to `main`. The automatic deploy ships it. The previous deployment stays live if the build fails.
2. After the deploy, the user:
   - verifies the domain in Google Search Console and Bing Webmaster Tools (via a Cloudflare DNS record) and submits `sitemap-index.xml`
   - checks Cloudflare's AI crawler settings
   - adds the site link to every platform profile
3. **Rollback**: revert the merge commit and push. There is no data to migrate.

## Open Questions

- The about paragraph's exact wording, and the first posts, come from the user. Placeholder copy is kept out of `main` until they are written.
