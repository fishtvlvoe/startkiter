## ADDED Requirements

### Requirement: Learners and teachers exchange one-to-one messages per lesson

The system SHALL allow a learner to send a `LessonPrivateMessage` for a specific lesson, and allow a teacher/operator to reply with `isFromTeacher: true` on the same lesson-learner thread.

#### Scenario: Learner sends a message and teacher replies

- **WHEN** a learner sends a message for a lesson, then a teacher replies
- **THEN** both messages MUST be retrievable for that `(lessonId, userId)` pair, with the teacher's reply having `isFromTeacher: true`

### Requirement: Message attachments use the signed-URL storage abstraction

The system SHALL upload message attachments through `packages/storage`'s signed-URL mechanism, with `storageKey` system-generated rather than derived from the uploaded filename.

#### Scenario: Attachment storage key is not the original filename

- **WHEN** a learner attaches a file to a message
- **THEN** the stored `attachmentStorageKey` MUST be a system-generated identifier, not the original filename

### Requirement: Teacher can mark messages as read

The system SHALL allow a teacher/operator to mark a learner's message as read via `readByTeacher`.

#### Scenario: Marking a message read updates its status

- **WHEN** a teacher marks a learner's message as read
- **THEN** the message's `readByTeacher` field MUST become true
