## MODIFIED Requirements

### Requirement: Promotion gate from TEST to clean package
Material MUST move from TEST into the clean install-package repository only through an explicit promotion that passes the promotion checklist and automated verification. Renaming the dirty TEST repository to serve as the clean package, or publishing the dirty TEST history as the customer package, is forbidden. The clean install-package repository SHALL be maintained as an independent repository named `fishtvlvoe/startkiter-starter-kit` (or equivalent clean release repository) and SHALL contain only clean release commit histories.

#### Scenario: Explicit promotion required
- **WHEN** a feature exists only on TEST
- **THEN** it MUST NOT appear in the clean install-package repository until all promotion checklist items and automated validation steps pass

#### Scenario: Forbidden rename path
- **WHEN** someone proposes shipping customers from the dirty TEST repository by renaming or repointing production to TEST
- **THEN** that approach is rejected by this capability

#### Scenario: Independent clean package repository destination
- **WHEN** promotion is executed
- **THEN** artifacts and clean codebase MUST be exported to the dedicated clean package repository (`fishtvlvoe/startkiter-starter-kit`) rather than a branch on `test-startkiter`

---

### Requirement: Promotion forbid list
Promotion into the clean install-package repository MUST exclude company Landing pages and article content, test accounts and test media, install-tooling clutter that is not part of the shippable shell, company-specific domains and credential examples, demo-only routes and grant buttons (`/api/demo/*`, `demo-grant-button.tsx`), and Cloudflare Tunnel as an OAuth or integration-test primary path. Automated promotion tools MUST perform keyword and secret scanning to detect forbidden terms before promotion is approved.

#### Scenario: Company landing stays on TEST
- **WHEN** TEST contains company Landing or article pages
- **THEN** promotion MUST NOT copy those pages into the clean install-package repository

#### Scenario: Demo routes and mock tools excluded
- **WHEN** TEST contains demo grant endpoints (`apps/saas/app/api/demo/grant-course/route.ts`) or mock inspection clutter
- **THEN** promotion filter MUST exclude them from the clean install-package repository

#### Scenario: Secret and domain leak prevention
- **WHEN** files staged for promotion contain company internal domains (`startkiter.aiver.me`) or test secret tokens
- **THEN** the promotion process MUST abort with a non-zero exit code

## ADDED Requirements

### Requirement: Automated promotion script execution
The system SHALL provide an automated promotion CLI script at `tooling/scripts/promote-clean-package.ts`. The script SHALL support a `--dry-run` flag to display included/excluded files without modifying the target repository, and a `--target` flag to specify the destination directory. The script SHALL automatically execute dependency installation, type checking, build verification, and test execution on the target directory prior to completing promotion.

#### Scenario: Dry run inspection
- **WHEN** an operator runs `pnpm tsx tooling/scripts/promote-clean-package.ts --dry-run`
- **THEN** the script outputs a list of all included and excluded files and verifies cleanliness without writing changes to the clean package repository

#### Scenario: Validation failure halts promotion
- **WHEN** type checking, build, or test fails on the clean package export
- **THEN** the promotion script terminates immediately with an error and does not commit or publish to the clean repository
