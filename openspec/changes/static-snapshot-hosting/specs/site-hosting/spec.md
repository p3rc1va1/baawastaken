# Spec Delta

## ADDED Requirements

### Requirement: Reserved path for interactive features
Code that runs per request SHALL be limited to paths under `/api/*`, used only for interactive features such as view counts, likes or comments. No page SHALL depend on `/api/*` to render or to show its main content, and a failing or rate-limited `/api/*` SHALL leave every page fully usable.

#### Scenario: Interactive feature unavailable
- **WHEN** a future `/api/*` endpoint errors or its free limit is reached
- **THEN** pages still load with status 200 and only the interactive element is hidden or shows a short notice

#### Scenario: No interactive features yet
- **WHEN** the site has no `/api/*` endpoints
- **THEN** the deployment contains no per-request code at all

### Requirement: Deploy on content sync
A push to `main` made by the scheduled YouTube sync SHALL build and deploy the site exactly like any other push.

#### Scenario: Sync commit
- **WHEN** the YouTube sync pushes a snapshot commit
- **THEN** the site is rebuilt and the new snapshot is live within a few minutes

## MODIFIED Requirements

### Requirement: Static delivery with minimal edge logic
All pages and assets SHALL be served from pre-built static files, with no per-request code run for any page view. The site SHALL stay within Cloudflare's free tier with no daily limit on page views.

#### Scenario: Asset request
- **WHEN** a font, stylesheet, image or other built asset is requested
- **THEN** it is served directly from static assets without invoking custom code

#### Scenario: Homepage request
- **WHEN** a visitor requests `https://baawastaken.com/`
- **THEN** the pre-built homepage file is served without invoking custom code

#### Scenario: Edge logic fails
- **WHEN** per-request code under `/api/*` throws or times out
- **THEN** every page is still served from its static file with status 200

#### Scenario: Heavy traffic
- **WHEN** the site receives far more than 100,000 page views in a day
- **THEN** every page view is still served normally at no cost
