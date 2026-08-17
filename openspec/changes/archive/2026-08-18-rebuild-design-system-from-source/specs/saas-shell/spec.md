## ADDED Requirements

### Requirement: Operator role determines visible permission-gated navigation

The AppShell SHALL determine which navigation items and page-level actions are visible using a typed permission check (`usePermissions`) against the four-value role set defined in the `organization-tenancy` capability (owner/admin/instructor/user), rather than the single boolean `requiresOperator` check used previously. A user whose role lacks a given permission MUST NOT see the navigation item or action gated by that permission.

#### Scenario: Instructor sees content management but not billing navigation

- **WHEN** a signed-in user with the `instructor` role views the AppShell sidebar
- **THEN** the sidebar MUST show course content management navigation and MUST NOT show organization billing or member management navigation

#### Scenario: Owner sees all permission-gated navigation

- **WHEN** a signed-in user with the `owner` role views the AppShell sidebar
- **THEN** the sidebar MUST show organization billing, member management, and course content management navigation

#### Scenario: Permission check fails closed when role is unknown

- **WHEN** `usePermissions` cannot resolve a role for the current session
- **THEN** the AppShell MUST treat the user as having no permissions and MUST NOT show any permission-gated navigation item, and MUST NOT throw an unhandled exception

### Requirement: Multi-organization users can switch active organization from the shell

When a signed-in user belongs to more than one organization, the AppShell SHALL render an organization switcher control in the sidebar user area that lists the user's organizations and allows switching the active organization context.

#### Scenario: User with multiple organizations sees the switcher

- **WHEN** a signed-in user who is a member of two or more organizations views the AppShell sidebar
- **THEN** the sidebar user area MUST contain an organization switcher control listing all organizations the user belongs to

#### Scenario: User with exactly one organization does not see the switcher

- **WHEN** a signed-in user who belongs to exactly one organization views the AppShell sidebar
- **THEN** the sidebar user area MUST NOT render an organization switcher control

#### Scenario: Switching organization updates the active context

- **WHEN** a user with multiple organizations selects a different organization in the switcher
- **THEN** subsequent navigation and data queries MUST scope to the newly selected organization, and the previously active organization's data MUST NOT remain visible
