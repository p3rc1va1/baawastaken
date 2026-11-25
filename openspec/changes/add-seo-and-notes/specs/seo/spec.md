# Spec Delta

## Purpose

Defines how baawastaken.com describes itself to search engines and AI assistants, so that the site is recognised as the home of the BaaWasTaken identity and every indexable page can be found and understood.

## ADDED Requirements

### Requirement: Identity structured data
The homepage SHALL include JSON-LD structured data describing BaaWasTaken as a person, with the site URL, the avatar image, a short description, and a `sameAs` list containing exactly the platform URLs shown on the homepage.

#### Scenario: Profiles tied to one identity
- **WHEN** a crawler parses the homepage's structured data
- **THEN** it finds one person named `BaaWasTaken` whose `sameAs` list holds the seven platform URLs from the homepage platform links, and no others

#### Scenario: Valid markup
- **WHEN** the homepage is checked with a schema.org structured data validator
- **THEN** it reports no errors

#### Scenario: Platform list changes
- **WHEN** a platform link is added to or removed from the homepage
- **THEN** the `sameAs` list changes with it, without being edited separately

### Requirement: Site name structured data
The homepage SHALL include JSON-LD structured data naming the website `BaaWasTaken` with the URL `https://baawastaken.com/`, so search results can show the brand name as the site name.

#### Scenario: Site name present
- **WHEN** a crawler parses the homepage's structured data
- **THEN** it finds a website named `BaaWasTaken` at `https://baawastaken.com/`

### Requirement: Post structured data
Every single-post page SHALL include JSON-LD structured data marking it as a blog post, with its headline, description, publish date, last-updated date when set, author BaaWasTaken, and canonical URL.

#### Scenario: Post page markup
- **WHEN** a crawler parses a post's page
- **THEN** it finds one blog post whose headline equals the post's title and whose author is BaaWasTaken

### Requirement: Per-page metadata
Every indexable page SHALL have its own title, meta description, canonical URL, and Open Graph and Twitter card tags matching that page. A page SHALL NOT reuse the homepage's title or canonical URL.

#### Scenario: Post page shared on social media
- **WHEN** a post's URL is pasted into a platform that reads Open Graph tags
- **THEN** the preview shows that post's title and description, not the homepage's

#### Scenario: Unique titles
- **WHEN** all indexable pages are listed
- **THEN** no two of them have the same title

### Requirement: Hidden pages
Pages not meant for search results (the not-found page and the share-image source page) SHALL carry `noindex`, SHALL NOT declare a canonical URL, and SHALL NOT appear in the sitemap.

#### Scenario: Not-found page
- **WHEN** a crawler receives the not-found page
- **THEN** it finds a `noindex` directive and no canonical link

### Requirement: Sitemap
The site SHALL publish an XML sitemap listing every indexable page (homepage, blog feed and its numbered pages, topic pages and every post page) by its canonical URL, regenerated on every build.

#### Scenario: New post published
- **WHEN** a new post is added and the site is rebuilt
- **THEN** the post's URL appears in the sitemap

#### Scenario: Sitemap is advertised
- **WHEN** a crawler reads `https://baawastaken.com/robots.txt`
- **THEN** it allows all crawlers and names the sitemap's URL

### Requirement: Crawler access
The site SHALL NOT block search engine or AI assistant crawlers through `robots.txt` or page directives on indexable pages.

#### Scenario: robots.txt
- **WHEN** any user agent reads `robots.txt`
- **THEN** no indexable path is disallowed
