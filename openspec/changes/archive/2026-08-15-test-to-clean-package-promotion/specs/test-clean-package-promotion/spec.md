## ADDED Requirements

### Requirement: Two-repository boundary
The project SHALL maintain a TEST repository and a separate clean install-package repository. The TEST repository SHALL be private, named `test-<project-name>` for StartKiter (`test-startkiter`), and by design holds dirty dogfood content (test accounts, test media, install-tooling clutter, company content). The clean install-package repository SHALL contain only the shippable shell (app skeleton, frontend shell, database schema and required seeds) comparable in cleanliness to the purchased starter package. The learner lifetime kit repository SHALL remain a third, unrelated fulfillment line.

#### Scenario: Roles are distinct
- **WHEN** an operator asks which repository is for dirty deploy testing versus customer install package
- **THEN** documentation and this capability identify TEST as the dirty private dogfood deploy line and the clean install-package repository as the customer-facing package with no company marketing content

#### Scenario: Learner kit is not TEST
- **WHEN** a paid learner claims the GitHub kit
- **THEN** the invitation target MUST NOT be the TEST repository used for StartKiter dogfood deploy

### Requirement: Promotion gate from TEST to clean package
Material MUST move from TEST into the clean install-package repository only through an explicit promotion that passes the promotion checklist. Renaming the dirty TEST repository to serve as the clean package, or publishing the dirty TEST history as the customer package, is forbidden.

#### Scenario: Explicit promotion required
- **WHEN** a feature exists only on TEST
- **THEN** it MUST NOT appear in the clean install-package repository until promotion checklist items pass

#### Scenario: Forbidden rename path
- **WHEN** someone proposes shipping customers from the dirty TEST repository by renaming or repointing production to TEST
- **THEN** that approach is rejected by this capability

### Requirement: Promotion forbid list
Promotion into the clean install-package repository MUST exclude company Landing pages and article content, test accounts and test media, install-tooling clutter that is not part of the shippable shell, company-specific domains and credential examples, and Cloudflare Tunnel as an OAuth or integration-test primary path.

#### Scenario: Company landing stays on TEST
- **WHEN** TEST contains company Landing or article pages
- **THEN** promotion MUST NOT copy those pages into the clean install-package repository

#### Scenario: Tunnel is not the primary public test path
- **WHEN** OAuth or integration testing needs a public HTTPS URL
- **THEN** the system of record MUST direct operators to the TEST hosted deploy (for example Vercel or VPS) with cloud database, not Cloudflare Tunnel to localhost as the primary path

### Requirement: Hotfix flow
After the clean install-package repository has been published to customers, security and correctness hotfixes MUST land in the clean install-package repository first, then be backported to TEST. Before any customer publication of the clean package, hotfixes SHALL land on TEST only and SHALL be promoted later.

#### Scenario: Post-publish hotfix order
- **WHEN** the clean package has been given to customers and a security fix is required
- **THEN** the fix MUST be applied to the clean install-package repository before or as the source of truth, and MUST be backported to TEST

#### Scenario: Pre-publish hotfix on TEST only
- **WHEN** the clean package has not yet been published to customers
- **THEN** the hotfix SHALL land on TEST only and SHALL be promoted later

### Requirement: Drift acknowledgment and review cadence
Operators SHALL treat running TEST content and the clean install-package contents as intentionally different until promotion. After each feature change is archived, operators SHALL review whether any clean-package-eligible material needs promotion.

#### Scenario: Dogfood differs from package
- **WHEN** TEST has experimental UI that has not been promoted
- **THEN** the clean install-package repository MUST remain without that experimental UI

#### Scenario: Post-archive promotion review
- **WHEN** a feature Spectra change is archived
- **THEN** operators SHALL check the promotion checklist for any material that must move into the clean install-package repository
