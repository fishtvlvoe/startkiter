## ADDED Requirements

### Requirement: Core defines a fixed set of mount point kinds
The Core package `packages/platform` SHALL export a `PluginManifest` TypeScript type defining exactly four mount point kinds: `route`, `menu`, `content`, and `dataSpec`. A Plugin manifest MUST NOT introduce mount point kinds outside this fixed set.

#### Scenario: Manifest with unsupported mount kind fails type check
- **WHEN** a Plugin manifest object includes a key other than `route`, `menu`, `content`, or `dataSpec` under `mount`
- **THEN** the TypeScript compiler MUST report a type error and the build MUST fail

#### Scenario: Manifest with all supported mount kinds compiles
- **WHEN** a Plugin manifest declares `route`, `menu`, and `content` under `mount`, and a `dataSpec` value
- **THEN** the TypeScript compiler MUST accept the manifest without error

### Requirement: Content mount point supports three placement modes
A Plugin manifest's `mount.content.kind` field SHALL accept exactly one of `"auto"`, `"shortcode"`, or `"block"`. The v1 implementation MUST render content declared with `kind: "auto"`; `"shortcode"` and `"block"` MAY be declared in a manifest but the platform is NOT required to render them in v1.

#### Scenario: Auto-mode content renders without manual placement
- **WHEN** a Plugin manifest declares `mount.content.kind: "auto"` bound to route `/course`
- **THEN** visiting `/course` MUST render the Plugin's content without any user action to place it

##### Example: Course plugin auto-mount
- **GIVEN** the course Plugin manifest has `mount.content: { kind: "auto", boundTo: "/course" }`
- **WHEN** a signed-in learner navigates to `/course`
- **THEN** the response body MUST contain the course engine's rendered lesson list

### Requirement: Content data specs are limited to content and none
A Plugin manifest's `dataSpec` field SHALL accept exactly one of `"content"` or `"none"`. Values representing payment, transactional, or high-frequency data storage MUST NOT be valid `dataSpec` values in v1.

#### Scenario: Content-type Plugin declares dataSpec content
- **WHEN** a Plugin manifest declares `dataSpec: "content"`
- **THEN** the Plugin's content records MUST be persisted through the shared `PluginContent` table, not through a Plugin-specific table

#### Scenario: Payment-type dataSpec value is rejected
- **WHEN** a Plugin manifest attempts to declare `dataSpec: "payment"` or any value other than `"content"` or `"none"`
- **THEN** the TypeScript compiler MUST report a type error

### Requirement: Shared PluginContent table stores content-type Plugin data
The database SHALL provide a `PluginContent` table with columns `id`, `pluginId`, `type`, `title`, `body` (JSON), `authorId`, `createdAt`, `updatedAt`, indexed on `(pluginId, type)` and `authorId`. Content-type Plugins MUST persist their records through this table and MUST NOT create Plugin-specific tables for content storage.

#### Scenario: Course lesson persisted through shared table
- **WHEN** the course Plugin creates a new lesson record with `pluginId: "course"` and `type: "lesson"`
- **THEN** the record MUST be inserted into `PluginContent` and MUST be retrievable by querying `pluginId = "course" AND type = "lesson"`

#### Scenario: Empty body is rejected
- **WHEN** a `PluginContent` insert is attempted with a `null` or missing `body` value
- **THEN** the database MUST reject the insert because `body` is a required JSON column

### Requirement: Menu mount points render from a static registry in v1
The `packages/platform` package SHALL export a static array `MOUNT_POINTS: PluginManifest[]`. The Shell's navigation SHALL render menu items by iterating this array rather than hard-coding individual navigation links. Dynamic, database-driven, or filesystem-scanned mount point discovery MUST NOT be required for v1.

#### Scenario: Menu item appears from manifest without editing the Shell component
- **WHEN** a manifest in `MOUNT_POINTS` declares `mount.menu: { label: "站內客服", icon: "◇", order: 3 }`
- **THEN** the rendered sidebar MUST include a navigation item with that label, in position determined by `order`, without any Plugin-specific code inside the Shell component

#### Scenario: Operator-only menu item is hidden from learners
- **WHEN** a manifest declares `mount.menu.requiresOperator: true` and the signed-in user is not the operator
- **THEN** the rendered sidebar MUST NOT include that navigation item

##### Example: Settings menu item visibility
| User | requiresOperator | Visible |
| ---- | ----------------- | ------- |
| operator (email matches ADMIN_EMAIL) | true | yes |
| learner (email does not match ADMIN_EMAIL) | true | no |
| learner | false | yes |
