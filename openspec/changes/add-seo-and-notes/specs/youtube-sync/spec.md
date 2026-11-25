# Spec Delta

## ADDED Requirements

### Requirement: Videos named by posts
The sync SHALL also capture the title and thumbnail of every video named by a published post, Shorts included, and SHALL keep them until no published post names that video.

#### Scenario: Post with a video pushed
- **WHEN** a post naming a video that is not yet captured is pushed to `main`
- **THEN** the next sync run captures the video's title and thumbnail and commits them, and the following deploy shows them in the post

#### Scenario: Video removed from a post
- **WHEN** no published post names a video any more and it is not otherwise shown
- **THEN** the next sync run removes its stored thumbnail and snapshot entry

#### Scenario: Video unavailable
- **WHEN** a post names a video that is private, deleted or does not exist
- **THEN** the sync logs a warning naming the post, captures nothing for it, and still commits any other changes
