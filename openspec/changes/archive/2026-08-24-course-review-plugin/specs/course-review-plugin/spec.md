## ADDED Requirements

### Requirement: Reviews and comments are stored in dedicated transaction-type tables, not PluginContent

The system SHALL persist `CourseReview`, `ReviewHelpful`, `ReviewReport`, and `LessonComment` as dedicated database tables, not as `PluginContent` records.

#### Scenario: Review is queryable and sortable by structured columns

- **WHEN** a course's reviews are listed sorted by helpful count
- **THEN** the system MUST query the dedicated `CourseReview`/`ReviewHelpful` tables using a database-level sort, not a JSON body scan

### Requirement: A learner can rate a course exactly once

The system SHALL enforce at most one `CourseReview` per `(userId, courseId)` pair.

#### Scenario: Duplicate review for the same course is rejected

- **WHEN** a learner who has already reviewed a course submits a second review for the same course
- **THEN** the system MUST reject the duplicate at the database level and MUST NOT create a second `CourseReview` row

### Requirement: Course review summary is computed on demand, not cached on the Course model

The system SHALL expose `getCourseReviewSummary(courseId)` returning the average rating and review count, computed at query time. The system MUST NOT add a cached rating field to the `Course` model.

#### Scenario: Summary reflects current reviews without a cached column

- **WHEN** `getCourseReviewSummary` is called for a course with existing reviews
- **THEN** the returned average and count MUST match the current `CourseReview` rows for that course, and the `Course` model's schema MUST NOT have gained a new rating-related column

### Requirement: Anonymous comments retain the real author for operator review while hiding it from other learners

The system SHALL allow a learner to post a `LessonComment` with `isAnonymous: true`, storing the real `userId` regardless. Display surfaces for other learners MUST NOT reveal the author's identity when `isAnonymous` is true; operator-facing surfaces MAY reveal it.

#### Scenario: Anonymous comment hides identity from other learners

- **WHEN** another learner views a comment with `isAnonymous: true`
- **THEN** the response MUST NOT include the commenting user's identifying information

#### Scenario: Operator can still see the real author of an anonymous comment

- **WHEN** an operator views the same comment through an operator-facing surface
- **THEN** the response MAY include the real `userId` for moderation purposes
