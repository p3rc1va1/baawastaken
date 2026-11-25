# Tasks

Visual source of truth: https://claude.ai/artifact/TmAEXp3E1SgQubod7UByYc. The artboards are `#artboard-Terminal-Posts` (blog feed), `#artboard-Terminal-Post` (post page) and `#artboard-Terminal-Home` (homepage post card). Apply after `static-snapshot-hosting` is archived. Tasks marked **[you]** need the site owner in a browser or account. The rest are code. Run commands with Node 24 on the PATH (see the README).

## 1. Dependencies and tokens

- [ ] 1.1 Install `@astrojs/sitemap`, `@astrojs/rss` and the Fontsource package for DM Mono (Latin, 400 and 500). Verify that `npm ls` reports no missing peers and that `npm run build` still passes.
- [ ] 1.2 Add `--highlight`, `--term-text`, `--term-dim`, `--term-rule` and `--font-reading` to `src/styles/tokens.css`. Verify that the existing "no raw hex outside tokens" test still passes.

## 2. Shared layout and metadata

- [ ] 2.1 Extend `Layout.astro` with `title`, `description`, `canonicalPath`, `ogImage`, `noindex` and `jsonLd` props, and leave out the canonical tag when `noindex` is set. Verify with a Playwright test that the homepage canonical is unchanged and that the 404 and `/og` pages have `noindex` and no canonical.
- [ ] 2.2 Change the homepage title to `BaaWasTaken | Cozy pixel art, tech and games` in `src/data/site.ts`. Verify that `tests/e2e/meta.e2e.ts` is updated and passes.
- [ ] 2.3 Add the JSON-LD builders: `ProfilePage` + `Person` with `sameAs` taken from `socials.ts`, `WebSite`, and `BlogPosting`, serialised with `<` escaped. Verify with unit tests that `sameAs` equals the seven social URLs, that the output parses as JSON, and that a title containing `</script>` cannot break out of the script tag.
- [ ] 2.4 Add the homepage JSON-LD through the Layout. Verify with a Playwright test that the homepage has exactly one `ProfilePage` and one `WebSite` block, and check the live preview with the Schema.org validator.
- [ ] 2.5 Configure `@astrojs/sitemap` to exclude `/og` and the 404 page, and add the `Sitemap:` line to `public/robots.txt`. Verify with a build test that the sitemap lists `/` and every post page, and does not list `/og` or `/404`.

## 3. Site menu

- [ ] 3.1 Add a `nav` array to `src/data/site.ts` (Home, Blog) and a `SiteNav.astro` component (pixel font, jade current item with `aria-current="page"`, 44px targets, wraps on narrow screens). Verify with unit tests that the menu renders from data and the current item is marked.
- [ ] 3.2 Place `SiteNav` in the homepage header without moving the avatar or wordmark, and stack it under the wordmark on phones. Verify with Playwright at 375, 768, 1280 and 1920px that nothing overlaps (bounding boxes) and the tab order is header, then menu, then shelves.

## 4. Posts content and routes

- [ ] 4.1 Define the `blog` content collection: a glob loader over `src/content/blog/*.md`, a schema for title, date, description, topic, updated, video and draft, drafts excluded, and the reserved slugs `page`, `topic` and `rss` rejected. Verify with unit tests over fixture posts that a missing field or reserved slug fails with the file name, and that drafts are filtered out.
- [ ] 4.2 Add `/blog` and `/blog/page/N` (8 per page, newest first, `rel="next"` plus a visible "Older posts" link, and an empty state). Verify with build tests against 20 fixture posts: 3 pages, correct order, no page 4 (404), and the empty state when there are no posts.
- [ ] 4.3 Add `/blog/topic/<topic>` and its numbered pages, plus the topic tabs (All, Games, Tech, This site) in brand colours, with the current tab marked and an empty state per topic. Verify with build tests that each topic page holds only its topic and that the tabs link correctly.
- [ ] 4.4 Add `/blog/<slug>`. The post's title is the `h1`, followed by the author line, the body, an "All posts" link, `BlogPosting` JSON-LD, the "Keep scrolling for older posts" marker and the next 3 older posts, with the sentinel pointing at the numbered page that holds the 4th. Verify with build tests the middle-post and oldest-post cases and that an unknown slug returns 404.
- [ ] 4.5 Add `/blog/rss.xml` with `@astrojs/rss` and the `<link rel="alternate">` in the blog pages' head. Verify with a test that the feed is well-formed XML, newest first, without drafts.

## 5. Terminal look and reading

- [ ] 5.1 Build `TerminalWindow.astro` (cream casing, tab strip slot, slate screen with scanlines, grille and LED) and `PromptLine.astro` (`aria-hidden`), with the cat, plant and mug-with-steam sprites seated on the casing's top edge. Match the Terminal-Posts artboard. Verify with Playwright screenshots at 375 and 1280px, a bounding-box test showing the sprites' bottoms equal the casing's top at 375, 768 and 1280px, reduced motion freezing the cat, steam and cursor, and an axe pass.
- [ ] 5.2 Add the reading typography: Jersey 20 headings with a jade `#`, DM Mono body text at 17px / 1.75 with at most 68ch per line, and the `strong` highlight block. Verify with a Playwright test that every font request goes to our own origin and that highlighted and dim text pass 4.5:1 contrast (axe).
- [ ] 5.3 Extract the TV click-to-play markup and script from `LatestVideoTV` into `TvPlayer.astro` (ID, title, `/yt/<id>.jpg` thumbnail, and a plain "Watch on YouTube" screen when the video isn't in the snapshot). Use it for the homepage TV and post videos, looking post videos up in the snapshot. Verify that the existing video e2e tests still pass, and that new tests cover play-on-click, the no-JavaScript link, and a post whose video isn't captured yet (the build passes and the fallback shows).

## 6. Endless scroll

- [ ] 6.1 Write the scroll module: watch the sentinel, fetch `rel="next"`, append the new `<article data-post>` elements while skipping duplicates, move the sentinel, announce "Loading older posts" and "That's every post" through `aria-live`, show the fallback link on failure, and leave the URL unchanged. Verify with Playwright over 20 fixture posts: scrolling loads all of them in order with no duplicates, a failed fetch shows the "Older posts" link, and with JavaScript disabled the link is visible and works.
- [ ] 6.2 Turn on the same module under single posts and on topic pages. Verify with a Playwright test that scrolling from a middle post continues through to the oldest post with no duplicates.

## 7. Homepage additions

- [ ] 7.1 Add the about paragraph to the header from `site.ts`. Verify with a Playwright test that it is visible text under the tagline and that the header stays free of overlaps at all four widths. **[you]** Supply the final two or three sentences.
- [ ] 7.2 Build `LatestPost.astro`: a small terminal under `NightWindow` with a `cat latest.md` prompt, date, title and description (only `**bold**` rendered, with the highlight), a "Read in Blog" control, the whole card linking to `/blog` with an accessible name, and nothing rendered when there are no posts. Raise the right-hand column by 48px at desktop widths. Match Terminal-Home. Verify with Playwright the layout at 375, 1024 and 1280px, that the card ends above the floor at each width, the link target, the no-posts case (no gap), and axe.
- [ ] 7.3 Update the homepage decoration and screen-reader test so the menu, about text and latest post card are announced and all decoration stays hidden. Verify that `tests/e2e/a11y.e2e.ts` passes.

## 8. Post videos in the YouTube sync

- [ ] 8.1 Extend `scripts/youtube-sync.ts` to read the `video` field of non-draft posts (a minimal frontmatter reader, no packages), fetch titles of missing videos through YouTube oEmbed and their thumbnails, keep them in the snapshot, and drop videos no longer named. Verify with unit tests over a mocked fetch: a new post video is captured, an unavailable video logs a warning naming the post while other changes still apply, an unnamed video is removed, and an unchanged state writes nothing.
- [ ] 8.2 **[you]** Push a test post with a video, then start the sync by hand. Verify that the post first shows the "Watch on YouTube" screen, then the thumbnail and title after the sync commit deploys.

## 9. Content and launch

- [ ] 9.1 Add a short authoring guide to the README: where posts go, the frontmatter fields, slugs coming from file names (renaming a file breaks links), and how to embed a video. Verify that following it adds a working test post in `npm run dev`.
- [ ] 9.2 **[you]** Write the first one or two posts (for example "How I built this cozy corner"). Verify that they appear in the feed, on their own pages, in the sitemap, in RSS and on the homepage card in `npm run preview`.
- [ ] 9.3 Run the full check: `npm run check`, `npm test` and `npm run test:e2e` all pass, and Lighthouse SEO and Accessibility score 100 on `/` and on a post page in the preview.
- [ ] 9.4 **[you]** Deploy, then verify the domain in Google Search Console and Bing Webmaster Tools and submit `https://baawastaken.com/sitemap-index.xml`. Verify that both report the sitemap as read.
- [ ] 9.5 **[you]** In Cloudflare, make sure AI crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot) are not blocked, and add `https://baawastaken.com` to the YouTube, Twitch, Kick, TikTok, Instagram, Discord and Ko-fi profiles. Verify that `curl -A GPTBot -I https://baawastaken.com/` returns 200.
