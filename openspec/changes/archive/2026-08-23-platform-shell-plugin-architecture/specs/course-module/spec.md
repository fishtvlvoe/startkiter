## ADDED Requirements

### Requirement: Course content is exposed as the first official demonstration Plugin
The course module SHALL be represented in the `packages/platform` mount point registry as a Plugin manifest with `id: "course"`, `mount.content: { kind: "auto", boundTo: "/course" }`, and `dataSpec: "content"`. This manifest MUST be the reference example other future service-type Plugins are built against. The existing playback and purchase-entitlement requirements are unaffected by this manifest declaration.

#### Scenario: Course manifest is registered
- **WHEN** `MOUNT_POINTS` from `packages/platform` is inspected
- **THEN** it MUST contain exactly one entry with `id: "course"` whose `mount.content.kind` is `"auto"`

#### Scenario: Manifest declaration does not change playback entitlement behavior
- **WHEN** an unpaid visitor requests lesson playback after the course Plugin manifest is registered
- **THEN** the server MUST still deny playback per the existing "Unpaid visitor cannot play lessons" requirement, unaffected by the manifest's existence
