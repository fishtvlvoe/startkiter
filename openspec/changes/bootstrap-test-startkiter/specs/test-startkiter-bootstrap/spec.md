## ADDED Requirements

### Requirement: Private TEST repository exists
The operator SHALL maintain a private GitHub repository named `test-startkiter` under the project owner account for dirty dogfood deploy. This repository MUST NOT be the learner kit repository and MUST NOT be the clean install-package repository.

#### Scenario: TEST repo is private and named correctly
- **WHEN** an operator inspects GitHub for the StartKiter test deploy surface
- **THEN** a private repository named `test-startkiter` MUST exist

### Requirement: Vercel deploys from TEST repository
The TEST repository SHALL be connected to a Vercel project that builds the SaaS app from the monorepo (`apps/saas`). Successful git push to the default branch MUST trigger a deployment attempt.

#### Scenario: Vercel project is linked
- **WHEN** an operator checks Vercel project settings for StartKiter TEST
- **THEN** the project MUST list `test-startkiter` as its git repository and MUST target the SaaS app build

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
