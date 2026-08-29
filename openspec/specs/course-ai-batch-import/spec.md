## ADDED Requirements

### Requirement: Instructor can import a course structure from a strict three-level folder
The system SHALL parse a dropped folder structured as course/chapter/lesson (exactly four path segments including the file) into chapters and lessons, ignoring any file that does not match this depth, and SHALL surface a warning list for lessons missing a video or missing both a subtitle and a notes file.

#### Scenario: Well-formed folder parses into chapters and lessons
- **WHEN** an instructor drops a folder containing two chapter subfolders, each with two lesson subfolders containing a video and either a `.srt` or `.md` file
- **THEN** the system SHALL return a parsed structure with 2 chapters and 4 lessons, naturally ordered by folder name

#### Scenario: Missing content is warned, not silently skipped
- **WHEN** a lesson folder has a video file but neither a `.srt` nor a `.md` file
- **THEN** the system SHALL include this lesson in the parsed structure but SHALL surface a warning identifying it by chapter and lesson name

##### Example: mixed structure validation
| Lesson folder contents | Included in structure | Warning |
| --- | --- | --- |
| video.mp4 + subtitle.srt | yes | none |
| video.mp4 + notes.md | yes | none |
| video.mp4 only | yes | missing subtitle/notes |
| subtitle.srt only (no video) | yes | missing video |
| file at root level (not under chapter/lesson) | no | ignored, not surfaced as a lesson |

### Requirement: Video upload has a maximum file size and does not block other lessons on failure
The system SHALL reject a single video upload exceeding the configured size limit with a `FILE_TOO_LARGE` error for that lesson only, and processing of other lessons in the same batch SHALL continue unaffected.

#### Scenario: Oversized file fails independently
- **WHEN** one lesson's video file exceeds the configured size limit during batch processing
- **THEN** that lesson SHALL be marked failed with error code `FILE_TOO_LARGE`, and all other lessons in the batch SHALL continue processing normally

### Requirement: Failed lessons can be retried individually without reprocessing the batch
The system SHALL allow retrying the upload/generation for a single failed lesson without re-running any other lesson in the same import batch.

#### Scenario: Retry only affects the failed lesson
- **WHEN** an instructor retries a lesson that previously failed due to an upload error
- **THEN** the system SHALL reprocess only that lesson, and the state of all other already-completed lessons SHALL remain unchanged

### Requirement: Database write only happens after explicit instructor confirmation of the full batch
The system SHALL NOT create any `Chapter` or `Lesson` database record until the instructor explicitly confirms the import after reviewing the processed batch; canceling before confirmation SHALL leave the database unchanged.

#### Scenario: Confirmed import creates matching records
- **WHEN** an instructor confirms an import for a parsed structure of 2 chapters and 4 lessons where all 4 lessons finished processing (successfully or accepted with warnings)
- **THEN** the system SHALL create exactly 2 `Chapter` records and 4 `Lesson` records matching the parsed structure

#### Scenario: Canceling before confirmation writes nothing
- **WHEN** an instructor closes the batch import dialog before clicking confirm, regardless of how many lessons finished processing
- **THEN** no `Chapter` or `Lesson` record SHALL be created for this batch
