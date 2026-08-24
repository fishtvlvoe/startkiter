## ADDED Requirements

### Requirement: A learner-facing video source is registered into the media library before use

The system SHALL validate a video URL via the existing `resolveVideoSource()` resolver before creating a `Media` record. An unresolvable URL SHALL be rejected without creating a record.

#### Scenario: Valid Bunny video URL is registered

- **GIVEN** a teacher pastes `https://vz-abc123.b-cdn.net/play/xyz789` into the media picker
- **WHEN** the teacher confirms registration
- **THEN** a `Media` record is created with `type: "VIDEO"`, `provider: "BUNNY"`, `sourceId: "xyz789"`, `url` set to the pasted URL

#### Scenario: Unresolvable video URL is rejected

- **GIVEN** a teacher pastes `https://example.com/not-a-video` into the media picker
- **WHEN** the teacher confirms registration
- **THEN** the system returns a validation error and no `Media` record is created

### Requirement: Image media is uploaded via signed storage URLs and registered on completion

The system SHALL issue a signed upload URL scoped to the `media` storage bucket, and SHALL create a `Media` record only after the client confirms the upload succeeded.

#### Scenario: Image upload completes and is registered

- **GIVEN** a teacher selects a PNG file in the media picker
- **WHEN** the file is uploaded to the signed URL and the upload succeeds
- **THEN** a `Media` record is created with `type: "IMAGE"`, `filename`, `mimeType`, and `size` matching the uploaded file

### Requirement: Media in use by a lesson or course cannot be deleted

The system SHALL reject deletion of a `Media` record whose `usageId` is non-null, both in the UI (disabled delete control) and in the `delete-media` procedure itself.

#### Scenario: Deleting an in-use media record is rejected at the API layer

- **GIVEN** a `Media` record with `usageType: "LESSON_CONTENT"` and `usageId` set to a published lesson's ID
- **WHEN** an operator calls the `delete-media` procedure directly with that record's ID
- **THEN** the procedure returns `{ error: "IN_USE" }` and the record is not deleted

#### Scenario: Deleting an unused media record succeeds

- **GIVEN** a `Media` record with `usageId: null`
- **WHEN** an operator calls the `delete-media` procedure with that record's ID
- **THEN** the record is deleted

### Requirement: A course cover image is set through the media library

The system SHALL allow setting `Course.coverImageUrl` only to a URL sourced from a `Media` record with `type: "IMAGE"`.

#### Scenario: Course cover is set from an uploaded image

- **GIVEN** a teacher has uploaded an image already registered as `Media{type: "IMAGE"}`
- **WHEN** the teacher selects that image as the course cover
- **THEN** `Course.coverImageUrl` is updated to that media's `url`, and the public course page renders it
