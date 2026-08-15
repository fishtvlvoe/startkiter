## ADDED Requirements

### Requirement: Private TEST repository exists
The operator SHALL maintain a private GitHub repository named `test-startkiter` under the project owner account for dirty dogfood deploy. This repository MUST NOT be the learner kit repository and MUST NOT be the clean install-package repository.

#### Scenario: TEST repo is private and named correctly
- **WHEN** an operator inspects GitHub for the StartKiter test deploy surface
- **THEN** a private repository named `test-startkiter` MUST exist

### Requirement: Vercel deploys the TEST SaaS app
The operator SHALL maintain a Vercel project that builds the SaaS app from the monorepo (`apps/saas`, typically via project `rootDirectory`). At least one successful production deployment MUST exist. If Vercel GitHub Login Connection is not yet available, documentation MUST record that push-triggered deploys are pending and that CLI/`vercel deploy` is the interim path; once Login Connection exists, the project MUST connect `test-startkiter` so default-branch pushes trigger deploys.

#### Scenario: Vercel project builds saas and has a production deploy
- **WHEN** an operator checks the StartKiter TEST Vercel project and recent production deployments
- **THEN** the project MUST target the SaaS app build and MUST show at least one successful production deployment

#### Scenario: Git auto-deploy pending is documented
- **WHEN** GitHub Login Connection blocks `vercel git connect`
- **THEN** `docs/deploy-and-public-url.md` MUST state the pending blocker and the interim CLI deploy path, and MUST NOT claim push auto-deploy is already live

### Requirement: Cloud database for TEST
The TEST deploy SHALL use a cloud Postgres connection string configured in Vercel environment variables (not localhost). Documentation MUST record which provider is used and that secrets MUST NOT be committed to git.

#### Scenario: DATABASE_URL is cloud-hosted
- **WHEN** the TEST deployment reads DATABASE_URL
- **THEN** the value MUST point to a non-localhost Postgres host and MUST be stored in Vercel env (or equivalent secret store), not in tracked source files

### Requirement: Public HTTPS base URL documented for OAuth
Documentation SHALL record the TEST public HTTPS base URL used for `BETTER_AUTH_URL` and OAuth callback examples. Cloudflare Tunnel to localhost MUST NOT be documented as the primary TEST path.

#### Scenario: Docs name the TEST HTTPS origin
- **WHEN** an operator opens `docs/deploy-and-public-url.md` after this change
- **THEN** the document MUST include the TEST HTTPS origin (or explicit pending placeholder) and MUST keep Tunnel marked as retired for primary OAuth testing
