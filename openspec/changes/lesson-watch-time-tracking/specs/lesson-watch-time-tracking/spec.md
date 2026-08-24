## ADDED Requirements

### Requirement: Watch time only increases, never regresses on re-report

The system SHALL update `WatchTimeLog.watchedSec` to the greater of the existing value and the newly reported value, never decreasing it.

#### Scenario: Reloading the page does not reduce recorded watch time

- **WHEN** a learner has an existing `watchedSec` of 300 and reports a new value of 50 (e.g. after reloading the page)
- **THEN** the stored `watchedSec` MUST remain 300, not be overwritten to 50

#### Scenario: Continued watching increases the recorded value

- **WHEN** a learner has an existing `watchedSec` of 300 and reports a new value of 330
- **THEN** the stored `watchedSec` MUST become 330

### Requirement: Watch time is tracked independently of lesson completion status

The system SHALL record `WatchTimeLog` independently of `LessonProgress`, without modifying the existing lesson-completion logic.

#### Scenario: Watch time is recorded without affecting completion status

- **WHEN** a learner's watch time is recorded via `recordWatchTime`
- **THEN** the corresponding `LessonProgress` completion status MUST NOT be changed as a side effect
