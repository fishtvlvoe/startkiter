## ADDED Requirements

### Requirement: Buyer can create and edit page or post content
The system SHALL allow an authenticated buyer operator to create, edit, and save Page or Post content records through the pages management admin UI, without requiring a code change or redeployment.

#### Scenario: Buyer creates a new post as draft
- **WHEN** a buyer operator submits a new content record with `type: POST`, a title, a slug, body content, and `locale`
- **THEN** the system SHALL create a `Page` record with `status: DRAFT` and SHALL NOT expose it on the public site

#### Scenario: Buyer publishes a draft
- **WHEN** a buyer operator changes an existing `DRAFT` record's status to `PUBLISHED`
- **THEN** the system SHALL set `publishedAt` to the current timestamp and the content SHALL become reachable at its public URL within 30 seconds without a new deployment

#### Scenario: Non-operator cannot access the pages management API
- **WHEN** a request to any pages-cms API endpoint is made by an authenticated user who is not the site operator
- **THEN** the system SHALL respond with HTTP 401 or 403 and SHALL NOT create, modify, or delete any `Page` record

### Requirement: Content is sanitized before storage
The system SHALL sanitize all HTML/MDX body content against an explicit allow-list of tags before writing it to the database. The database MUST NOT persist disallowed tags or attributes such as `<script>`, inline event handler attributes (e.g. `onerror`), or `javascript:` URIs.

#### Scenario: Script tag is stripped on save
- **WHEN** a buyer operator submits body content containing a `<script>` tag
- **THEN** the system SHALL remove the `<script>` tag before persisting the record and SHALL include a non-empty `warnings` array in the response describing the removed content

##### Example: known XSS payloads are neutralized
| Input fragment | Persisted result |
| --- | --- |
| `<script>alert(1)</script>` | tag removed entirely |
| `<img src=x onerror=alert(1)>` | `onerror` attribute removed, `<img>` kept if `src` is a safe URL |
| `<a href="javascript:alert(1)">click</a>` | `href` attribute removed or rejected |

#### Scenario: Allowed formatting tags are preserved
- **WHEN** a buyer operator submits body content containing only allow-listed tags (`p`, `h1`-`h6`, `ul`, `ol`, `li`, `a`, `img`, `strong`, `em`, `blockquote`, `code`)
- **THEN** the system SHALL persist the content unchanged and the response `warnings` array SHALL be empty

### Requirement: Slug must not collide with reserved routes or existing content
The system SHALL reject a create or update request when the submitted slug matches a reserved system path or matches an existing `Page` record's slug within the same locale.

#### Scenario: Slug matches a reserved mount point path
- **WHEN** a buyer operator submits a slug whose first path segment matches an entry derived from the platform's mount point route registry (for example `admin`, `api`, `auth`)
- **THEN** the system SHALL reject the request with HTTP 400 and an error code of `SLUG_RESERVED`, and SHALL NOT create or update the record

#### Scenario: Slug already used in the same locale
- **WHEN** a buyer operator submits a slug that already exists on another `Page` record with the same `locale`
- **THEN** the system SHALL reject the request with HTTP 400 and an error code of `SLUG_TAKEN`, and SHALL NOT silently rename or truncate the slug

### Requirement: Buyer can restore the previous version of a content record
The system SHALL retain the immediately prior state of a `Page` record's editable fields whenever it is updated, and SHALL allow the buyer operator to restore that prior state.

#### Scenario: Restore after an unwanted edit
- **WHEN** a buyer operator calls the restore endpoint for a `Page` record that has been updated at least once
- **THEN** the system SHALL overwrite the record's current fields with the values captured immediately before the most recent update, and SHALL capture the just-replaced state as the new restorable snapshot

#### Scenario: Restore requested with no prior snapshot
- **WHEN** a buyer operator calls the restore endpoint for a `Page` record that has never been updated since creation
- **THEN** the system SHALL respond with HTTP 409 and SHALL NOT modify the record

### Requirement: Published content is included in the site's sitemap
The system SHALL include every `PUBLISHED` database-backed `Page` record, in addition to existing file-based content, when generating the marketing site's sitemap.

#### Scenario: Newly published database page appears in sitemap
- **WHEN** a `Page` record with `status: PUBLISHED` exists for a given locale
- **THEN** the generated sitemap for that locale SHALL include a URL entry for that record's slug within the sitemap's cache refresh window

#### Scenario: Draft or archived content is excluded from sitemap
- **WHEN** a `Page` record has `status: DRAFT` or `status: ARCHIVED`
- **THEN** the generated sitemap SHALL NOT include a URL entry for that record

### Requirement: This capability is a fixed Core capability, not a replaceable Plugin
The pages management capability SHALL be implemented within the platform's Core boundary (`packages/platform`) and SHALL NOT be structured so that a buyer-installed Plugin can override, replace, or bypass it.

#### Scenario: Plugin manifest cannot declare the pages-cms mount point id
- **WHEN** a Plugin manifest attempts to register a mount point using the reserved id `pages-cms`
- **THEN** the system SHALL reject the manifest registration and SHALL NOT allow the Plugin's content to be served at that mount point

### Requirement: Existing file-based content can be migrated into the database
The system SHALL provide a migration script that reads existing `.mdx` content files and produces corresponding `Page` records, supporting a dry-run mode that reports what would be created without writing to the database.

#### Scenario: Dry run reports intended changes without writing
- **WHEN** the migration script is invoked with a `--dry-run` flag against a directory of `.mdx` files
- **THEN** the system SHALL output the count of records that would be created and a list of any files that failed to parse, and SHALL NOT write any `Page` record to the database

#### Scenario: Real run creates records from valid files
- **WHEN** the migration script is invoked without `--dry-run` against `.mdx` files with valid frontmatter (`title`, `date`, `tags`, `published`)
- **THEN** the system SHALL create one `Page` record per file, mapping `title` to `title`, `date` to `publishedAt`, `tags` to `tags`, and `published: true` to `status: PUBLISHED`
