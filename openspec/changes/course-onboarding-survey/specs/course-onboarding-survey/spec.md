## ADDED Requirements

### Requirement: A learner submits at most one onboarding survey per course

The system SHALL enforce at most one `CourseOnboardingSurveyResponse` per `(userId, courseId)` pair.

#### Scenario: Duplicate submission is rejected

- **WHEN** a learner who has already submitted a survey for a course submits again
- **THEN** the system MUST reject the duplicate at the database level

### Requirement: Only learners with course access can submit the survey

The system SHALL reject a survey submission from a user who does not currently have access to the course.

#### Scenario: Submission without course access is rejected

- **WHEN** a signed-in user without access to a course attempts to submit an onboarding survey for it
- **THEN** the request MUST be rejected with HTTP 403 and no `CourseOnboardingSurveyResponse` row MUST be created
