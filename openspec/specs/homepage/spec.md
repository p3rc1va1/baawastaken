# homepage Specification

## Purpose

The public homepage of the BaaWasTaken brand: a single cozy pixel-art page that introduces the creator, links to every platform they publish on, and gives visitors a way to make contact.

## Requirements

### Requirement: Brand identity header
The homepage SHALL show the BaaWasTaken avatar, the wordmark `BaaWasTaken`, capitalised exactly like that, as the page's single top-level heading, and a one-sentence tagline describing the channel.

#### Scenario: Visitor opens the homepage
- **WHEN** a visitor loads `https://baawastaken.com/`
- **THEN** the page shows the avatar with alternative text, an `h1` reading `BaaWasTaken`, and the tagline beneath it

#### Scenario: Avatar stays crisp
- **WHEN** the avatar is displayed at any supported viewport width
- **THEN** it is scaled by a whole-number factor of its source pixel size and rendered without smoothing

### Requirement: Platform links
The homepage SHALL link to exactly these seven destinations: YouTube `https://www.youtube.com/@BaaWasTaken`, Twitch `https://www.twitch.tv/baawastaken`, Kick `https://kick.com/baawastaken`, Discord `https://discord.gg/rm4HDpmN9g`, Instagram `https://www.instagram.com/baawastakenyt`, TikTok `https://www.tiktok.com/@baawastaken`, Ko-fi `https://ko-fi.com/baawastaken`.

#### Scenario: Every platform is reachable
- **WHEN** a visitor views the platform links
- **THEN** seven links are present, each showing the platform name, a short description and a pixel-art logo, and each pointing to the URL listed above

#### Scenario: Links open the platform
- **WHEN** a visitor activates a platform link
- **THEN** the browser navigates to that platform's page, and external links carry `rel="noopener"`

### Requirement: Platform link grouping
The platform links SHALL be grouped into two shelves: the first (watch, follow and support) holds YouTube, Instagram, TikTok and Ko-fi; the second (live streams and community) holds Twitch, Kick and Discord. Ko-fi SHALL be visually distinguished as the support option.

#### Scenario: Shelf order on desktop
- **WHEN** the page is viewed at 1280px wide
- **THEN** YouTube, Instagram, TikTok, Ko-fi appear left to right on the upper shelf and Twitch, Kick, Discord on the lower shelf

### Requirement: Contact card
The homepage SHALL include a "Say hi" contact section with two addresses, shown in this order: a friendly one for fans, `hello@baawastaken.com`, and one for business inquiries (sponsorships, collabs, press), `business@baawastaken.com`. Each SHALL be a `mailto:` link and have its own button that copies that address to the clipboard.

#### Scenario: Two audiences, two addresses
- **WHEN** a visitor reads the contact section
- **THEN** they see a fan section ("Just saying hi?") with `hello@baawastaken.com`, followed by a business section ("Business inquiries") with `business@baawastaken.com`, and no other contact address

#### Scenario: Email via mail client
- **WHEN** a visitor activates either address
- **THEN** their mail client opens a new message addressed to that address

#### Scenario: Copy email
- **WHEN** a visitor activates the Copy button next to an address in a browser with clipboard access
- **THEN** that address is placed on the clipboard, that button's label changes to "Copied" for a few seconds, and the copy is announced to assistive technology; each Copy button has a different accessible name that includes its address

#### Scenario: Scripting unavailable
- **WHEN** JavaScript is disabled or clipboard access is denied
- **THEN** both addresses remain visible as text and as working `mailto:` links, and no broken copy control is shown

#### Scenario: Addresses fit on a phone
- **WHEN** the page is viewed at any width from 320px up
- **THEN** each address is shown on a single line inside its button

### Requirement: Pixel art consistency
All decorative and logo artwork SHALL be drawn on one shared pixel grid where one art pixel equals four CSS pixels at desktop size, lit from the top-left, and rendered with hard edges (no smoothing or blur).

#### Scenario: Uniform logo slots
- **WHEN** the seven platform tiles are compared
- **THEN** every logo occupies an identical 12×12 art-pixel slot (48×48 CSS px) in the same position within its tile

### Requirement: Decorative cozy scene
The homepage SHALL surround the content with an original pixel-art room: wallpaper, string lights, a wall clock, a night window, a plant, books and a mug on the lower shelf, a sleeping Bengal cat and succulent on the TV, and a wooden floor with a rug and controller. Decoration SHALL be hidden from assistive technology.

#### Scenario: Decoration is silent to screen readers
- **WHEN** the page is read by a screen reader
- **THEN** none of the decorative scene elements are announced; only the header, links, latest video, contact card and footer are

#### Scenario: Bengal cat
- **WHEN** a visitor looks at the TV
- **THEN** a sleeping cat with a golden coat, dark rosette spots and a ringed tail lies on top of it

### Requirement: Ambient motion
The scene SHALL animate subtly using stepped, frame-like motion (twinkling lights, pendulum, steam, cat tail and "z"s, drifting cloud, occasional shooting star, TV scanline, dust motes), and SHALL stop all non-essential motion when the visitor prefers reduced motion.

#### Scenario: Default motion
- **WHEN** a visitor with no motion preference views the page
- **THEN** the ambient animations play continuously without shifting the layout or covering content

#### Scenario: Reduced motion
- **WHEN** the visitor's system requests reduced motion
- **THEN** no ambient animation runs, and each animated element shows a single static frame

### Requirement: Responsive layout
The homepage SHALL be fully usable from 320px to 1920px wide without horizontal scrolling, keeping all seven links, the latest video and the contact card visible in a single column on phones.

#### Scenario: Phone width
- **WHEN** the page is viewed at 375px wide
- **THEN** the header stacks vertically with the `BaaWasTaken` wordmark on a single line, the platform tiles show two per row on shelves, the TV and contact card follow below at full width, and no content is clipped or overlapping

#### Scenario: Tablet width
- **WHEN** the page is viewed at 768px wide
- **THEN** the shelves keep their tiles readable and the TV moves below the shelves instead of beside them

### Requirement: Accessibility
The homepage SHALL meet WCAG 2.2 AA: text contrast of at least 4.5:1, a visible keyboard focus indicator on every interactive element, a logical tab order (header, platform links, latest video, contact), and touch targets of at least 44×44 CSS px.

#### Scenario: Keyboard-only visitor
- **WHEN** a visitor tabs through the page
- **THEN** focus moves through every link and button in reading order and each focused element shows a clearly visible outline

### Requirement: Page metadata and sharing
The homepage SHALL provide a descriptive title, meta description, canonical URL `https://baawastaken.com/`, theme color, favicon derived from the avatar, and Open Graph/Twitter card metadata with a 1200×630 pixel-art share image.

#### Scenario: Link shared on social media
- **WHEN** the homepage URL is pasted into a platform that reads Open Graph tags
- **THEN** the preview shows the BaaWasTaken title, description and share image

### Requirement: No tracking at launch
The homepage SHALL load no analytics, advertising or third-party tracking scripts, and SHALL serve its fonts from its own origin.

#### Scenario: Network requests on first load
- **WHEN** the homepage is loaded and the visitor does not interact with the video
- **THEN** every request goes to `baawastaken.com`, including the latest video thumbnail, which is served through `baawastaken.com`
