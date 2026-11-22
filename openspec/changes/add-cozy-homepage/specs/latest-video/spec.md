# Spec Delta

## Purpose

Shows the newest upload from the BaaWasTaken YouTube channel on the homepage, kept fresh within about half an hour of publishing, without client-side scripts for loading the data, and degrading gracefully when YouTube cannot be reached.

## ADDED Requirements

### Requirement: Source of the latest video
The latest video SHALL be taken from the public YouTube RSS feed for channel `UC-MLQMe0PJR6v2d14VVb5fg`, choosing the entry with the most recent publish date, and SHALL be present in the homepage HTML as delivered by the server (not loaded by browser scripts).

#### Scenario: Feed reachable
- **WHEN** a visitor requests the homepage and the feed returns valid entries
- **THEN** the HTML they receive already contains the newest entry's title, publish date, link and thumbnail

### Requirement: Freshness and feed caching
Feed results SHALL be cached at the edge for no more than 30 minutes, so a newly published video appears on the homepage within about 30 minutes without any deploy, and the feed is fetched at most about once per 30 minutes per edge location.

#### Scenario: New upload
- **WHEN** a new video is published on the channel
- **THEN** the homepage shows it within about 30 minutes, with no commit or deploy

#### Scenario: Many visitors
- **WHEN** many visitors load the homepage within the same 30-minute window
- **THEN** they are served from the cached feed result rather than each triggering a fetch from YouTube

### Requirement: Same-origin thumbnail
The video thumbnail SHALL be served from `baawastaken.com`. The thumbnail endpoint SHALL only accept syntactically valid YouTube video IDs and SHALL only fetch from YouTube's thumbnail host, so it cannot be used as a general-purpose proxy.

#### Scenario: Valid thumbnail request
- **WHEN** the browser requests the thumbnail for the current video
- **THEN** the image is returned from `baawastaken.com` with caching headers

#### Scenario: Invalid ID
- **WHEN** a request is made to the thumbnail endpoint with a value that is not an 11-character YouTube ID
- **THEN** the response is 404 and no upstream request is made

### Requirement: Latest video presentation
The homepage SHALL show the latest video inside the TV as its thumbnail with the title and publish date beneath, and SHALL load the YouTube player only after the visitor chooses to play.

#### Scenario: Visitor plays the video
- **WHEN** a visitor activates the play control on the TV
- **THEN** the thumbnail is replaced by an embedded player from `youtube-nocookie.com` that starts the video

#### Scenario: Without JavaScript
- **WHEN** JavaScript is unavailable and the visitor activates the thumbnail
- **THEN** the browser opens the video on youtube.com

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the TV
- **THEN** the control is announced as playing the named video, including its title

### Requirement: Feed failure fallback
If the feed cannot be fetched or parsed, the homepage SHALL still load normally, showing the video captured at the last build if one exists, otherwise a "Watch on YouTube" link to the channel. Feed problems SHALL never cause an error page or a failed build.

#### Scenario: Feed down, build snapshot exists
- **WHEN** a visitor requests the homepage while the feed is unreachable and the last build captured a video
- **THEN** the page shows that build-time video and responds with status 200

#### Scenario: Feed down, no snapshot
- **WHEN** the feed is unreachable and the build captured no video
- **THEN** the TV shows a "Watch on YouTube" link to `https://www.youtube.com/@BaaWasTaken` and the page responds with status 200

#### Scenario: Malformed feed
- **WHEN** the feed responds but contains no parseable video entries
- **THEN** the same behavior as an unreachable feed applies

#### Scenario: Feed unreachable during build
- **WHEN** the site is built while the feed is unreachable
- **THEN** the build succeeds with no snapshot
