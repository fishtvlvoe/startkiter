## Purpose

This capability defines the shared platform foundation for a Taiwan-ready creator operations product. It gives every creator module one workspace, permission, navigation, and responsive interaction contract.

## ADDED Requirements

### Requirement: The platform SHALL expose one creator workspace context

The platform SHALL resolve the current creator workspace from the existing organization and membership boundary. A workspace context SHALL include workspace identity, current user, locale, timezone, currency, and effective capabilities.

#### Scenario: A creator opens the operations home

- **WHEN** an authenticated member opens the operations home
- **THEN** the system resolves one workspace context and renders only modules available to that member

##### Example: Concrete acceptance fixture 1

- **GIVEN** U1 belongs to W1 and can read courses but not billing settings
- **WHEN** U1 opens creator operations
- **THEN** workspace W1, locale zh-TW, currency TWD and authorized course entry are resolved without billing settings

#### Scenario: A user has no workspace membership

- **WHEN** an authenticated user has no active workspace membership
- **THEN** the system shows a workspace setup or invitation state and SHALL NOT render creator data

##### Example: Concrete acceptance fixture 2

- **GIVEN** U2 has no active workspace membership
- **WHEN** U2 enters creator operations
- **THEN** a setup/invitation state is shown with no W1 or W2 creator records

### Requirement: Navigation SHALL be task-oriented and capability-aware

The platform SHALL group creator work into operations, audience, content and products, marketing, sales, analytics, and settings. A navigation item SHALL be shown only when the current capability grants access to its route.

#### Scenario: A course administrator opens the platform shell

- **WHEN** a course administrator enters the shell
- **THEN** the shell shows course operations and all platform modules granted to that member without exposing unauthorized settings

##### Example: Concrete acceptance fixture 3

- **GIVEN** U1 has course-admin capability only in W1
- **WHEN** U1 opens the shell
- **THEN** course operations are available and platform-wide settings are absent

#### Scenario: A member opens a direct unauthorized route

- **WHEN** a member requests a route outside the resolved capabilities
- **THEN** the system returns the existing permission-denied behavior and SHALL NOT leak protected data

##### Example: Concrete acceptance fixture 4

- **GIVEN** U1 can edit courses but cannot export CRM records
- **WHEN** U1 opens a direct CRM export entry
- **THEN** the permission-denied contract applies and no protected records are returned

### Requirement: The platform SHALL use one shared page-state contract

Every creator operations page SHALL define loading, empty, error, success, disabled, and permission-denied states. Each primary task SHALL expose one primary call to action and an explicit recovery path for failures.

#### Scenario: A list has no records

- **WHEN** a creator opens a valid list with zero records
- **THEN** the page explains what the list represents and exposes the next valid creation or import action

##### Example: Concrete acceptance fixture 5

- **GIVEN** W1 has zero Contacts and U1 can create them
- **WHEN** U1 opens the Contact list
- **THEN** an explanatory empty state offers create/import rather than a fabricated record

#### Scenario: A provider request fails

- **WHEN** a page action fails because of an external provider or network error
- **THEN** the page shows a human-readable error, preserves safe input, and exposes retry or support escalation

##### Example: Concrete acceptance fixture 6

- **GIVEN** form F1 contains safe draft subject Welcome and provider times out
- **WHEN** U1 submits F1
- **THEN** Welcome remains editable, the failure is explained and retry or support entry is present

### Requirement: Desktop and mobile SHALL preserve the same core task

The platform SHALL provide a desktop layout and a mobile layout for every core creator task. A core task SHALL be completable at a 390 CSS pixel viewport without horizontal scrolling.

#### Scenario: A creator manages a contact on mobile

- **WHEN** a creator opens the contact list and contact detail at a 390 CSS pixel viewport
- **THEN** the creator can search, open, edit, save, and return without horizontal overflow

##### Example: Concrete acceptance fixture 7

- **GIVEN** C1 is editable in W1 at viewport width 390
- **WHEN** U1 searches C1, edits its display name, saves and returns
- **THEN** C1 saved values and return action remain reachable with no horizontal scrolling

#### Scenario: A keyboard user navigates a form

- **WHEN** a keyboard user tabs through a creator form
- **THEN** focus order, labels, validation messages, and submit state remain visible and actionable

##### Example: Concrete acceptance fixture 8

- **GIVEN** F1 has name, email, save and cancel controls
- **WHEN** U1 uses only Tab and Enter
- **THEN** controls are reached in task order, focus is visible and field errors are announced

