## ADDED Requirements

### Requirement: Operator can assign a user as an instructor scoped to a specific course

The system SHALL allow only an operator (verified via the existing `isCourseOperator` email check) to create or remove a `CourseInstructor` record.

#### Scenario: Operator assigns an instructor

- **GIVEN** an operator is signed in and a target user exists
- **WHEN** the operator calls `assignCourseInstructor` with that user's ID and a course ID
- **THEN** a `CourseInstructor` record is created linking that user to that course

#### Scenario: Non-operator cannot assign an instructor

- **GIVEN** a signed-in user who is not the operator and has no `CourseInstructor` records
- **WHEN** that user calls `assignCourseInstructor`
- **THEN** the system returns 403 and no `CourseInstructor` record is created

### Requirement: An instructor can only manage the courses they are assigned to

The system SHALL reject any course studio action (chapter/lesson create, update, reorder) for a course the calling user is neither the operator for nor assigned to via `CourseInstructor`.

#### Scenario: Instructor manages an assigned course

- **GIVEN** a user has a `CourseInstructor` record for course A
- **WHEN** that user calls a course studio action targeting course A
- **THEN** the action succeeds

#### Scenario: Instructor is rejected from an unassigned course

- **GIVEN** a user has a `CourseInstructor` record for course A only
- **WHEN** that user calls a course studio action targeting course B
- **THEN** the system returns 403 and no change is made to course B

### Requirement: The admin area entry point admits operators and assigned instructors, with menu scoped accordingly

The system SHALL allow entry to `/admin` when the user is the operator OR has at least one `CourseInstructor` record; users with neither SHALL be redirected. Instructors without operator status SHALL see only the course management menu item.

#### Scenario: Assigned instructor enters the admin area with a scoped menu

- **GIVEN** a user has at least one `CourseInstructor` record and is not the operator
- **WHEN** that user navigates to `/admin`
- **THEN** the user is not redirected away, and the visible menu contains only the course management item

#### Scenario: User with no assignment and no operator status is redirected

- **GIVEN** a signed-in user with no `CourseInstructor` records who is not the operator
- **WHEN** that user navigates to `/admin`
- **THEN** the user is redirected away from `/admin`

### Requirement: The course studio course list is scoped by caller identity

The system SHALL return, from `listManageableCourses`, all courses for the operator and only assigned courses for a non-operator instructor.

#### Scenario: Operator lists all courses

- **GIVEN** an operator is signed in and three courses exist
- **WHEN** the operator calls `listManageableCourses`
- **THEN** all three courses are returned

#### Scenario: Instructor lists only assigned courses

- **GIVEN** a non-operator user has a `CourseInstructor` record for exactly one of three existing courses
- **WHEN** that user calls `listManageableCourses`
- **THEN** only the one assigned course is returned
