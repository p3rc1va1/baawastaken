# Spec Delta

## Purpose

Gives each game the channel covers its own page, built automatically from the user's YouTube playlist for that game, so viewers and search engines can find a whole series in order.

## ADDED Requirements

### Requirement: Games come from playlists
The site SHALL keep a list of games in the repository, each with a URL slug, a display name, one YouTube playlist ID and a short written intro. A game's episodes SHALL be the public videos in its playlist, in playlist order.

#### Scenario: Adding a game
- **WHEN** a new game with its playlist ID and intro is added to the list and the site deploys
- **THEN** it gets its own page, a channel tab and an entry on the videos overview

#### Scenario: Reordering episodes
- **WHEN** the user reorders videos in a game's playlist on YouTube
- **THEN** after the next sync and deploy the episode guide shows the new order

#### Scenario: Private or deleted video
- **WHEN** a playlist contains a private or deleted video
- **THEN** it is left out of the page without an error

### Requirement: Game page
Each game SHALL have a page at `/videos/<slug>` with the game's name as its single top-level heading, its intro, a "Watch from Part 1" button opening the first episode on YouTube within the playlist, and a "Playlist on YouTube" button opening the playlist.

#### Scenario: Opening a game page
- **WHEN** a visitor opens `/videos/replaced`
- **THEN** they see the heading "Replaced", the intro, both buttons, the featured newest episode and the episode guide

#### Scenario: Unknown game
- **WHEN** a visitor opens a `/videos/` path that matches no game
- **THEN** the not-found page is returned with status 404

### Requirement: Featured newest episode
The game page SHALL show the game's most recently published episode on a large TV as a thumbnail served from `baawastaken.com`, labelled "Now showing" with its part number, and SHALL load the YouTube player from `youtube-nocookie.com` only after the visitor chooses to play.

#### Scenario: Playing the featured episode
- **WHEN** a visitor activates the play control on the TV
- **THEN** the thumbnail is replaced by the embedded player, which starts that episode

#### Scenario: Without JavaScript
- **WHEN** scripting is unavailable and the visitor activates the TV
- **THEN** the browser opens the episode on youtube.com

### Requirement: Episode guide
The game page SHALL list every episode oldest first (playlist order), each row showing its part number, title, publish date and thumbnail, linking to that video on YouTube within the playlist. The newest episode's row SHALL be highlighted in jade.

#### Scenario: Reading the guide
- **WHEN** a visitor reads the episode guide of a game with six episodes
- **THEN** rows run from Part 1 to Part 6 and the Part 6 row is highlighted

#### Scenario: Narrow screen
- **WHEN** the guide is viewed at 375px wide
- **THEN** thumbnails are hidden and each row shows the part number, title and date without horizontal scrolling

### Requirement: Empty playlist
A game whose playlist has no public videos SHALL still have its page, showing its name, intro and a short message that the first episode is coming soon, with no TV or guide.

#### Scenario: New series announced
- **WHEN** a game's playlist exists but is empty
- **THEN** its page shows the "coming soon" message and responds with status 200

### Requirement: Videos overview
The page `/videos` SHALL list every game with its name, the newest episode's thumbnail, its episode count and the date of its newest episode, most recently updated game first, each linking to its game page.

#### Scenario: Opening the overview
- **WHEN** a visitor opens `/videos`
- **THEN** each game appears once, ordered by its newest episode date, newest first

### Requirement: Channel tabs
Every game page and the overview SHALL show channel tabs: one per game plus "All videos", with the current one marked.

#### Scenario: Switching games
- **WHEN** a visitor on the Replaced page activates the Deadlock tab
- **THEN** they arrive at `/videos/deadlock` and the Deadlock tab is marked as current

### Requirement: TV guide look
Videos pages SHALL use the TV guide design: a dark slate room, the cream TV casing with scanlines, the episode guide panel with a wood header, the site's pixel font throughout, and buttons and tabs coloured only from the brand palette. Scanline and LED motion SHALL stop when the visitor prefers reduced motion.

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** no scanline or LED animation runs on videos pages

### Requirement: Game page search data
Each game page SHALL have its own title naming the game and the word "playthrough" or "videos", a description drawn from its intro, a canonical URL, and JSON-LD describing the page and its featured episode as a video. Every game page and the overview SHALL be listed in the sitemap.

#### Scenario: Search title
- **WHEN** the Replaced page's HTML is inspected
- **THEN** its `<title>` names Replaced and BaaWasTaken and differs from every other page's title

#### Scenario: Sitemap
- **WHEN** a game is added and the site is rebuilt
- **THEN** its page's URL appears in the sitemap

### Requirement: Videos accessibility and layout
Videos pages SHALL meet WCAG 2.2 AA, be usable from 320px to 1920px wide without horizontal scrolling, show the site menu with Videos marked current, and hide decoration from assistive technology.

#### Scenario: Keyboard-only visitor
- **WHEN** a visitor tabs through a game page
- **THEN** focus moves through the menu, channel tabs, TV, buttons and guide rows in reading order with a visible outline

### Requirement: Playlist data from the snapshot
Videos pages SHALL be built only from playlist data in the committed YouTube snapshot. The build SHALL NOT contact YouTube, and a game whose playlist is not yet in the snapshot SHALL build with the "coming soon" state.

#### Scenario: Building offline
- **WHEN** the site is built with no network access
- **THEN** every game page is built from the snapshot and the build succeeds

#### Scenario: Game added before the next sync
- **WHEN** a new game is pushed and deployed before the sync has captured its playlist
- **THEN** its page shows the "coming soon" message, and after the next sync commit deploys, it shows the episodes

#### Scenario: New episode added to a playlist
- **WHEN** the owner adds a video to a game's playlist on YouTube and pushes nothing
- **THEN** the game page shows it after the next sync and deploy, typically within about 10–25 minutes
