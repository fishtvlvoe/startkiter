## ADDED Requirements

### Requirement: Instructor can generate lesson notes from an uploaded subtitle file
The system SHALL allow an instructor with management permission over a course to upload a `.srt` subtitle file for one of its lessons and receive an AI-generated, structured Markdown draft, streamed to the client as it is produced.

#### Scenario: Instructor with a configured API key generates notes
- **WHEN** an instructor who can manage the course uploads a valid `.srt` file for a lesson and their Gemini API key is configured
- **THEN** the system SHALL parse the subtitle text, call the AI generation endpoint, and stream the generated Markdown content back to the client

#### Scenario: Generation is blocked without a configured API key
- **WHEN** an instructor triggers generation but has no Gemini API key configured
- **THEN** the system SHALL respond with HTTP 400 and error code `GEMINI_KEY_MISSING`, and SHALL NOT call the AI provider

#### Scenario: Non-manager cannot trigger generation
- **WHEN** a user without management permission over the course calls the generation API
- **THEN** the system SHALL respond with HTTP 403, SHALL NOT call the AI provider, and SHALL NOT consume any rate-limit quota

### Requirement: Generated content requires explicit instructor confirmation before it overwrites lesson content
The system SHALL NOT write AI-generated content into a `Lesson.content` field until the instructor explicitly confirms saving it; canceling SHALL discard the generated draft without modifying the lesson.

#### Scenario: Instructor edits and saves the generated draft
- **WHEN** an instructor edits the AI-generated draft and clicks save
- **THEN** the system SHALL persist the instructor's edited version (not the original AI output) to `Lesson.content`

#### Scenario: Instructor cancels without saving
- **WHEN** an instructor closes the generation dialog without clicking save
- **THEN** the `Lesson.content` field SHALL remain unchanged

### Requirement: Gemini API key is stored encrypted per the existing site-setting convention
The system SHALL store the instructor-provided Gemini API key using the same encryption mechanism already used for other site settings (encrypt-on-write, decrypt-on-read, keyed by a dedicated setting id), and SHALL NOT store it in plaintext.

#### Scenario: Key is stored encrypted
- **WHEN** an instructor saves a Gemini API key through the settings page
- **THEN** the persisted `SiteSetting` record's `ciphertext` field SHALL NOT contain the plaintext key value

### Requirement: Generation calls are rate-limited per instructor
The system SHALL reject a generation request from an instructor who has already made 10 or more generation calls within the trailing 60 seconds, returning the retry delay.

#### Scenario: Under the limit
- **WHEN** an instructor has made fewer than 10 generation calls in the trailing 60 seconds
- **THEN** the system SHALL allow the call to proceed

#### Scenario: Over the limit
- **WHEN** an instructor makes an 11th generation call within the same trailing 60-second window
- **THEN** the system SHALL respond with HTTP 429 and include a retry-after duration, and SHALL NOT call the AI provider

##### Example: rolling window boundary
| Call # | Time offset (s) | Result |
| --- | --- | --- |
| 1–10 | 0–59 | allowed |
| 11 | 59 | rejected, HTTP 429 |
| 11 (retry) | 61 | allowed (window has rolled past call #1) |
