# Spec Delta

## ADDED Requirements

### Requirement: Site menu
The homepage header SHALL include a minimal site menu linking to Home (`/`) and Posts (`/blog`), with Home marked as the current page. The menu SHALL use the site's pixel font and brand colours and SHALL NOT replace or push aside the avatar and wordmark.

#### Scenario: Opening the blog from the menu
- **WHEN** a visitor activates Blog in the homepage menu
- **THEN** they arrive at `/blog`

#### Scenario: Current page marked
- **WHEN** a visitor views the homepage menu
- **THEN** Home is visually marked and exposed to assistive technology as the current page

### Requirement: Latest post card
The homepage SHALL show the newest published post as a small cozy terminal window under the night window, matching the blog pages. It SHALL show a `cat latest.md` prompt, the publish date, the post's title and its short description with bold text highlighted, and a "Read in Blog" control. The whole card SHALL link to `/blog`.

#### Scenario: Visitor opens the latest post
- **WHEN** a visitor activates the latest post card
- **THEN** they arrive at `/blog`, where that post is first in the feed

#### Scenario: New post published
- **WHEN** a newer post is published and the site deploys
- **THEN** the card shows the newer post

#### Scenario: No posts yet
- **WHEN** no published posts exist
- **THEN** no latest post card is shown and the layout has no empty gap

#### Scenario: Accessible name
- **WHEN** a screen reader reaches the card
- **THEN** it is announced as a link that names the latest post's title and says it opens Posts

## MODIFIED Requirements

### Requirement: Brand identity header
The homepage SHALL show the BaaWasTaken avatar, the wordmark `BaaWasTaken`, capitalised exactly like that, as the page's single top-level heading, a one-sentence tagline describing the channel, and below it a short plain-text about paragraph (two or three sentences) stating who BaaWasTaken is and what the channel covers.

#### Scenario: Visitor opens the homepage
- **WHEN** a visitor loads `https://baawastaken.com/`
- **THEN** the page shows the avatar with alternative text, an `h1` reading `BaaWasTaken`, the tagline beneath it and the about paragraph beneath the tagline

#### Scenario: Avatar stays crisp
- **WHEN** the avatar is displayed at any supported viewport width
- **THEN** it is scaled by a whole-number factor of its source pixel size and rendered without smoothing

#### Scenario: About text is real text
- **WHEN** the homepage HTML is read without styles or scripts
- **THEN** the about paragraph is present as visible text in the page, not inside an image or hidden element

### Requirement: Decorative cozy scene
The homepage SHALL surround the content with an original pixel-art room: wallpaper, string lights, a wall clock, a night window, a plant, books and a mug on the lower shelf, a sleeping Bengal cat and succulent on the TV, and a wooden floor with a rug and controller. Decoration SHALL be hidden from assistive technology.

#### Scenario: Decoration is silent to screen readers
- **WHEN** the page is read by a screen reader
- **THEN** none of the decorative scene elements are announced; only the header (with its menu and about text), links, latest video, latest post card, contact card and footer are

#### Scenario: Bengal cat
- **WHEN** a visitor looks at the TV
- **THEN** a sleeping cat with a golden coat, dark rosette spots and a ringed tail lies on top of it

### Requirement: Responsive layout
The homepage SHALL be fully usable from 320px to 1920px wide without horizontal scrolling, keeping the menu, all seven links, the latest video, the latest post card and the contact card visible in a single column on phones.

#### Scenario: Phone width
- **WHEN** the page is viewed at 375px wide
- **THEN** the header stacks vertically with the `BaaWasTaken` wordmark on a single line and the menu wrapping beneath it, the platform tiles show two per row on shelves, the TV, latest post card and contact card follow below at full width, and no content is clipped or overlapping

#### Scenario: Tablet width
- **WHEN** the page is viewed at 768px wide
- **THEN** the shelves keep their tiles readable and the TV moves below the shelves instead of beside them

#### Scenario: Desktop width
- **WHEN** the page is viewed at 1280px wide
- **THEN** the TV, night window and latest post card sit in the right-hand column in that order, raised so the column starts above the top shelf

#### Scenario: Card clear of the floor
- **WHEN** the page is viewed at any width from 1024px up
- **THEN** the latest post card ends above the wooden floor and footer, with no overlap

### Requirement: Accessibility
The homepage SHALL meet WCAG 2.2 AA: text contrast of at least 4.5:1, a visible keyboard focus indicator on every interactive element, a logical tab order (header and menu, platform links, latest video, latest post, contact), and touch targets of at least 44×44 CSS px.

#### Scenario: Keyboard-only visitor
- **WHEN** a visitor tabs through the page
- **THEN** focus moves through every link and button in reading order and each focused element shows a clearly visible outline

### Requirement: Page metadata and sharing
The homepage SHALL provide the title `BaaWasTaken | Cozy pixel art, tech and games`, a meta description, canonical URL `https://baawastaken.com/`, theme color, favicon derived from the avatar, and Open Graph/Twitter card metadata with a 1200×630 pixel-art share image.

#### Scenario: Link shared on social media
- **WHEN** the homepage URL is pasted into a platform that reads Open Graph tags
- **THEN** the preview shows the BaaWasTaken title, description and share image

#### Scenario: Search result title
- **WHEN** the homepage HTML is inspected
- **THEN** its `<title>` reads `BaaWasTaken | Cozy pixel art, tech and games`
