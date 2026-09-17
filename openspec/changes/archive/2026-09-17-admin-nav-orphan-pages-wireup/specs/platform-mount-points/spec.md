## ADDED Requirements

### Requirement: Existing orphaned admin pages are registered in the static mount point registry

The `MOUNT_POINTS` array SHALL include entries for `admin/organizations`, `admin/orders`, `admin/revenue`, `admin/settings/checkout-gateway`, `admin/settings/einvoice`, and `admin/settings/gemini`, each with `mount.menu.requiresOperator` set to `true`, so that these previously unregistered pages become reachable from the Shell's navigation for operator users, consistent with the existing "Menu mount points render from a static registry in v1" requirement.

#### Scenario: Operator sees the six newly registered admin pages in navigation

- **WHEN** a signed-in user whose `admin.access` permission is granted (`user.role === "admin"`) renders the Shell navigation
- **THEN** the rendered navigation MUST include reachable entries whose hrefs resolve to `/admin/organizations`, `/admin/orders`, `/admin/revenue`, `/admin/settings/checkout-gateway`, `/admin/settings/einvoice`, and `/admin/settings/gemini`

##### Example: Admin-settings group collapses three settings pages

- **GIVEN** `mount-points.ts` registers `checkout-gateway`, `einvoice`, and `gemini` entries each with `mount.menu.groupId = "admin-settings"`
- **WHEN** `getMountMenuItems({ isOperator: true, ... })` is called
- **THEN** the result MUST contain exactly one top-level item for the `admin-settings` group with three `subItems` whose hrefs resolve to `/admin/settings/checkout-gateway`, `/admin/settings/einvoice`, and `/admin/settings/gemini`

#### Scenario: Non-operator does not see the six admin pages in navigation

- **WHEN** a signed-in user whose `admin.access` permission is not granted renders the Shell navigation
- **THEN** the rendered navigation MUST NOT include any entry for `admin/organizations`, `admin/orders`, `admin/revenue`, `admin/settings/checkout-gateway`, `admin/settings/einvoice`, or `admin/settings/gemini`

### Requirement: Drag-and-drop sidebar grouping coexists with subItems-based menu groups

`NavBar.tsx`'s `useSidebarGroupedNav` gate SHALL NOT be disabled solely because one or more menu items carry `subItems` (a `groupId`-based collapsed group such as `admin-settings`). The operator-configurable drag-and-drop grouping feature (persisted via `SidebarGroup`/`SidebarGroupItem`, confirmed against `docs/demo/platform-shell-navbar-demo.html`) SHALL remain available regardless of whether any `MOUNT_POINTS` entry defines a `groupId`.

#### Scenario: Grouped drag-and-drop nav renders even when a groupId-based subItems group exists

- **GIVEN** `MOUNT_POINTS` contains at least one entry with `mount.menu.groupId` set (producing a menu item with non-empty `subItems`, e.g. the `admin-settings` group)
- **AND** the signed-in user has `admin.access` and the sidebar is not collapsed
- **WHEN** the Shell navigation renders
- **THEN** `SidebarGroupedNav` (drag-and-drop persisted grouping) MUST still render instead of falling back to the flat `NavMenuList`

#### Scenario: Existing drag-and-drop persistence regression test guards the gate

- **GIVEN** a test asserts `useSidebarGroupedNav` evaluates `true` for an admin, non-collapsed session whose `getMountMenuItems()` output includes at least one item with `subItems`
- **WHEN** a future change alters `NavBar.tsx`'s grouped-nav gating condition
- **THEN** this test MUST fail before the change ships if the alteration would disable grouped-nav for any menu configuration containing `subItems`
