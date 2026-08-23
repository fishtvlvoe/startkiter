## ADDED Requirements

### Requirement: Paid buyers receive a dedicated writable repository generated from the StartKiter template

Upon successful kit claim, the system SHALL generate a dedicated private repository for the buyer using the GitHub "generate repository from template" API, sourced from the `GITHUB_KIT_TEMPLATE_REPO` template repository. The generated repository MUST remain organization-owned. The buyer's GitHub account MUST be granted `write` permission on this dedicated repository, not `pull`.

#### Scenario: Successful claim generates a dedicated repository

- **WHEN** a paid user with kitClaimEligible true completes GitHub OAuth and POST /api/github/claim runs
- **THEN** the system MUST call the GitHub API to generate a new private repository from `GITHUB_KIT_TEMPLATE_REPO`, invite the buyer's GitHub account with `write` permission, and MUST NOT invite the buyer into a repository shared with other buyers

##### Example: 專屬倉庫生成

- 使用者 bob@example.com（GitHub 帳號 bob-dev）完成 MVP 付款並通過 GitHub OAuth
- 系統呼叫 GitHub template generate API，在 org 下建立 `org/kit-ord_9001`，邀請 bob-dev 進入並授予 write 權限

#### Scenario: Missing template repo configuration fails closed

- **WHEN** `GITHUB_KIT_TEMPLATE_REPO` is not configured and an entitled user calls POST /api/github/claim
- **THEN** the response MUST be HTTP 503 and MUST NOT create a partially-completed grant record

### Requirement: Version comparison API reports whether the buyer's repository is behind the template

`GET /api/repo-version` SHALL require a valid session and return the buyer's repository version, the template repository's latest version, and whether the buyer's repository is up to date. Version values SHALL be read from a `STARTKITER_VERSION` file at the root of each repository.

#### Scenario: Buyer repository is up to date

- **WHEN** the buyer's `STARTKITER_VERSION` content equals the template repository's `STARTKITER_VERSION` content
- **THEN** `GET /api/repo-version` MUST return `upToDate: true`

#### Scenario: Buyer repository is behind

- **WHEN** the buyer's `STARTKITER_VERSION` content differs from the template repository's `STARTKITER_VERSION` content
- **THEN** `GET /api/repo-version` MUST return `upToDate: false` along with a non-empty `syncPromptHint` string

#### Scenario: Missing version file on either side returns an indeterminate result

- **WHEN** `STARTKITER_VERSION` cannot be read from the buyer's repository or from the template repository
- **THEN** `GET /api/repo-version` MUST return `upToDate: null` and MUST NOT return `upToDate: true`

#### Scenario: Unauthenticated request is denied

- **WHEN** `GET /api/repo-version` is called without a valid session
- **THEN** the server MUST return HTTP 401

### Requirement: Marketplace surfaces an AI-executable sync prompt when a new version is available

The `/marketplace` page SHALL render a version section showing the buyer's repository version against the template repository's latest version. When the repositories are not in sync, the page SHALL display the `syncPromptHint` text in a way the buyer can copy and hand to their own AI tool.

#### Scenario: Version section hidden when up to date

- **WHEN** a signed-in buyer whose repository is up to date views `/marketplace`
- **THEN** the version section MUST indicate the repository is current and MUST NOT display a sync prompt

#### Scenario: Version section shows sync prompt when behind

- **WHEN** a signed-in buyer whose repository is behind views `/marketplace`
- **THEN** the version section MUST display the `syncPromptHint` text in a copyable form

### Requirement: Repository synchronization is buyer-triggered only

The system MUST NOT push, merge, or otherwise modify a buyer's repository content on its own initiative to deliver an update. Synchronization SHALL only occur when the buyer's own AI tool executes git commands the buyer instructed it to run.

#### Scenario: No background job writes to buyer repositories

- **WHEN** the StartKiter template repository's `STARTKITER_VERSION` changes
- **THEN** no automated process MUST push, merge, or open a pull request against any buyer's dedicated repository
