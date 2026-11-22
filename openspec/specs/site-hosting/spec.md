# site-hosting Specification

## Purpose

Defines how the BaaWasTaken site is served to the public and kept up to date: static hosting on the brand's own domain, with automatic deploys and minimal edge logic.

## Requirements

### Requirement: Custom domain over HTTPS
The site SHALL be served at `https://baawastaken.com/` over HTTPS with a valid certificate, and plain HTTP requests SHALL redirect to HTTPS.

#### Scenario: Apex domain
- **WHEN** a visitor requests `http://baawastaken.com/`
- **THEN** they are redirected to `https://baawastaken.com/` and the homepage loads

### Requirement: www redirect
Requests to `www.baawastaken.com` SHALL permanently redirect (301) to the same path on `https://baawastaken.com`.

#### Scenario: www visitor
- **WHEN** a visitor requests `https://www.baawastaken.com/`
- **THEN** they receive a 301 redirect to `https://baawastaken.com/`

### Requirement: Static delivery with minimal edge logic
All pages and assets SHALL be served from pre-built static files. The only per-request code SHALL be the latest-video step (adding feed data to the homepage HTML and serving the video thumbnail). The site SHALL stay within Cloudflare's free tier.

#### Scenario: Asset request
- **WHEN** a font, stylesheet, image or other built asset is requested
- **THEN** it is served directly from static assets without invoking custom code

#### Scenario: Edge logic fails
- **WHEN** the latest-video step throws or times out
- **THEN** the visitor receives the unmodified pre-built homepage with status 200

### Requirement: Not-found handling
Requests for paths that do not exist SHALL return HTTP 404 with a styled pixel-art "not found" page linking back to the homepage.

#### Scenario: Unknown path
- **WHEN** a visitor requests `https://baawastaken.com/nope`
- **THEN** the response status is 404 and the page offers a link back to `/`

### Requirement: Automatic deploy on push
Every push to the `main` branch of the site's repository SHALL build and deploy the site to production without manual steps; a failing build SHALL leave the previous deployment live.

#### Scenario: Successful push
- **WHEN** a commit is pushed to `main` and the build passes
- **THEN** the new version is live on `baawastaken.com` within a few minutes

#### Scenario: Broken build
- **WHEN** a commit pushed to `main` fails to build
- **THEN** the previously deployed version keeps serving and the failure is visible in the deploy log

### Requirement: Caching
Fingerprinted static assets (scripts, styles, fonts, images with content hashes) SHALL be cacheable for at least one year, and HTML SHALL be revalidated so new deploys are visible promptly.

#### Scenario: Returning visitor after a deploy
- **WHEN** a visitor reloads the homepage after a new deployment
- **THEN** they receive the new HTML and any changed assets, and unchanged hashed assets come from cache
