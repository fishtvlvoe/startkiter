## Purpose

StartKiter SHALL keep each App's user surface and admin surface as independent route trees, SHALL keep the platform (super-admin) surface free of any single App's admin detail, and SHALL migrate the course App to conform to the App registration contract.

## ADDED Requirements

### Requirement: An App's user surface and admin surface are independent route trees

For every registered App, the user-facing route tree and the admin route tree MUST be distinct route trees. A single route MUST NOT render different content by role.

#### Scenario: course user route renders only the user surface

- **WHEN** a `course` app-user requests any route under `/course`
- **THEN** only the course user-facing surface renders, regardless of the requester's role in other Apps

#### Scenario: course admin route renders only the admin surface

- **WHEN** a `course` app-admin requests any route under `/admin/course`
- **THEN** only the course admin surface renders, and it does not share a component that conditionally renders the user surface

#### Scenario: shared conditional component is rejected

- **WHEN** a component under `/course` or `/admin/course` renders different content trees based on the caller's role
- **THEN** the component test for route-tree independence fails

### Requirement: The platform surface excludes any single App's admin detail

The platform (`scope: "platform"`) surface MUST expose only site-wide capabilities (account, transactions, revenue, payment gateway, organization, system, and the App list/switch entry point). It SHALL NOT render a registered App's admin-detail functionality (e.g., a specific App's content editing, question bank, or member management screens).

#### Scenario: platform surface has no App-specific management screen

- **WHEN** the platform surface renders for a super-admin
- **THEN** it contains no route or component belonging to the `course` App's admin-detail functionality

#### Scenario: switching to an App admin workspace is a single entry point

- **WHEN** a super-admin wants to manage the `course` App
- **THEN** the platform surface offers exactly one entry that switches the workspace to `{ scope: "app", appId: "course", role: "app-admin" }`, not an inline shortcut to a course-specific admin action

#### Scenario: boundary check rejects an App-specific route inside the platform surface

- **WHEN** a boundary check compares the platform surface's route list against every registered App's admin routes
- **THEN** it fails and lists any overlapping route

##### Example: boundary check inputs

| Platform surface route | Registered App route | Result |
| --- | --- | --- |
| `/admin/organization` | — | pass (site-wide) |
| `/admin/course/chapters` | `course` admin route | fail: App-specific route found in platform surface |

### Requirement: The course App is migrated to the registration contract

The course App MUST be registered through `AppRegistrationManifest` with `appId: "course"`, a `displayName`, both icon variants, all three supported locales, and unit/browser test references, and MUST pass the CI validation defined by the App registration contract.

#### Scenario: course App passes registration validation

- **WHEN** the course App's `AppRegistrationManifest` is validated by CI
- **THEN** validation passes with no missing fields

#### Scenario: existing course functionality is unaffected by the migration

- **WHEN** the existing course test suite (chapter/lesson CRUD, lesson editor, sandbox, drag-and-drop ordering) runs after the migration
- **THEN** every previously passing test still passes
