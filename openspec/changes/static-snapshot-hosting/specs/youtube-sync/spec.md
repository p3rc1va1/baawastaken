# Spec Delta

## Purpose

Keeps the site's copy of YouTube data (videos and thumbnails) up to date by capturing it into the repository on a schedule, so the deployed site can be fully static while still showing new uploads within minutes.

## ADDED Requirements

### Requirement: Scheduled sync
A scheduled job SHALL check YouTube about every 5 minutes, at minutes offset from the top of the hour, and SHALL also be startable by hand. Runs SHALL never overlap, and the job SHALL use only free services.

#### Scenario: Regular checks
- **WHEN** a day passes with GitHub's scheduler working normally
- **THEN** the job has run roughly every 5 minutes, allowing for GitHub's best-effort delays

#### Scenario: Manual run
- **WHEN** the owner starts the job by hand
- **THEN** it runs immediately with the same behaviour as a scheduled run

#### Scenario: Overlapping start
- **WHEN** a run is due while the previous run is still in progress
- **THEN** the new run waits or is skipped and never commits at the same time as the other

### Requirement: Snapshot of the latest video
The job SHALL store the newest long-form upload from the channel's public RSS feed (video ID, title and publish date) in a snapshot file in the repository, skipping YouTube Shorts.

#### Scenario: New long-form upload
- **WHEN** a new long-form video appears in the feed
- **THEN** the snapshot names that video and its thumbnail is stored in the repository

#### Scenario: New Short
- **WHEN** the only new entry in the feed is a YouTube Short
- **THEN** the snapshot is unchanged

### Requirement: Commit only on change
The job SHALL commit to `main` only when the snapshot or stored thumbnails differ from what is already committed, with a commit message that marks it as an automated YouTube sync. It SHALL publish changes by pushing, so the normal deploy runs.

#### Scenario: Nothing new
- **WHEN** a run finds the same data as the last snapshot
- **THEN** no commit is made and no deploy starts

#### Scenario: Change found
- **WHEN** a run finds a new latest video
- **THEN** exactly one commit is pushed to `main` and the site deploys with the new video, typically within about 10–25 minutes of the upload

#### Scenario: Owner pushed meanwhile
- **WHEN** `main` moved on while the run was working
- **THEN** the job rebases its commit onto the latest `main` before pushing, and never overwrites the owner's commits

### Requirement: Failures change nothing
If YouTube cannot be reached, returns an error, or returns data with no usable long-form entry, the job SHALL leave the snapshot and thumbnails unchanged, make no commit, and mark the run as failed in its log.

#### Scenario: Feed down
- **WHEN** the RSS feed request fails
- **THEN** no commit is made, the site keeps showing the last captured video, and the run log shows the error

#### Scenario: Thumbnail download fails
- **WHEN** the feed names a new video but its thumbnail cannot be downloaded
- **THEN** the snapshot is not updated in that run, so the site never names a video without its thumbnail

### Requirement: Thumbnails stored with the site
For every video the site shows, the job SHALL store a 16:9 thumbnail in the repository under a path named by the video ID, served by the site as a static file. It SHALL delete thumbnails no longer referenced and re-download a thumbnail that has changed on YouTube.

#### Scenario: Thumbnail changed on YouTube
- **WHEN** the owner changes a shown video's thumbnail on YouTube
- **THEN** within about an hour the stored thumbnail is replaced in a sync commit

#### Scenario: Old video no longer shown
- **WHEN** a video stops being referenced by the snapshot
- **THEN** its stored thumbnail is removed in the next sync commit

### Requirement: Stays active
The schedule SHALL keep running without manual steps even when the repository has no other activity for more than 60 days.

#### Scenario: Quiet period
- **WHEN** no videos are uploaded and nothing is pushed for three months
- **THEN** the scheduled job is still enabled and running at the end of that period
