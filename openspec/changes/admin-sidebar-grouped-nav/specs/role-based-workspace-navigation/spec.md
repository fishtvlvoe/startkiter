## ADDED Requirements

### Requirement: Platform workspace resolves app root children

When the workspace scope is platform, `resolveNavigation` SHALL include, for each app root item, the children whose `menu.parentId` equals that root and whose `requiredRole` is `app-admin` for the same `appId`.

#### Scenario: Course root in platform workspace

- **WHEN** `resolveNavigation` runs for pathname `/admin/users` with platform admin capabilities
- **THEN** the item with id `course-admin` has children including `quiz` with href `/admin/course/quiz`

#### Scenario: App workspace unchanged for learners

- **WHEN** `resolveNavigation` runs for pathname `/course` with app-user role
- **THEN** no app-admin child appears in any item
