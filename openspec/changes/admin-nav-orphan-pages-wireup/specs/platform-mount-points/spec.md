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
