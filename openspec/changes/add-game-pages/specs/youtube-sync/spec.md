# Spec Delta

## ADDED Requirements

### Requirement: Game playlists
On every run the sync SHALL read the playlist of every game in the repository's game list through the YouTube Data API, and store each playlist's public videos in playlist order with their ID, title and publish date, together with their thumbnails. Private and deleted videos SHALL be left out.

#### Scenario: Video added to a playlist
- **WHEN** the owner adds a video to a game's playlist
- **THEN** the next sync run stores it at its playlist position with its thumbnail and commits the change

#### Scenario: Playlist reordered
- **WHEN** the owner reorders a playlist
- **THEN** the next sync run stores the new order

#### Scenario: Private or deleted video
- **WHEN** a playlist contains a private or deleted video
- **THEN** it is left out of the snapshot

#### Scenario: Playlist cannot be read
- **WHEN** a playlist request fails or the API key is missing or rejected
- **THEN** the run changes nothing, as for any other YouTube failure, and its log names the game

### Requirement: API key stays secret
The YouTube Data API key SHALL be stored only as an encrypted GitHub Actions secret. It SHALL NOT appear in the repository, the snapshot, any deployed file or the run logs.

#### Scenario: Searching for the key
- **WHEN** the repository, the deployed site and the sync logs are searched for the key's value
- **THEN** it is not found
