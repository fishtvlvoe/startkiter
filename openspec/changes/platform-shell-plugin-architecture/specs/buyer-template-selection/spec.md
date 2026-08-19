## ADDED Requirements

### Requirement: Platform provides a fixed set of site templates for buyers to choose from

The `packages/platform` module SHALL export a `SiteTemplate` TypeScript type and a `SITE_TEMPLATES` static array containing 2 to 3 built-in templates. Each template SHALL declare an `id`, `name`, `description`, `previewImagePath`, `defaultMountConfig`, `styleTokenOverrides`, and `aiPromptHint`. The v1 implementation MUST NOT allow buyers to upload or create custom templates through the UI.

#### Scenario: Template array contains at least two entries

- **WHEN** `SITE_TEMPLATES` from `packages/platform` is inspected
- **THEN** it MUST contain at least 2 entries, each with a unique `id`

##### Example: Minimum template set

- **GIVEN** the platform ships with built-in templates
- **WHEN** `SITE_TEMPLATES.length` is evaluated
- **THEN** the result MUST be >= 2 and <= 5

#### Scenario: Template with missing required fields fails type check

- **WHEN** a `SiteTemplate` object omits the `defaultMountConfig` field
- **THEN** the TypeScript compiler MUST report a type error

### Requirement: Template listing API returns template data

`GET /api/templates` SHALL return HTTP 200 with a JSON array of `SiteTemplate` objects. The endpoint MUST require a valid session and return HTTP 401 for unauthenticated requests.

#### Scenario: API returns built-in templates

- **WHEN** a signed-in user calls `GET /api/templates`
- **THEN** the response body MUST be a JSON array containing at least 2 template objects, each with `id`, `name`, `description`, and `previewImagePath` fields

##### Example: Response shape

- **GIVEN** `SITE_TEMPLATES` contains a template with `id: "course-site"` and `name: "課程教學站"`
- **WHEN** `GET /api/templates` is called with a valid session
- **THEN** the response body includes `{"id":"course-site","name":"課程教學站",...}`

#### Scenario: Unauthenticated request is denied

- **WHEN** `GET /api/templates` is called without a valid session
- **THEN** the server MUST return HTTP 401

### Requirement: Marketplace page includes a template selection tab

The `/marketplace` page SHALL render two tabs: one for listing enabled modules (from `MOUNT_POINTS`) and one for template selection (from `SITE_TEMPLATES`). The template tab SHALL display each template as a preview card with name, description, and preview image.

#### Scenario: Template tab displays preview cards

- **WHEN** a signed-in user navigates to `/marketplace` and selects the template tab
- **THEN** the page MUST display at least 2 template preview cards, each showing the template name and a preview image

#### Scenario: Template detail view shows AI prompt hint

- **WHEN** a signed-in user clicks a template preview card
- **THEN** the page MUST display the template's `description`, `aiPromptHint`, and a visual guide explaining how to apply the template using an AI tool

### Requirement: Each template has a static HTML demo approved before implementation

Every built-in template's visual design SHALL be prototyped as a static HTML demo file using tokens from DESIGN.md before any React component code is written. The demo file MUST exist in the repository and MUST have been reviewed before the corresponding React implementation task begins.

#### Scenario: Demo file exists for each template

- **WHEN** the repository is inspected for template demos
- **THEN** for each entry in `SITE_TEMPLATES`, a corresponding HTML demo file MUST exist in `docs/design-system-demo/templates/`

### Requirement: Templates connect to mount points through defaultMountConfig

A `SiteTemplate`'s `defaultMountConfig` field SHALL be an array of `Partial<PluginManifest>` objects describing which mount points to enable and in what order. An AI tool applying a template SHALL read this config and update the `MOUNT_POINTS` static array accordingly. The template mechanism MUST NOT introduce a separate runtime configuration layer beyond what `MOUNT_POINTS` already provides.

#### Scenario: Template config is compatible with PluginManifest type

- **WHEN** a `SiteTemplate.defaultMountConfig` entry is assigned to a `Partial<PluginManifest>` variable
- **THEN** the TypeScript compiler MUST accept the assignment without error

#### Scenario: Applying a template does not require runtime configuration

- **WHEN** an AI tool applies a template by updating the `MOUNT_POINTS` array and CSS token overrides
- **THEN** the site MUST reflect the template's layout after a rebuild, without any runtime configuration database or API call
