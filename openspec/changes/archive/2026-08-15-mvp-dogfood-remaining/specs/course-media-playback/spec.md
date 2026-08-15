## ADDED Requirements

### Requirement: Entitled lessons play configured Bunny media
When a learner has course access, each MVP lesson SHALL play media from the configured Bunny Stream library when video identifiers are available. The player MUST NOT expose media URLs to learners without course access.

#### Scenario: Entitled learner gets Bunny embed
- **WHEN** a signed-in entitled learner opens an MVP lesson that has a Bunny video id configured
- **THEN** the lesson page MUST render a Bunny embed (or equivalent playable Bunny URL) for that video id

#### Scenario: Missing Bunny config falls back safely
- **WHEN** Bunny library or video id is not configured
- **THEN** the lesson page MUST still render a playable fallback media and MUST show plain-language notice that the clip is a temporary demo

### Requirement: Unauthorized learners do not receive media URLs
Lesson APIs and pages MUST withhold Bunny or fallback media URLs when the learner lacks course access.

#### Scenario: Locked lesson omits media URL
- **WHEN** an authenticated learner without purchase requests lesson media metadata
- **THEN** the response or page MUST NOT include the playable media URL
