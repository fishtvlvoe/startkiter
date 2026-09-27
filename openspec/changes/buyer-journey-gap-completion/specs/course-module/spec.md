## ADDED Requirements

### Requirement: Course landing page shares the published catalog source

The `/course` landing page SHALL render its unit list using the same published-catalog reader that the marketing curriculum page and the classroom use. It MUST NOT read from any static, package-bundled fixture list that is independent of the published Course/Chapter/Lesson records.

#### Scenario: Landing page list matches classroom and marketing page

- **WHEN** a signed-in learner with course access opens `/course`
- **THEN** the titles, order, and lesson ids shown on `/course` MUST match the published chapters and lessons that the marketing curriculum page and the classroom (`/course/{lessonId}`) present for the same course

#### Scenario: Clicking a landing page entry opens the matching lesson

- **WHEN** a learner clicks a unit entry on `/course`
- **THEN** the classroom SHALL open the lesson whose id and content correspond to that same entry, not an unrelated lesson

#### Scenario: No published content renders an empty state, not stale fixtures

- **WHEN** the course has no published chapters or lessons
- **THEN** `/course` SHALL render an empty-state message and MUST NOT fall back to any static demo unit list
