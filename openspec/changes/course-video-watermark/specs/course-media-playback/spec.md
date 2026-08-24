## ADDED Requirements

### Requirement: Video playback overlays a per-viewer dynamic watermark when enabled

The system SHALL overlay a watermark showing the viewer's email, course title, and/or timestamp on lesson video playback when the course's `CourseVideoWatermarkSetting.enabled` is true, changing position periodically per `moveIntervalSec`.

#### Scenario: Enabled watermark shows viewer email and course title

- **WHEN** a learner plays a lesson video for a course with `CourseVideoWatermarkSetting.enabled: true` and `showEmail: true`
- **THEN** the player MUST render an overlay containing the learner's email and MUST change its position at least once within `moveIntervalSec` seconds of continuous playback

#### Scenario: Disabled watermark shows no overlay

- **WHEN** a course has no `CourseVideoWatermarkSetting` row or `enabled: false`
- **THEN** the player MUST NOT render any watermark overlay

### Requirement: Masked email display mode does not reveal the full address

The system SHALL support an `emailDisplayMode` of `MASKED` that obscures part of the viewer's email in the watermark.

#### Scenario: Masked mode partially hides the email

- **WHEN** `emailDisplayMode` is `MASKED`
- **THEN** the rendered watermark text MUST NOT contain the viewer's full, unmasked email address
