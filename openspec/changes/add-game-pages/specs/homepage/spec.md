# Spec Delta

## MODIFIED Requirements

### Requirement: Site menu
The homepage header SHALL include a minimal site menu linking to Home (`/`), Videos (`/videos`) and Blog (`/blog`), in that order, with Home marked as the current page. The menu SHALL use the site's pixel font and brand colours and SHALL NOT replace or push aside the avatar and wordmark.

#### Scenario: Opening the blog from the menu
- **WHEN** a visitor activates Blog in the homepage menu
- **THEN** they arrive at `/blog`

#### Scenario: Opening videos from the menu
- **WHEN** a visitor activates Videos in the homepage menu
- **THEN** they arrive at `/videos`

#### Scenario: Current page marked
- **WHEN** a visitor views the homepage menu
- **THEN** Home is visually marked and exposed to assistive technology as the current page
