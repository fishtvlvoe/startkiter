## MODIFIED Requirements

### Requirement: Operator can assign a user as an instructor scoped to a specific course

The system SHALL allow only an operator (verified via the shared `isOperator` check: `admin` role OR the existing `ADMIN_EMAIL` email match) to create or remove a `CourseInstructor` record.

#### Scenario: Operator assigns an instructor
- **GIVEN** an operator is signed in and a target user exists
- **WHEN** the operator calls `assignCourseInstructor` with that user's ID and a course ID
- **THEN** a `CourseInstructor` record MUST be created linking that user to that course

#### Scenario: Non-operator cannot assign an instructor
- **GIVEN** a signed-in user who is not the operator and has no `CourseInstructor` records
- **WHEN** that user calls `assignCourseInstructor`
- **THEN** the request MUST be rejected and no `CourseInstructor` record MUST be created

### Requirement: The admin area entry point admits operators and assigned instructors, with menu scoped accordingly

The system SHALL allow entry to `/admin` when the user is the operator (per the shared `isOperator` check) OR has at least one `CourseInstructor` record; users with neither SHALL be redirected. Instructors without operator status SHALL see only the course management menu item. An operator MUST always see the full menu, including when operator status comes from the `admin` role rather than `ADMIN_EMAIL`.

#### Scenario: Instructor without operator status sees scoped menu
- **GIVEN** a user has at least one `CourseInstructor` record and is not the operator
- **WHEN** that user opens `/admin`
- **THEN** the menu MUST show only the course management item

#### Scenario: User with no assignment and no operator status is redirected
- **GIVEN** a signed-in user with no `CourseInstructor` records who is not the operator
- **WHEN** that user requests `/admin`
- **THEN** the system MUST redirect away from `/admin`

#### Scenario: ADMIN_EMAIL account always sees the full menu
- **GIVEN** the signed-in user's email matches `ADMIN_EMAIL` but their role is not `admin`
- **WHEN** that user opens `/admin`
- **THEN** the menu MUST show the full operator menu, not the scoped instructor menu

### Requirement: The course studio course list is scoped by caller identity

The system SHALL return, from `listManageableCourses`, all courses for the operator (per the shared `isOperator` check) and only assigned courses for a non-operator instructor.

#### Scenario: Operator lists all courses
- **GIVEN** an operator is signed in and three courses exist
- **WHEN** the operator calls `listManageableCourses`
- **THEN** all three courses MUST be returned

#### Scenario: Non-operator instructor lists only assigned courses
- **GIVEN** a non-operator user has a `CourseInstructor` record for exactly one of three existing courses
- **WHEN** that user calls `listManageableCourses`
- **THEN** only that one assigned course MUST be returned
