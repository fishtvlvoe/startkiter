## ADDED Requirements

### Requirement: Marketplace page lists known Plugins from the mount point registry
The route `/marketplace` SHALL render a list of Plugins sourced from the `MOUNT_POINTS` static registry defined in `packages/platform`. Each listed Plugin MUST show its `name`, `version`, and enabled status. The page MUST NOT provide a file upload form or any endpoint that accepts arbitrary Plugin packages in v1.

#### Scenario: Signed-in user views the Marketplace list
- **WHEN** a signed-in user navigates to `/marketplace`
- **THEN** the page MUST render at least one entry for the course Plugin with its name, version, and enabled status

#### Scenario: Unauthenticated visitor is redirected
- **WHEN** a visitor without a session requests `/marketplace`
- **THEN** the server MUST redirect to `/login?next=/marketplace`

### Requirement: Plugin listing API returns manifest data with enabled status
`GET /api/plugins` SHALL return HTTP 200 with a JSON array of objects derived from `MOUNT_POINTS`, each including `id`, `name`, `version`, and a boolean `enabled` field. The endpoint MUST NOT expose any manifest fields beyond those declared in the `PluginManifest` type.

#### Scenario: API returns the course Plugin entry
- **WHEN** a signed-in user's browser calls `GET /api/plugins`
- **THEN** the response body MUST be a JSON array containing an object with `id: "course"` and `enabled: true`

##### Example: Response shape
- **GIVEN** `MOUNT_POINTS` contains one manifest with `id: "course", name: "課程內容", version: "1.0.0"`
- **WHEN** `GET /api/plugins` is called
- **THEN** the response body is `[{"id":"course","name":"課程內容","version":"1.0.0","enabled":true}]`

#### Scenario: Unauthenticated request is denied
- **WHEN** `GET /api/plugins` is called without a valid session
- **THEN** the server MUST return HTTP 401 and MUST NOT return the manifest array
