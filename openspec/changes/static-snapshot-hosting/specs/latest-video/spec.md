# Spec Delta

## ADDED Requirements

### Requirement: Freshness
A newly published long-form video SHALL appear on the homepage without any manual step, typically within about 10–25 minutes and normally within 60 minutes of being published, through the scheduled YouTube sync and the deploy it triggers.

#### Scenario: New upload
- **WHEN** a new long-form video is published on the channel
- **THEN** the homepage shows it after the next sync and deploy, with no manual commit or deploy

## MODIFIED Requirements

### Requirement: Source of the latest video
The latest video SHALL be the newest long-form upload of channel `UC-MLQMe0PJR6v2d14VVb5fg` as recorded in the committed YouTube snapshot, skipping YouTube Shorts, and SHALL be present in the homepage HTML as built (not loaded by browser scripts or added by per-request code). The build SHALL NOT contact YouTube.

#### Scenario: Feed reachable
- **WHEN** the sync has captured a video from the feed and a visitor requests the homepage
- **THEN** the HTML they receive already contains that video's title, publish date, link and thumbnail

#### Scenario: Newest upload is a Short
- **WHEN** the most recent upload is a YouTube Short and an older long-form upload exists
- **THEN** the TV shows the newest long-form upload and the Short is not shown

#### Scenario: Building offline
- **WHEN** the site is built with no network access
- **THEN** the build succeeds and the TV shows the video named in the snapshot

### Requirement: Same-origin thumbnail
The video thumbnail SHALL be served from `baawastaken.com` as a static file stored with the site. No page SHALL request images from YouTube's thumbnail host.

#### Scenario: Valid thumbnail request
- **WHEN** the browser requests the current video's thumbnail
- **THEN** the image is returned from `baawastaken.com` as a static file with caching headers

#### Scenario: Invalid ID
- **WHEN** a thumbnail path is requested for a video ID the site has not stored
- **THEN** the response is 404 and no request is made to YouTube

#### Scenario: No third-party image requests
- **WHEN** the homepage is loaded and the visitor does not play the video
- **THEN** no request goes to a YouTube host

### Requirement: Feed failure fallback
If YouTube cannot be read, the site SHALL keep showing the last captured video unchanged. If no video has ever been captured, the TV SHALL show a "Watch on YouTube" link to the channel. YouTube problems SHALL never cause an error page, a failed build or a failed deploy.

#### Scenario: Feed down, build snapshot exists
- **WHEN** the sync cannot read the feed for several hours and a video was captured earlier
- **THEN** visitors keep seeing that video and every page responds with status 200

#### Scenario: Feed down, no snapshot
- **WHEN** the snapshot names no video
- **THEN** the TV shows a "Watch on YouTube" link to `https://www.youtube.com/@BaaWasTaken` and the page responds with status 200

#### Scenario: Feed unreachable during build
- **WHEN** the site is built while YouTube is unreachable
- **THEN** the build succeeds using the committed snapshot, because the build never contacts YouTube

#### Scenario: Malformed feed
- **WHEN** the feed responds but contains no parseable long-form entries
- **THEN** the snapshot is left unchanged, as if the feed were unreachable

## REMOVED Requirements

### Requirement: Freshness and feed caching
**Reason**: There is no longer any per-request feed fetch or edge cache. Freshness now comes from the scheduled sync.
**Migration**: Replaced by the new "Freshness" requirement in this capability and by the `youtube-sync` capability.
