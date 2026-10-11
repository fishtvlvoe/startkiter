## Purpose

This capability defines the shared platform foundation for a Taiwan-ready creator operations product. It gives every creator module one workspace, permission, navigation, and responsive interaction contract.

## ADDED Requirements

### Requirement: The platform SHALL expose one creator workspace context

The platform SHALL resolve the current creator workspace from the existing organization and membership boundary. A workspace context SHALL include workspace identity, current user, locale, timezone, currency, and effective capabilities.

#### Scenario: A creator opens the operations home

- **WHEN** an authenticated member opens the operations home
- **THEN** the system resolves one workspace context and renders only modules available to that member

#### Scenario: A user has no workspace membership

- **WHEN** an authenticated user has no active workspace membership
- **THEN** the system shows a workspace setup or invitation state and SHALL NOT render creator data

### Requirement: Navigation SHALL be task-oriented and capability-aware

The platform SHALL group creator work into operations, audience, content and products, marketing, sales, analytics, and settings. A navigation item SHALL be shown only when the current capability grants access to its route.

#### Scenario: A course administrator opens the platform shell

- **WHEN** a course administrator enters the shell
- **THEN** the shell shows course operations and all platform modules granted to that member without exposing unauthorized settings

#### Scenario: A member opens a direct unauthorized route

- **WHEN** a member requests a route outside the resolved capabilities
- **THEN** the system returns the existing permission-denied behavior and SHALL NOT leak protected data

### Requirement: The platform SHALL use one shared page-state contract

Every creator operations page SHALL define loading, empty, error, success, disabled, and permission-denied states. Each primary task SHALL expose one primary call to action and an explicit recovery path for failures.

#### Scenario: A list has no records

- **WHEN** a creator opens a valid list with zero records
- **THEN** the page explains what the list represents and exposes the next valid creation or import action

#### Scenario: A provider request fails

- **WHEN** a page action fails because of an external provider or network error
- **THEN** the page shows a human-readable error, preserves safe input, and exposes retry or support escalation

### Requirement: Desktop and mobile SHALL preserve the same core task

The platform SHALL provide a desktop layout and a mobile layout for every core creator task. A core task SHALL be completable at a 390 CSS pixel viewport without horizontal scrolling.

#### Scenario: A creator manages a contact on mobile

- **WHEN** a creator opens the contact list and contact detail at a 390 CSS pixel viewport
- **THEN** the creator can search, open, edit, save, and return without horizontal overflow

#### Scenario: A keyboard user navigates a form

- **WHEN** a keyboard user tabs through a creator form
- **THEN** focus order, labels, validation messages, and submit state remain visible and actionable

