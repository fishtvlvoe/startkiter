## Purpose

This capability renders an approved two-level navigation shell in the authenticated application. It reuses existing role, route and manifest decisions without changing their business semantics or replacing server authorization with local previews.

## ADDED Requirements

### Requirement: The authenticated shell SHALL consume one approved navigation model

The shell SHALL render top-level modules and contextual children from the existing approved NavigationModel. It SHALL NOT construct a second role or route registry from demonstration labels. Invalid entries SHALL expose a safe unavailable state rather than a fabricated route. Protected data access SHALL remain guarded on the server.

#### Scenario: A creator changes an available module

- **WHEN** an authenticated permitted user changes an available registered module
- **THEN** its children and selected location update without changing the user's server role

##### Example: Registered course management

- **GIVEN** the approved model includes course management for U1
- **WHEN** U1 selects that module
- **THEN** only its registered permitted children appear and an unregistered CRM destination is not silently fabricated

#### Scenario: Unauthorized direct navigation remains denied

- **WHEN** a user without management permission opens a protected management route directly
- **THEN** the existing server denial is retained and the new shell does not expose protected records

##### Example: Learner direct management entry

- **GIVEN** U2 has only app-user capability
- **WHEN** U2 opens a management route
- **THEN** its protected content is denied rather than granted by a visible navigation toggle

### Requirement: Local shell integration SHALL preserve existing routes and rollback

The new renderer SHALL be opt-in in the isolated local application until role and route checks pass. Existing learner, management, settings and dedicated preview routes SHALL retain their behavior. A dedicated preview SHALL not acquire duplicate navigation chrome. Rollback SHALL restore the existing renderer without changing stored application records.

#### Scenario: A course administrator opens the learner preview

- **WHEN** a permitted course administrator enters the dedicated learner preview
- **THEN** the preview uses its existing standalone chrome and a return path, without duplicate top or side navigation

##### Example: Preview route regression

- **GIVEN** U1 can open /course/preview
- **WHEN** the local new shell flag is enabled and U1 opens that route
- **THEN** no duplicate main-shell navigation appears and returning leads to the existing management context

#### Scenario: Local integration is rolled back

- **WHEN** the local shell flag is disabled
- **THEN** the previous renderer becomes active and existing products, sessions and access records are unchanged

##### Example: Local switch without data migration

- **GIVEN** test data contains Offer A and access record E1
- **WHEN** the renderer is switched back
- **THEN** A and E1 remain unchanged and their original routes remain available

### Requirement: Application acceptance SHALL require real local authentication evidence

Acceptance SHALL use an isolated HTTP localhost application and authenticated test roles on desktop and mobile. A file-based role preview, mocked component test, build result or remote deployment status SHALL NOT count as authenticated application acceptance. Missing test isolation or accounts SHALL leave acceptance blocked with a named environment requirement.

#### Scenario: Only a file-based preview is available

- **WHEN** the renderer has been shown only in a local file demo
- **THEN** the authenticated application milestone remains unverified

##### Example: Demo cannot close M2

- **GIVEN** file Demo switches among three role labels
- **WHEN** M2 is reviewed without localhost login evidence
- **THEN** M2 is not marked accepted regardless of Demo assertions
