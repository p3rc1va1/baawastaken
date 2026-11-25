# Spec Delta

## Purpose

A small blog of posts about games, tech and the site itself, written as Markdown in the repository and read as a cozy terminal-style feed that scrolls like social media while staying fully crawlable.

## ADDED Requirements

### Requirement: Posts are written as files
Each post SHALL be one Markdown file in the repository with a title, publish date, short description and topic (games, tech or site), and optionally a last-updated date, a YouTube video ID and a draft flag. Draft posts SHALL NOT be published.

#### Scenario: Publishing a post
- **WHEN** a new post file is committed to `main` and the site deploys
- **THEN** the post appears at the top of the feed and has its own page

#### Scenario: Draft post
- **WHEN** a post is marked as a draft
- **THEN** it appears on no page, feed, sitemap or RSS feed of the deployed site

#### Scenario: Missing required field
- **WHEN** a post file lacks a title, date, description or valid topic
- **THEN** the build fails with a message naming the file and the missing field, and the previous deployment stays live

### Requirement: Post pages
Every published post SHALL have its own page at `/blog/<slug>`, where the slug comes from the post's file name and does not change when the title changes.

#### Scenario: Opening a post
- **WHEN** a visitor opens `/blog/<slug>`
- **THEN** they see the post's full text with its title as the page's single top-level heading, the author line (avatar, BaaWasTaken, publish date) and a link back to all posts

#### Scenario: Unknown slug
- **WHEN** a visitor opens a `/blog/` path that matches no published post
- **THEN** the site's not-found page is returned with status 404

### Requirement: Blog feed
The page `/blog` SHALL show published posts newest first, each in full: the author line, the title linking to the post's own page, the body and its video if it has one.

#### Scenario: Reading the feed
- **WHEN** a visitor opens `/blog`
- **THEN** the newest post is first and each later post is older than the one before it

#### Scenario: No posts yet
- **WHEN** no published posts exist
- **THEN** `/blog` shows a short message that posts are coming soon, with a link back to the homepage

### Requirement: Endless scrolling
With scripting available, the feed SHALL load older posts automatically as the visitor nears its end, with no next or previous buttons, until every post is shown. Loading SHALL be shown as a prompt line with a blinking cursor and announced to assistive technology.

#### Scenario: Reaching the end of the loaded posts
- **WHEN** a visitor scrolls near the last loaded post and older posts exist
- **THEN** a "Loading older posts" indicator appears and the next posts are appended below without a page reload

#### Scenario: Every post shown
- **WHEN** the oldest post has been loaded
- **THEN** loading stops and the feed ends with a short message saying that's every post

#### Scenario: Loading fails
- **WHEN** older posts cannot be loaded
- **THEN** the indicator is replaced by a link to the next numbered page, and posts already shown stay in place

### Requirement: Crawlable numbered pages
The feed SHALL also exist as numbered static pages (`/blog`, then `/blog/page/2`, `/blog/page/3`, …) each holding a fixed number of posts and linking to the next, so every post is reachable without scripting.

#### Scenario: Without JavaScript
- **WHEN** scripting is unavailable and a visitor reaches the end of a feed page with older posts remaining
- **THEN** a plain link to the next numbered page is shown

#### Scenario: Out-of-range page
- **WHEN** a visitor opens a numbered page beyond the last one
- **THEN** the not-found page is returned with status 404

### Requirement: Feed continues under a post
A post's own page SHALL be followed by a "Keep scrolling for older posts" marker and the posts older than it, with the same endless scrolling as the feed.

#### Scenario: Reading on from a shared link
- **WHEN** a visitor finishes a post opened from a shared link and keeps scrolling
- **THEN** the next older posts appear below it

#### Scenario: Oldest post
- **WHEN** the post is the oldest published post
- **THEN** no marker or older posts are shown below it

### Requirement: Topic tabs
The feed SHALL offer terminal tabs labelled `all`, `games`, `tech` and `this-site`. Each topic tab SHALL be its own page showing only that topic's posts, with the same scrolling and numbered pages as the full feed. The current tab SHALL be marked.

#### Scenario: Filtering by topic
- **WHEN** a visitor activates the `games` tab
- **THEN** they see only posts with the games topic, newest first, and the `games` tab is marked as current

#### Scenario: Empty topic
- **WHEN** a topic has no published posts
- **THEN** its page shows a short message saying there are no posts on that topic yet

### Requirement: Terminal look
Blog pages SHALL use the cozy terminal design: a terminal window on the slate room background with string lights, with the same cream casing as the homepage TV and the topic tabs along its top. The screen is dark slate with faint scanlines. Each post starts with a prompt line (`baa@cozy-corner:~/blog$ cat <slug>.md`), and titles are pixel headings marked with a jade `#`. Buttons and tabs use only brand colours.

#### Scenario: Brand colours
- **WHEN** the buttons, tabs and links on a blog page are inspected
- **THEN** each uses a colour from the brand palette

#### Scenario: Prompt lines are decoration
- **WHEN** a screen reader reads a post
- **THEN** it announces the post's title, author line and text, and not the prompt line

### Requirement: Things on the terminal
A small plant, a steaming mug and the homepage's sleeping Bengal cat (same sprite) SHALL sit on the top edge of the terminal casing, resting on it with no gap, drawn on the shared pixel grid and hidden from assistive technology. Their motion (tail, "z"s, steam, cursor blink) SHALL stop when the visitor prefers reduced motion.

#### Scenario: Sitting on the terminal
- **WHEN** a blog page is viewed at any width from 320px up
- **THEN** the bottoms of the cat, plant and mug touch the top edge of the terminal casing and none of them overlaps the tabs' text

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** the cat, steam and cursor show a single static frame

### Requirement: Reading typography
Headings on blog pages SHALL use the site's pixel font and body text SHALL use a soft monospace font served from the site's own origin, with body text at least 16 CSS px and lines no longer than about 70 characters. Bold text SHALL be shown as a solid yellow highlight block with dark text, like selected text in a terminal.

#### Scenario: Bold text
- **WHEN** a post contains bold text
- **THEN** it renders on a yellow highlight block with dark text and meets 4.5:1 contrast

#### Scenario: Fonts from own origin
- **WHEN** a blog page loads
- **THEN** every font is requested from `baawastaken.com`

### Requirement: Video in a post
A post with a video SHALL show it in a TV frame as a thumbnail served from `baawastaken.com` with the video title, both taken from the YouTube snapshot, and SHALL load the YouTube player from `youtube-nocookie.com` only after the visitor chooses to play. Building a post SHALL NOT contact YouTube.

#### Scenario: Video not captured yet
- **WHEN** a post is deployed before the sync has captured its video
- **THEN** the TV shows a plain screen with a "Watch on YouTube" link to that video, and the build succeeds

#### Scenario: Playing a post's video
- **WHEN** a visitor activates a post's TV
- **THEN** the thumbnail is replaced by the embedded player, which starts the video

#### Scenario: Without JavaScript
- **WHEN** scripting is unavailable and the visitor activates the TV
- **THEN** the browser opens the video on youtube.com

### Requirement: Blog RSS feed
The site SHALL publish an RSS feed of published posts at `/blog/rss.xml`, newest first, linked from every blog page's head.

#### Scenario: Subscribing
- **WHEN** a feed reader requests `/blog/rss.xml`
- **THEN** it receives valid RSS listing each published post's title, link, date and description

### Requirement: Site menu on blog pages
Every blog page SHALL show the same minimal site menu as the homepage, with Blog marked as the current section.

#### Scenario: Navigating home
- **WHEN** a visitor activates Home in the menu on a blog page
- **THEN** they arrive at `https://baawastaken.com/`

### Requirement: Blog accessibility and layout
Blog pages SHALL meet WCAG 2.2 AA, be usable from 320px to 1920px wide without horizontal scrolling, and hide decoration from assistive technology. On narrow screens the topic tabs SHALL wrap onto more rows instead of scrolling sideways.

#### Scenario: Phone width
- **WHEN** a blog page is viewed at 375px wide
- **THEN** the terminal fills the width, the tabs wrap above the screen, long prompt lines wrap, and no text is clipped

#### Scenario: Keyboard-only visitor
- **WHEN** a visitor tabs through a blog page
- **THEN** focus moves through the menu, tabs, post titles and links in reading order with a visible outline
